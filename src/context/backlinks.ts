import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { createContext } from "@/utils/createContext";
import useLocalStorage2 from "@/utils/useLocalStorage";
import useWritableComputedRef from "@/utils/useWritableComputedRef";
import { computed } from "vue";
import { z } from "zod";
import IndexContext from ".";
import BlocksContext from "./blocks/blocks";
import FieldsManagerContext from "./fieldsManager";
import ServerInfoContext from "./serverInfo";
import SettingsContext from "./settings";
import type { TextContent } from "@/common/type-and-schemas/block/block-content";
import type { Block } from "./blocks/view-layer/blocksManager";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { Node } from "prosemirror-model";
import { getPmSchema } from "@/components/prosemirror/pmSchema";
import { useTaskQueue } from "@/plugins/taskQueue";
import type { NonNormalizedBlockPosParentChild } from "./blocks/view-layer/blocksEditor";
import { blockRefToTextContent } from "@/utils/pm";

const BacklinksContext = createContext(() => {
  const { registerSettingGroup, registerSettingItem } = SettingsContext.useContext()!;
  const { blocksManager, blockEditor } = BlocksContext.useContext()!;
  const { getBacklinks } = IndexContext.useContext()!;
  const { getFieldValues } = FieldsManagerContext.useContext()!;
  const { kbPrefix } = ServerInfoContext.useContext()!;

  const blockIdValidator = (value: string) => {
    if (!value) return "没有指定块 ID";
    const block = blocksManager.getBlock(value);
    return block ? undefined : "无效的块 ID";
  };

  registerSettingGroup({
    key: "backlinks",
  });

  const showBacklinksCounterId = "backlinks.showCounter";
  const showBacklinksCounterKey = computed(() => `${kbPrefix.value}${showBacklinksCounterId}`);
  const showBacklinksCounterDefaultValue = true;
  const showBacklinksCounter = useLocalStorage2(
    showBacklinksCounterKey,
    showBacklinksCounterDefaultValue,
  );
  registerSettingItem({
    id: showBacklinksCounterId,
    groupKey: "backlinks",
    defaultValue: showBacklinksCounterDefaultValue,
    value: useWritableComputedRef(showBacklinksCounter),
    componentType: {
      type: "switch",
    },
  });

  const putNewBlockAtId = "backlinks.putNewBlockAt";
  const putNewBlockAtKey = computed(() => `${kbPrefix.value}${putNewBlockAtId}`);
  const putNewBlockAtDefaultValue = "";
  const putNewBlockAt = useLocalStorage2(putNewBlockAtKey, putNewBlockAtDefaultValue);
  registerSettingItem({
    id: putNewBlockAtId,
    groupKey: "backlinks",
    defaultValue: putNewBlockAtDefaultValue,
    value: useWritableComputedRef(putNewBlockAt),
    componentType: { type: "blockIdInput" },
  });

  // 暂时没有考虑
  // - A
  //   - [[Alias]]
  //     - B
  //       - [[Alias]]
  //         - C
  // 这种阴间的情况
  const getAllAliases = (blockId: BlockId, includeSelf = true) => {
    const ret: BlockId[] = includeSelf ? [blockId] : [];
    const fieldValues = getFieldValues(blockId) ?? {};
    // 情况 1：
    // - this block
    //   - [[Alias]]
    //     - alias1
    //     - ...
    if ("Alias" in fieldValues) {
      const aliases = fieldValues.Alias;
      const res = z.array(z.string()).safeParse(aliases);
      if (res.success) {
        ret.push(...res.data);
      }
      return ret;
    }
    // 情况 2：
    // - parent block
    //   - [[Alias]]
    //     - this block
    {
      const block = blocksManager.getBlock(blockId);
      if (!block) return ret;
      const parentBlock = block.parentRef.value;
      const parentParentBlock = parentBlock?.parentRef.value;
      if (!parentParentBlock) return ret;
      const fieldValues = getFieldValues(parentParentBlock.id) ?? {};
      if ("Alias" in fieldValues) {
        const aliases = fieldValues.Alias;
        const res = z.array(z.string()).safeParse(aliases);
        if (res.success) {
          ret.push(...res.data);
        }
        return ret;
      }
    }
    return ret;
  };

  const isAliasBlock = (block: Block) => {
    if (block.content[0] !== BLOCK_CONTENT_TYPES.TEXT) return false;
    const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
    const doc = Node.fromJSON(schema, block.content[1]);
    if (doc.content.size === 1) {
      const fst = doc.content.firstChild;
      if (fst && fst.type.name === "blockRef_v2") {
        if (fst.attrs.toBlockId === "Alias") return true;
      }
    }
    return false;
  };

  const addAlias = (blockId: BlockId, aliasContent: TextContent) => {
    const block = blocksManager.getBlock(blockId);
    if (!block) return;
    const taskQueue = useTaskQueue();
    const parentBlock = block.parentRef.value;
    if (!parentBlock) return;
    const parentActualSrcBlock =
      parentBlock.type === "normalBlock"
        ? parentBlock
        : blocksManager.getBlock(parentBlock.acturalSrc);
    if (!parentActualSrcBlock) return;
    // - original name
    //   - [[Alias]]
    //     - alias 1 <-- 当前这个 block
    if (isAliasBlock(parentActualSrcBlock)) {
      taskQueue.addTask(() => {
        const pos: NonNormalizedBlockPosParentChild = {
          parentId: parentBlock.id,
          childIndex: "last-space",
        };
        blockEditor.insertNormalBlock({
          pos,
          content: aliasContent,
        });
      });
    } else {
      // 当前这个 block 不是 alias，则查找孩子中是否有 alias
      let aliasBlock: Block | undefined;
      for (const childRef of block.childrenRefs) {
        const child = childRef.value;
        if (!child) continue;
        if (isAliasBlock(child)) {
          aliasBlock = child;
          break;
        }
      }

      // 找到了 alias block，则在这个 alias block 最后面插入新的 alias
      if (aliasBlock) {
        taskQueue.addTask(() => {
          const pos: NonNormalizedBlockPosParentChild = {
            parentId: aliasBlock.id,
            childIndex: "last-space",
          };
          blockEditor.insertNormalBlock({
            pos,
            content: aliasContent,
          });
        });
      } else {
        // 没有找到 alias block，则创建一个新的 alias block
        taskQueue.addTask(() => {
          const pos: NonNormalizedBlockPosParentChild = {
            parentId: block.id,
            childIndex: "last-space",
          };
          const tr = blocksManager.createBlockTransaction({ type: "ui" });
          const { newNormalBlockId } =
            blockEditor.insertNormalBlock({
              pos,
              content: blockRefToTextContent("Alias"),
            }) ?? {};
          if (!newNormalBlockId) return;
          const pos2: NonNormalizedBlockPosParentChild = {
            parentId: newNormalBlockId,
            childIndex: "last-space",
          };
          blockEditor.insertNormalBlock({
            pos: pos2,
            content: aliasContent,
          });
          tr.commit();
        });
      }
    }
  };

  const getBacklinks2 = (
    blockId: BlockId,
    type: "blockRef" | "tag" | "both" = "both",
    considerAliases = true,
  ) => {
    if (!considerAliases) return getBacklinks(blockId, type);
    const aliases = getAllAliases(blockId);
    const ret = new Set<BlockId>();
    for (const alias of aliases) {
      const blockIds = getBacklinks(alias, type);
      for (const id of blockIds ?? []) {
        ret.add(id);
      }
    }
    return ret;
  };

  const ctx = {
    showBacklinksCounter,
    putNewBlockAt,
    addAlias,
    getAllAliases,
    getBacklinks: getBacklinks2,
  };
  return ctx;
});

export default BacklinksContext;
