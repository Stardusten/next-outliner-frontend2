import { getBasename } from "@/common/helper-functions/path";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import type { MarkSpec, NodeSpec } from "prosemirror-model";
import { Schema } from "prosemirror-model";
import { watch, type Ref } from "vue";

// schema context 是 schema 要能用必须提供的上下文
// 比如在 blocksManager#getCtext 中用到了 schema 解析 content
// 此时只需要提供 getBlockRef 即可
// 在 ProseMirror.vue 中，需要根据 schema 渲染内容
// 此时需要提供 pushHistoryItem 和 getMainTree 以及 getBlockRef
type SchemaCtx = {
  pushHistoryItem?: () => void;
  getMainTree?: () => BlockTree;
  getBlockRef: (blockId: BlockId) => Ref<Block | null>;
  handlePreview?: (path: string, name: string) => Promise<void>;
  openBlockRefContextMenu?: (pos: { x: number; y: number }, clickedBlockId_: BlockId) => void;
};

export const getPmSchema = (ctx: SchemaCtx) => {
  return new Schema({
    nodes: {
      // 整个文档
      doc: {
        // 文档内容规定必须是 block 类型的节点（block 与 HTML 中的 block 概念差不多） `+` 号代表可以有一个或多个（规则类似正则）
        content: "inline*",
      } as NodeSpec,

      // 段落中的文本
      text: {
        group: "inline",
      } as NodeSpec,

      // 路径引用
      pathRef: {
        inline: true,
        atom: true,
        attrs: {
          path: {},
        },
        group: "inline",
        selectable: true,
        toDOM: (node) => {
          const span = document.createElement("span");
          span.classList.add("path-ref");
          span.dataset.path = node.attrs.path;
          const basename = getBasename(node.attrs.path);
          span.innerHTML = basename;
          span.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            ctx.handlePreview?.(node.attrs.path, basename);
          });
          return span;
        },
        parseDOM: [
          {
            tag: "span.path-ref",
            getAttrs: (node: HTMLElement) => {
              return {
                path: node.getAttribute("path"),
              };
            },
          },
        ],
        leafText: (node) => {
          return node.attrs.path;
        },
      },

      // 块引用 v2
      blockRef_v2: {
        inline: true,
        atom: true,
        attrs: {
          toBlockId: {},
          tag: { default: false },
        },
        group: "inline",
        selectable: true,
        toDOM: (node) => {
          const { toBlockId } = node.attrs;
          const span = document.createElement("span");
          span.classList.add("block-ref-v2");
          if (node.attrs.tag) span.classList.add("tag"); // 是标签

          // 点击块引用，跳转到对应块
          span.addEventListener("click", (e) => {
            if (e.button !== 0) return; // 右键点击时，不跳转
            e.preventDefault();
            e.stopPropagation();
            ctx.pushHistoryItem?.(); // 记录历史
            const tree = ctx.getMainTree?.();
            if (!tree) return;
            tree.focusBlock(toBlockId, { highlight: true, expandIfFold: true });
          });

          span.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            ctx.openBlockRefContextMenu?.({ x: e.clientX, y: e.clientY }, toBlockId);
          });

          // 鼠标悬浮时，尝试打开浮动编辑器
          // span.addEventListener("mouseenter", (e) => {
          //   const ctx = globalThis.getFloatingEditorContext();
          //   if (ctx == null || ctx.open.value) return; // 如果浮动编辑器已经打开，则不处理
          //   const rect = span.getBoundingClientRect();
          //   ctx.openFloatingEditor(toBlockId, { x: rect.left, y: rect.bottom });
          // });

          // span.addEventListener("mouseleave", (e) => {
          //   const ctx = globalThis.getFloatingEditorContext();
          //   if (ctx == null || !ctx.open.value) return; // 如果浮动编辑器没有打开，则不处理
          //   ctx.showPos.value = null; // 仅将 showPos 设置为 null，不关闭浮动编辑器
          //   ctx.openedBlockId.value = null;
          // });

          // 当源块 ctext 更新时，更新引用锚文本
          const blockRef = ctx.getBlockRef(toBlockId);
          watch(
            blockRef,
            (toBlock) => {
              if (toBlock) {
                const ctext = toBlock.ctext ?? "";
                span.innerHTML = ctext.trim();

                span.dataset.blockId = toBlock.id;
                span.dataset.ctext = ctext;

                // 设置块引用颜色
                if (toBlock.metadata?.blockRefColor) {
                  span.dataset.blockRefColor = toBlock.metadata?.blockRefColor;
                } else {
                  delete span.dataset.blockRefColor;
                }

                span.classList.remove("invalid");
              } else {
                span.innerHTML = "Invalid Ref";
                span.classList.add("invalid");
              }
            },
            { immediate: true },
          );
          return span;
        },
        parseDOM: [
          {
            tag: "span.block-ref-v2",
            getAttrs(node) {
              if (node instanceof HTMLElement) {
                return {
                  toBlockId: node.dataset.blockId,
                  tag: node.classList.contains("tag"),
                };
              } else return {};
            },
          },
        ],
        leafText: (node) => {
          const { toBlockId } = node.attrs;
          if (!toBlockId) return "";
          const block = ctx.getBlockRef(toBlockId).value;
          return block?.ctext ?? "";
        },
      },

      // 行内数学公式
      mathInline: {
        inline: true,
        atom: true,
        attrs: {
          src: {},
        },
        leafText: (node) => {
          return node.attrs.src;
        },
        group: "inline",
        selectable: true,
        toDOM: (node) => [
          "span",
          {
            class: "math-inline",
            src: node.attrs.src,
            contenteditable: true,
          },
        ],
        parseDOM: [
          {
            tag: "span.math-inline",
            getAttrs: (node: HTMLElement) => {
              return {
                src: node.getAttribute("src"),
              };
            },
          },
        ],
      } as NodeSpec,

      hardBreak: {
        inline: true,
        group: "inline",
        selectable: false,
        parseDOM: [{ tag: "br" }],
        toDOM: () => {
          return ["br"];
        },
      },
    },
    // 除了上面定义 node 节点，一些富文本样式，可以通过 marks 定义
    marks: {
      link: {
        attrs: {
          href: {},
        },
        inclusive: false,
        parseDOM: [
          {
            tag: "a[href]",
            getAttrs: (node: HTMLElement) => {
              return {
                href: node.getAttribute("href"),
              };
            },
          },
        ],
        toDOM(node) {
          const { href } = node.attrs;
          const a = document.createElement("a");
          a.href = href;
          a.spellcheck = false;
          // 点击在浏览器中打开链接
          a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(href, "_blank");
          });
          return a;
        },
      } as MarkSpec,

      code: {
        parseDOM: [{ tag: "code" }],
        toDOM() {
          return ["code", { spellcheck: false }, 0];
        },
      } as MarkSpec,

      italic: {
        parseDOM: [
          { tag: "i" },
          { tag: "em" },
          { style: "font-style=italic" },
          { style: "font-style=normal", clearMark: (m) => m.type.name == "em" },
        ],
        toDOM() {
          return ["em", 0];
        },
      } as MarkSpec,

      bold: {
        parseDOM: [
          { tag: "strong" },
          // This works around a Google Docs misbehavior where
          // pasted content will be inexplicably wrapped in `<b>`
          // tags with a font-weight normal.
          {
            tag: "b",
            getAttrs: (node: HTMLElement) => node.style.fontWeight != "normal" && null,
          },
          { style: "font-weight=400", clearMark: (m) => m.type.name == "strong" },
          {
            style: "font-weight",
            getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
          },
        ],
        toDOM: () => {
          return ["strong", 0];
        },
      } as MarkSpec,

      strikethrough: {
        parseDOM: [{ tag: "s" }, { tag: "del" }, { style: "text-decoration: line-through" }],
        toDOM: () => {
          return ["s", 0];
        },
      } as MarkSpec,

      underline: {
        parseDOM: [{ tag: "u" }, { style: "text-decoration: underline" }],
        toDOM: () => {
          return ["u", 0];
        },
      } as MarkSpec,

      cloze: {
        attrs: {
          clozeId: {},
        },
        inclusive: false,
        toDOM(node) {
          const dom = document.createElement("span");
          dom.classList.add("cloze");
          dom.setAttribute("clozeid", node.attrs.clozeId);
          // when to remove?
          // 当复习自己时，隐藏内容
          // watchEffect(() => { TODO
          //   const curr = app.currReviewingRepeatableId.value;
          //   const showAns = app.showAnswerOrNot.value;
          //   if (curr == node.attrs.clozeId && !showAns) {
          //     dom.style.color = "transparent";
          //   } else {
          //     dom.style.color = "unset";
          //   }
          // });
          return { dom, contentDom: dom };
        },
        parseDOM: [
          {
            tag: "span.cloze",
            getAttrs: (node: HTMLElement) => {
              return { clozeId: node.getAttribute("clozeId") };
            },
          },
        ],
      },

      highlight: {
        attrs: {
          bg: { default: "bg4" },
          fg: { default: null },
        },
        inclusive: false,
        toDOM(node) {
          const { bg, fg } = node.attrs;
          return ["span", { class: "highlight", bg, fg }, 0];
        },
        parseDOM: [
          {
            tag: "span.highlight",
            getAttrs: (node: HTMLElement) => {
              return {
                bg: node.getAttribute("bg"),
                fg: node.getAttribute("fg"),
              };
            },
          },
        ],
      },
    },
  });
};
