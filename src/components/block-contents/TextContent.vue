<template>
  <ProseMirror
    class="text-content block-content"
    ref="pmWrapper"
    v-model:doc="docJson"
    :item-id="itemId"
    :block-tree="blockTree"
    :schema="schema"
    :readonly="readonly"
    :plugins-builder="buildPlugins"
    :disable-spellcheck-when-blur="true"
    :on-doc-changed="onDocChanged"
    :node-views="nodeViews"
    :highlight-terms="highlightTerms"
    :highlight-refs="highlightRefs"
  ></ProseMirror>
</template>

<script setup lang="ts">
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { TextContent } from "@/common/type-and-schemas/block/block-content";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import ProseMirror from "@/components/prosemirror/ProseMirror.vue";
import AttachmentViewerContext from "@/context/attachmentViewer";
import BlockRefContextmenuContext from "@/context/blockRefContextmenu";
import type { BlockTree } from "@/context/blockTree";
import BlocksContext from "@/context/blocks/blocks";
import FloatingMathInputContext from "@/context/floatingMathInput";
import HistoryContext from "@/context/history";
import { useTaskQueue } from "@/plugins/taskQueue";
import type { DisplayItemId } from "@/utils/display-item";
import "katex/dist/katex.css";
import { inputRules } from "prosemirror-inputrules";
import type { EditorProps, EditorViewCustomEvents } from "prosemirror-view";
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { openRefSuggestions } from "../prosemirror/input-rules/openRefSuggestions";
import { turnToCodeBlock } from "../prosemirror/input-rules/turnToCodeblock";
import { turnToInlineCode } from "../prosemirror/input-rules/turnToInlineBlock";
import { MathInlineKatex } from "../prosemirror/node-views/inlineMath";
import { mkKeymapPlugin } from "../prosemirror/plugins/keymap";
import { mkPasteImagePlugin } from "../prosemirror/plugins/pasteImage";
import { mkPasteTextPlugin } from "../prosemirror/plugins/pasteText";
import type { PmPluginCtx } from "../prosemirror/plugins/pluginContext";
import { getPmSchema } from "../prosemirror/pmSchema";
import type { TextBlock } from "@/context/blocks/view-layer/blocksManager";

const props = defineProps<{
  blockTree?: BlockTree;
  itemId?: DisplayItemId;
  block: TextBlock;
  readonly?: boolean;
  highlightTerms?: string[];
  highlightRefs?: BlockId[];
}>();

const { blocksManager, blockEditor } = BlocksContext.useContext()!;
const fmic = FloatingMathInputContext.useContext();
const historyContext = HistoryContext.useContext();
const { handlePreview } = AttachmentViewerContext.useContext()!;
const { openAt: openBlockRefContextMenu } = BlockRefContextmenuContext.useContext()!;

const taskQueue = useTaskQueue();
const docJson = shallowRef<any | null>(null);
const pmWrapper = ref<InstanceType<typeof ProseMirror> | null>(null);
const nodeViews: EditorProps["nodeViews"] = {
  mathInline(node, view, getPos) {
    return new MathInlineKatex(node, view, getPos, fmic);
  },
};

const schema = computed(() =>
  getPmSchema({
    pushHistoryItem: historyContext ? historyContext.pushHistoryItem : undefined,
    getMainTree: props.blockTree ? () => props.blockTree! : undefined,
    getBlockRef: blocksManager.getBlockRef,
    handlePreview,
    openBlockRefContextMenu,
  }),
);

const onDocChanged = ({
  newDoc,
  oldSelection,
  newSelection,
}: EditorViewCustomEvents["docChanged"]) => {
  const blockId = props.block.id;
  const newBlockContent: TextContent = [BLOCK_CONTENT_TYPES.TEXT, newDoc];
  docJson.value = newDoc;
  // 说明：这里为了让 undo redo 时拿到正确的选区信息做了一些奇怪的事情
  // 1. 由于这个更改是 prosemirror 里拿到的，我们只是创建 blockTransaction 去更新 blocks
  //   创建事务时更改早就发生了，因此自动捕获的环境信息肯定是不正确的。我们需要手动将从 docChange
  //   event listener 里拿到正确的选区信息，然后覆盖掉 tr.envInfo.onCreate 里错误的选区信息
  // 2. 由于 blockUpdate 会 debounce，因此我们还需要将选区信息放到 task 的 meta 里
  //    然后在 task 执行时，从 mergedTasks 里拿到之前所有被合并的 task，然后使用最早的
  //    task 的 meta 里的选区信息，覆盖掉 tr.envInfo.onCreate 里错误的选区信息
  taskQueue.addTask(
    ({ mergedTasks }) => {
      const fstTask = mergedTasks[0];
      const tr = blocksManager.createBlockTransaction({ type: "ui" });
      blockEditor.changeBlockContent({ blockId, content: newBlockContent, tr, commit: false });
      tr.meta.envUndoStrategy = "create";
      tr.envInfo.onCreate = {
        ...tr.envInfo.onCreate,
        selection: fstTask?.meta?.oldSelection ?? oldSelection,
      };
      tr.commit();
    },
    {
      type: "updateBlockContent" + blockId,
      delay: 500,
      debounce: true,
      // 将选区信息作为 meta 放到 task 里
      meta: {
        oldSelection,
        newSelection,
      },
    },
  );
};

const buildPlugins = (ctx: PmPluginCtx) => {
  const getItemId = () => props.itemId;
  const getBlockTree = () => props.blockTree ?? null;

  const plugins = props.readonly
    ? []
    : [
        inputRules({
          rules: [openRefSuggestions(ctx), turnToCodeBlock(ctx), turnToInlineCode(ctx)],
        }),
        mkKeymapPlugin(ctx),
        mkPasteImagePlugin(ctx),
        mkPasteTextPlugin(ctx),
      ];
  return plugins;
};

watch(
  () => props.block.content,
  (content) => {
    if (content[0] != BLOCK_CONTENT_TYPES.TEXT) return;
    // 如果 origin 是 local 且 changeSources 包含当前块，则不更新
    const origin = props.block.origin;
    if (
      origin.type === "ui" &&
      origin.changeSources?.includes(props.block.id) &&
      docJson.value !== null
    )
      return;
    docJson.value = content[1];
  },
  { immediate: true },
);

onMounted(() => {
  if (props.itemId) {
    // 加载时，向 blockTree 注册 editorView
    const editorView = pmWrapper.value?.getEditorView();
    if (editorView) {
      props.blockTree?.registerEditorView(props.itemId, editorView);
    }
  }
});

onUnmounted(() => {
  if (props.itemId) {
    // 卸载时，从 blockTree 注销 editorView
    const editorView = pmWrapper.value?.getEditorView();
    if (editorView) {
      props.blockTree?.unregisterEditorView(props.itemId, editorView);
      editorView.destroy();
    }
  }
});
</script>

<style lang="scss">
.text-content {
  cursor: text;
  max-width: calc(100% - 48px);
  padding: var(--content-padding) 0;
  font-family: var(--text-font);
  font-size: var(--text-font-size);
  line-height: var(--line-height-normal);

  .ProseMirror {
    outline: none;

    // 高亮样式
    span[bg="bg1"] {
      background-color: var(--highlight-blue);
    }

    span[bg="bg2"] {
      background-color: var(--highlight-green);
    }

    span[bg="bg3"] {
      background-color: var(--highlight-red);
    }

    span[bg="bg4"] {
      background-color: var(--highlight-yellow);
    }

    span[bg="bg5"] {
      background-color: var(--highlight-gray);
    }

    span[bg="bg6"] {
      background-color: var(--highlight-orange);
    }

    span[bg="bg7"] {
      background-color: var(--highlight-purple);
    }

    // 行内代码块样式
    code {
      font-family: var(--code-font);
      font-size: var(--code-font-size);
      color: var(--code-color);
      line-height: 1em;
      background-color: var(--code-background);
      padding: 0 3px;
      border-radius: 3px;
      word-break: break-all;
    }

    // 链接与本地路径引用
    a,
    span.path-ref {
      color: var(--link-color);
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      text-decoration-thickness: 1px;
    }

    // 块引用
    span.block-ref,
    span.block-ref-v2 {
      color: var(--link-color);
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 4px;
      text-decoration-thickness: 1px;

      &.invalid {
        color: var(--errmsg-color);
      }
    }

    span.cloze {
      text-decoration: underline;
      text-underline-offset: 4px;
      text-decoration-thickness: 1.5px;
      text-decoration-color: var(--cloze-underline-color);
      background-color: var(--cloze-bg-color);
    }

    // 标签
    span.block-ref-v2.tag {
      cursor: pointer;
      color: var(--tag-color);
      opacity: 0.5;
      font-size: 0.9em;
      line-height: 1em;
      text-decoration: unset;

      &:hover {
        opacity: 1;
      }
    }

    span.block-ref-v2.tag::before {
      content: "#";
    }

    // 自动识别的日期时间 & 虚拟引用
    span.date-time,
    span.virtual-ref {
      color: var(--link-color);
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      text-decoration-style: dashed;
      text-decoration-thickness: 1px;
    }

    //span.local-path:before {
    //  display: inline-block;
    //  margin-bottom: -3px;
    //  margin-right: 2px;
    //  content: "";
    //  height: 15px;
    //  width: 15px;
    //  background-color: var(--text-secondary-color);
    //  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-file'%3E%3Cpath d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'/%3E%3Cpath d='M14 2v4a2 2 0 0 0 2 2h4'/%3E%3C/svg%3E");
    //}

    // a:before {
    //   display: inline-block;
    //   margin-bottom: -3px;
    //   margin-right: 2px;
    //   content: "";
    //   height: 15px;
    //   width: 15px;
    //  background-color: var(--link-color);
    //  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-link'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3C/svg%3E");
    //}

    .trailing-hint {
      font-style: italic;
      padding-left: 10px;
      opacity: 0.37;
      cursor: pointer;

      &:hover {
        opacity: 0.5;
      }
    }
  }

  .katex {
    font-size: 1em;
  }

  .math-inline--katex.empty {
    font-style: italic;
    color: hsl(var(--muted-foreground));
  }
}

// 拖拽时光标样式
.block-tree.dragging .ProseMirror {
  cursor: grabbing;
}
</style>
