import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { getPmSchema } from "@/components/prosemirror/pmSchema";
import { createContext } from "@/utils/createContext";
import { plainTextToTextContent } from "@/utils/pm";
import { type Fragment, Node } from "prosemirror-model";
import { ref, watch } from "vue";
import { z } from "zod";
import BlocksContext from "./blocks/blocks";
import type { Block, MinimalBlock } from "./blocks/view-layer/blocksManager";
import { useEventBus } from "@/plugins/eventbus";

// 块可以添加属性，就像给笔记添加标签或元数据。例如：
// - 书籍：1984
//   - [[作者]]: [[乔治·奥威尔]]
//   - [[出版年份]]: 1949
//   - [[标签]]
//     - [[反乌托邦]]
//     - [[小说]]
//
// 属性的工作方式：
// 1. 属性名（如[[作者]]）必须先设置为 Field 才能触发解析
// 2. 每个属性可以存储不同类型的值：
//    - 文本内容 (richtext)
//    - 引用其他块 (blockRef)
//    - 引用文件 (fileRef)
//    - 列表，可以包含多个值 (array)，元素类型可以是 richtext, blockRef, block
//
// getFieldValues() 可以获取一个块的所有属性值：
// {
//   "作者": "乔治·奥威尔的块ID",
//   "出版年份": "1949",
//   "标签": ["反乌托邦的块ID", "小说的块ID"]
// }

const fieldValueTypeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("richtext") }),
  z.object({ type: z.literal("blockRef") }),
  z.object({ type: z.literal("fileRef") }),
  z.object({
    type: z.literal("array"),
    itemType: z.enum(["richtext", "blockRef", "block", "fileRef"]),
  }),
]);

export type FieldValueType = z.infer<typeof fieldValueTypeSchema>;

const fieldMetadataSchema = z.object({
  buildIndex: z.boolean().optional(),
  valueType: fieldValueTypeSchema,
});

export type FieldMetadataType = z.infer<typeof fieldMetadataSchema>;

type Eater<CTX> = (content: Fragment | null, ctx?: CTX) => Fragment | null;

const FieldsManagerContext = createContext(() => {
  const { blocksManager, synced } = BlocksContext.useContext()!;
  const eventBus = useEventBus();
  const allFields = ref<Map<string, MinimalBlock>>(new Map());
  const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });

  const isField = (blockId: BlockId) => {
    return allFields.value.has(blockId);
  };

  eventBus.on("afterBlocksTrCommit", ([tr]) => {
    for (const patch of tr.patches) {
      if (patch.op === "delete") {
        allFields.value.delete(patch.blockId);
      } else if (patch.op === "add" || patch.op === "update") {
        if (patch.block.type !== "normalBlock") continue;
        if (!patch.block.metadata?.field) continue;
        allFields.value.set(patch.block.id, patch.block);
      }
    }
  });

  ///////////////////////////// 默认 Fields ////////////////////////////////

  // 除了用户可以指定一个块为 Field，系统也会自动创建一些默认的 Field
  // 默认的 Alias 为了方便读，其 id 就是显示文字。
  // 默认的 Fidls 有：
  // 1. Alias：用于定义块别名，类型为 array[block]

  watch(
    synced,
    (newValue, oldValue) => {
      // not synced -> synced
      if (!oldValue && newValue) {
        const aliasBlock = blocksManager.getBlock("Alias");
        if (aliasBlock) return;
        const tr = blocksManager.createBlockTransaction({ type: "ui" });
        const fieldMetadata: FieldMetadataType = {
          buildIndex: true,
          valueType: {
            type: "array",
            itemType: "block",
          },
        };
        tr.addBlock({
          id: "alias",
          type: "normalBlock",
          fold: false,
          parentId: "_internal", // 内部块的 parentId 都是 _internal
          childrenIds: [],
          content: plainTextToTextContent("Alias", schema),
          metadata: { field: fieldMetadata },
        });
        tr.commit();
      }
    },
    { immediate: true },
  );

  ////////////////////////////// Parser /////////////////////////////////////

  // 解析属性名和分隔符（例如：[[作者]]:），如果成功解析，则将属性名放到 ctx.fieldName 中
  // 返回去掉属性名和分隔符后的剩余内容
  const eatFieldAndSeparator: Eater<{ fieldName: string }> = (content, ctx) => {
    if (!content) return null;
    let fst = content.firstChild;
    if (!fst || fst.type.name !== "blockRef_v2") return null;
    const fieldName = fst.attrs.toBlockId;
    if (!isField(fieldName)) return null;
    content = content.cut(fst.nodeSize);
    fst = content.firstChild;
    if (fst && fst.isText) {
      const text = fst.text;
      if (!text || (!text.startsWith(":") && !text.startsWith("："))) return null;
      content = content.cut(1);
    }
    ctx && (ctx.fieldName = fieldName);
    return content;
  };

  // 解析空白字符（例如："  "），如果成功解析，则将空白字符的长度放到 ctx.cutSize 中
  // 返回去掉空白字符后的剩余内容
  const eatWhitespace: Eater<{ cutSize: number }> = (content, ctx) => {
    if (!content) return null;
    let fst = content.firstChild;
    if (fst && fst.isText) {
      const text = fst.text;
      if (!text) return null;
      const leadingSpaceCount = text.search(/\S|$/);
      content = content.cut(leadingSpaceCount);
      ctx && (ctx.cutSize = leadingSpaceCount);
    }
    return content;
  };

  // 解析块引用（例如：[[作者]]），如果成功解析，则将块引用放到 ctx.toBlockId 中
  // 返回去掉块引用后的剩余内容
  const eatBlockRef: Eater<{ toBlockId: string; tag: string }> = (content, ctx) => {
    if (!content) return null;
    let fst = content.firstChild;
    if (!fst || fst.type.name !== "blockRef_v2") return null;
    const { toBlockId, tag } = fst.attrs ?? {};
    content = content.cut(fst.nodeSize);
    ctx && (ctx.toBlockId = toBlockId);
    ctx && (ctx.tag = tag);
    return content;
  };

  // 解析文件引用（例如：[[audio.mp3]]），如果成功解析，则将文件引用放到 ctx.toBlockId 中
  // 返回去掉文件引用后的剩余内容
  const eatFileRef: Eater<{ path: string }> = (content, ctx) => {
    if (!content) return null;
    let fst = content.firstChild;
    if (!fst || fst.type.name !== "pathRef") return null;
    const { path } = fst.attrs ?? {};
    content = content.cut(fst.nodeSize);
    ctx && (ctx.path = path);
    return content;
  };

  /////////////////////////////////////////////////////////////////////

  // 设置一个块的 Field 元数据
  // 如果 metadata 为 null 或 undefined，则移除该块的 Field 元数据，也就是让这个块不能用作 Field
  const setBlockFieldMetadata = (
    blockId: BlockId,
    metadata: FieldMetadataType | null | undefined,
  ) => {
    const block = blocksManager.getBlock(blockId);
    if (!block || block.type !== "normalBlock") {
      throw new Error(`Field ${blockId} not found`);
    }
    const newMetadata = block.metadata ?? {};
    if (!metadata) delete newMetadata.field;
    else newMetadata.field = metadata;
    blocksManager.updateBlock(
      {
        ...block,
        metadata: newMetadata,
      },
      { type: "ui" },
    );
  };

  // 获取一个块的 Field 元数据
  const getFieldMetadata = (blockId: BlockId): FieldMetadataType | null => {
    const block = allFields.value.get(blockId);
    if (!block) return null;
    const res = fieldMetadataSchema.safeParse(block.metadata?.field);
    return res.success ? res.data : null;
  };

  const parseFieldValues = (block: Block | null | undefined) => {
    if (!block || block.type !== "normalBlock" || block.content[0] !== BLOCK_CONTENT_TYPES.TEXT)
      return;

    let content: Fragment | null = null;
    try {
      content = Node.fromJSON(schema, block.content[1]).content;
    } catch (e) {}
    if (!content) return;

    const ctx = {} as any;

    content = eatFieldAndSeparator(content, ctx);
    if (!content || !ctx.fieldName || !isField(ctx.fieldName)) return;

    const metadata = getFieldMetadata(ctx.fieldName);
    if (!metadata) return;

    if (metadata.valueType.type === "richtext") {
      return { fieldName: ctx.fieldName, metadata, value: content };
    } else if (metadata.valueType.type === "blockRef") {
      const ctx = {} as any;
      content = eatFieldAndSeparator(content);
      content = eatWhitespace(content);
      content = eatBlockRef(content, ctx);
      if (!content) return;
      return { fieldName: ctx.fieldName, metadata, value: ctx.toBlockId };
    } else if (metadata.valueType.type === "fileRef") {
      const ctx = {} as any;
      content = eatFieldAndSeparator(content);
      content = eatWhitespace(content);
      content = eatFileRef(content, ctx);
      if (!content) return;
      return { fieldName: ctx.fieldName, metadata, value: ctx.path };
    } else {
      // array
      let arr: any[] = [];
      for (const childBlockRef of block.childrenRefs) {
        const childBlock = childBlockRef.value;
        if (
          !childBlock ||
          childBlock.type !== "normalBlock" ||
          childBlock.content[0] !== BLOCK_CONTENT_TYPES.TEXT
        )
          continue;

        let content: Fragment | null = null;
        try {
          content = Node.fromJSON(schema, childBlock.content[1]).content;
        } catch (e) {}
        if (!content) return;

        if (metadata.valueType.itemType === "richtext") {
          arr.push(content);
        } else if (metadata.valueType.itemType === "blockRef") {
          const ctx = {} as any;
          content = eatWhitespace(content);
          content = eatBlockRef(content, ctx);
          if (!content) return;
          arr.push(ctx.toBlockId);
        } else if (metadata.valueType.itemType === "fileRef") {
          const ctx = {} as any;
          content = eatWhitespace(content);
          content = eatFileRef(content, ctx);
          if (!content) return;
          arr.push(ctx.path);
        } else if (metadata.valueType.itemType === "block") {
          arr.push(childBlock.id);
        }
      }
      return { fieldName: ctx.fieldName, metadata, value: arr };
    }
  };

  // e.g.
  // - 1984
  //   - [[Author]]: [[George Orwell]]
  //   - [[Year]]: 1949
  //   - [[Tags]]
  //     - [[Dystopia]]
  //     - [[Fiction]]
  // getFieldValues("{{blockId of 1984}}") 会返回
  // {
  //   "Author": "George Orwell",
  //   "Year": "1949",
  //   "Tags": ["Dystopia", "Fiction"]
  // }
  const getFieldValues = (blockId: BlockId) => {
    const block = blocksManager.getSrcBlock(blockId);
    if (!block) return null;

    const ret: Record<string, any> = {};
    for (const childBlockRef of block.childrenRefs) {
      const childBlock = childBlockRef.value;
      if (!childBlock) continue;
      const res = parseFieldValues(childBlock);
      if (!res) continue;
      const { fieldName, metadata, value } = res;
      ret[fieldName] = value;
    }

    return ret;
  };

  const ctx = {
    allFields,
    setBlockFieldMetadata,
    getFieldMetadata,
    getFieldValues,
  };
  return ctx;
});

export default FieldsManagerContext;
