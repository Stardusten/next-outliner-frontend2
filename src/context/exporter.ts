import { createContext } from "@/utils/createContext";
import BlocksContext from "./blocks/blocks";
import { DOMSerializer, Node } from "prosemirror-model";
import { getPmSchema } from "@/components/prosemirror/pmSchema";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { Block } from "./blocks/view-layer/blocksManager";
import { ref, toRaw } from "vue";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import prettify from "html-prettify";
import { getBasename } from "@/common/helper-functions/path";

const ExporterContext = createContext(() => {
  const { blocksManager } = BlocksContext.useContext()!;

  const open = ref(false);
  const blockId = ref<BlockId | undefined>(undefined);

  const exportSubtreeToPlainText = (
    rootBlockId: string,
    options: {
      nonFoldOnly?: boolean;
    } = {},
  ) => {
    options.nonFoldOnly ??= false;

    let result = "";
    blocksManager.forDescendants({
      onEachBlock: (b, level) => {
        result += "  ".repeat(level) + "- " + b.ctext + "\n";
      },
      rootBlockId,
      rootBlockLevel: 0,
      nonFoldOnly: options.nonFoldOnly,
      includeSelf: true,
    });
    return result;
  };

  const exportSubtreeToHtml = (
    rootBlockId: string,
    options: {
      nonFoldOnly?: boolean;
    } = {},
  ) => {
    options.nonFoldOnly ??= false;

    const rootEl = document.createElement("ul");
    const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
    const pmSerializer = DOMSerializer.fromSchema(schema);

    const dfs = (block: Block, containerEl: HTMLElement) => {
      if (block.fold && options.nonFoldOnly) return;

      const li = document.createElement("li");
      const content = block.content;
      if (content[0] === BLOCK_CONTENT_TYPES.TEXT) {
        const docNode = Node.fromJSON(schema, block.content[1]);
        const frag = pmSerializer.serializeFragment(docNode.content);
        li.appendChild(frag);
      }

      if (block.childrenRefs.length > 0) {
        const ul = document.createElement("ul");
        for (const childRef of block.childrenRefs) {
          if (childRef.value && !childRef.value.deleted) {
            const rawBlock = toRaw(childRef.value);
            dfs(rawBlock, ul);
          }
        }
        li.appendChild(ul);
      }

      containerEl.appendChild(li);
    };

    const rootBlock = blocksManager.getBlock(rootBlockId);
    if (!rootBlock) {
      console.error("Cannot find root block", rootBlockId);
      return "";
    }
    dfs(rootBlock, rootEl);
    return prettify(rootEl.outerHTML);
  };

  const exportSubtreeToMarkdown = (
    rootBlockId: string,
    options: {
      nonFoldOnly?: boolean;
    } = {},
  ) => {
    options.nonFoldOnly ??= false;

    const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });

    const nodeToMarkdown = (node: any): string => {
      if (node.type.name === "text") {
        let text = node.text;

        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type.name) {
              case "bold":
                text = `**${text}**`;
                break;
              case "italic":
                text = `*${text}*`;
                break;
              case "code":
                text = `\`${text}\``;
                break;
              case "strikethrough":
                text = `~~${text}~~`;
                break;
              case "link":
                text = `[${text}](${mark.attrs.href})`;
                break;
              case "highlight":
                text = `==${text}==`;
                break;
            }
          }
        }
        return text;
      }

      switch (node.type.name) {
        case "mathInline":
          return `$${node.attrs.src}$`;
        case "hardBreak":
          return "\n";
        case "blockRef_v2":
          const refBlock = blocksManager.getBlock(node.attrs.toBlockId);
          if (!refBlock) return "";
          return node.attrs.tag ? `#${refBlock.ctext}` : `[[${refBlock.ctext}]]`;
        case "pathRef":
          return `[${getBasename(node.attrs.path)}](${node.attrs.path})`;
        default:
          return "";
      }
    };

    let result = "";
    blocksManager.forDescendants({
      onEachBlock: (b, level) => {
        const indent = "  ".repeat(level);

        if (b.content[0] === BLOCK_CONTENT_TYPES.TEXT) {
          const doc = Node.fromJSON(schema, b.content[1]);
          let text = "";
          doc.descendants((node) => {
            text += nodeToMarkdown(node);
          });
          result += `${indent}- ${text}\n`;
        } else if (b.content[0] === BLOCK_CONTENT_TYPES.CODE) {
          const [_, code, lang] = b.content;
          result += `${indent}- \`\`\`${lang}\n`;
          const codeLines = code.split("\n");
          for (const line of codeLines) {
            result += `${indent}  ${line}\n`;
          }
          result += `${indent}  \`\`\`\n`;
        } else if (b.content[0] === BLOCK_CONTENT_TYPES.MATH) {
          const [_, formula] = b.content;
          result += `${indent}- $$${formula}$$\n`;
        } else if (b.content[0] === BLOCK_CONTENT_TYPES.IMAGE) {
          const [_, path, align, caption] = b.content;
          const captionText = caption ? ` "${caption}"` : "";
          result += `${indent}- ![${captionText}](${path})\n`;
        } else if (b.content[0] === BLOCK_CONTENT_TYPES.VIDEO) {
          const [_, src] = b.content;
          result += `${indent}- [Video](${src})\n`;
        } else if (b.content[0] === BLOCK_CONTENT_TYPES.AUDIO) {
          const [_, src] = b.content;
          result += `${indent}- [Audio](${src})\n`;
        } else {
          result += `${indent}- ${b.ctext}\n`;
        }
      },
      rootBlockId,
      rootBlockLevel: 0,
      nonFoldOnly: options.nonFoldOnly,
      includeSelf: true,
    });
    return result;
  };

  const exportSubtreeToPdf = (rootBlockId: string) => {
    return "";
  };

  const openExporter = (blockId_: BlockId) => {
    open.value = true;
    blockId.value = blockId_;
  };

  const closeExporter = () => {
    open.value = false;
    blockId.value = undefined;
  };

  const ctx = {
    open,
    blockId,
    openExporter,
    closeExporter,
    exportSubtreeToPlainText,
    exportSubtreeToHtml,
    exportSubtreeToMarkdown,
    exportSubtreeToPdf,
  };
  return ctx;
});

export default ExporterContext;
