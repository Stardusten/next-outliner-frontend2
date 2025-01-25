<template>
  <div class="prosemirror-wrapper" ref="$wrapper"></div>
</template>

<script setup lang="ts">
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import BlockTreeContext, { type BlockTree } from "@/context/blockTree";
import BlocksContext from "@/context/blocks/blocks";
import HistoryContext from "@/context/history";
import ImagesContext from "@/context/images";
import KeymapContext from "@/context/keymap";
import LastFocusContext from "@/context/lastFocus";
import PasteDialogContext from "@/context/pasteDialog";
import PathsContext from "@/context/paths";
import RefSuggestionsContext from "@/context/refSuggestions";
import type { DisplayItemId } from "@/utils/display-item";
import { Node, Schema } from "prosemirror-model";
import { EditorState, Plugin, Selection } from "prosemirror-state";
import { type EditorProps, EditorView } from "prosemirror-view";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { mkEventBusPlugin } from "./plugins/eventBus";
import { mkHighlightMatchesPlugin } from "./plugins/highlightMatches";
import { mkHighlightRefsPlugin } from "./plugins/highlightRefs";
import { mkListenDocChangedPlugin } from "./plugins/listenDocChange";
import type { PmPluginCtx } from "./plugins/pluginContext";
import CommandsContext from "@/context/commands/commands";
import SearchSettingsContext from "@/context/searchSettings";

const props = withDefaults(
  defineProps<{
    // 块失焦时关闭拼写检查
    disableSpellcheckWhenBlur?: boolean;
    nodeViews?: EditorProps["nodeViews"];
    schema: Schema;
    pluginsBuilder?: (ctx: PmPluginCtx) => Plugin[];
    onDocChanged?: (event: {
      newDoc: any;
      oldDoc: any;
      view: EditorView;
      oldSelection: any;
      newSelection: any;
    }) => void;
    highlightTerms?: string[];
    highlightRefs?: BlockId[];
    blockTree?: BlockTree;
    itemId?: DisplayItemId;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
    disableSpellcheckWhenBlur: true,
  },
);

const docJson = defineModel<any>("doc");

const $wrapper = ref<HTMLElement | null>(null);
const corrupted = ref(false);
let editorView: EditorView | null = null;

const historyContext = HistoryContext.useContext();
const blockTreeContext = BlockTreeContext.useContext();
const blocksContext = BlocksContext.useContext();
const refSuggestionsContext = RefSuggestionsContext.useContext();
const lastFocusContext = LastFocusContext.useContext();
const pathsContext = PathsContext.useContext();
const imagesContext = ImagesContext.useContext();
const keymapContext = KeymapContext.useContext();
const pasteDialogContext = PasteDialogContext.useContext();
const commandsContext = CommandsContext.useContext();
const searchSettingsContext = SearchSettingsContext.useContext();

const pluginsCtx: PmPluginCtx = {
  getSchema: () => props.schema,
  getItemId: () => props.itemId ?? null,
  getBlockTree: () => props.blockTree ?? null,
  getReadonly: () => props.readonly,
  getEditorView: () => editorView!,
  getHighlightTerms: () => props.highlightTerms ?? [],
  getHighlightRefs: () => props.highlightRefs ?? [],
  lastFocusContext,
  historyContext,
  blockTreeContext,
  blocksContext,
  refSuggestionsContext,
  imagesContext,
  pathsContext,
  keymapContext,
  pasteDialogContext,
  commandsContext,
};

defineExpose({
  getEditorView: () => editorView,
  isCorrupted: () => corrupted.value,
  getWrapperDom: () => $wrapper.value,
});

const mkPlugins = () => {
  const customPlugins = props.pluginsBuilder?.(pluginsCtx) ?? [];

  if (props.readonly) {
    return [
      mkHighlightMatchesPlugin(
        pluginsCtx,
        undefined,
        searchSettingsContext?.ignoreDiacritics?.value ?? true,
      ),
      mkHighlightRefsPlugin(pluginsCtx),
      ...customPlugins,
    ];
  } else {
    return [
      mkEventBusPlugin(),
      mkListenDocChangedPlugin(),
      mkHighlightMatchesPlugin(
        pluginsCtx,
        undefined,
        searchSettingsContext?.ignoreDiacritics?.value ?? true,
      ),
      mkHighlightRefsPlugin(pluginsCtx),
      ...customPlugins,
    ];
  }
};

watch(docJson, () => {
  if (!editorView || editorView?.isDestroyed) return;

  const oldJsonString = JSON.stringify(docJson.value);
  const newJsonString = JSON.stringify(editorView.state.doc);
  if (oldJsonString == newJsonString) return;

  let doc;
  try {
    doc = Node.fromJSON(props.schema, docJson.value);
  } catch (e) {
    corrupted.value = true;
    return;
  }

  // 尝试将旧的 selection 应用到新的 doc 上
  // 如果失败，Selection.fromJson 会抛出异常，此时 newSelection 为 undefined
  const oldSelectionJson = editorView.state.selection.toJSON();
  let newSelection;
  try {
    newSelection = Selection.fromJSON(doc, oldSelectionJson);
  } catch {}

  const newState = EditorState.create({
    doc: doc,
    plugins: editorView.state.plugins,
    selection: newSelection,
  });
  editorView.updateState(newState);
});

watch([() => props.highlightTerms, () => props.highlightRefs], () => {
  // 当 highlightTerms 或 highlightRefs 变化时
  // dispatch 一个空的 transaction，以触发 decorations 的重新计算
  if (editorView) {
    const tr = editorView.state.tr.setMeta("empty", {});
    editorView.dispatch(tr);
  }
});

onMounted(() => {
  if (!$wrapper.value) return;

  let doc;
  try {
    doc = Node.fromJSON(props.schema, docJson.value);
  } catch (e) {
    corrupted.value = true;
    return;
  }

  const state = EditorState.create({
    doc,
    plugins: mkPlugins(),
  });

  if (editorView) editorView.destroy();
  editorView = new EditorView($wrapper.value, {
    state,
    editable: () => {
      return !props.readonly;
    },
    nodeViews: props.nodeViews ?? {},
  });

  // 文档更改时的行为
  if (editorView.on) {
    // 默认立即新文档同步到 docJson
    const defaultDocChangedHandler = ({ newDoc }: { newDoc: any }) => (docJson.value = newDoc);
    editorView.on("docChanged", props.onDocChanged ?? defaultDocChangedHandler);
  }

  // TODO reactive
  if (props.disableSpellcheckWhenBlur) {
    $wrapper.value.addEventListener("focusin", () => {
      if ($wrapper.value) $wrapper.value.spellcheck = true;
    });
    $wrapper.value.addEventListener("focusout", () => {
      if ($wrapper.value) $wrapper.value.spellcheck = false;
    });
  }
});

// 延迟销毁 editorView，以确保动画完成
onUnmounted(() => {
  setTimeout(() => {
    if (editorView && !editorView.isDestroyed) editorView.destroy();
    editorView = null;
  }, 1000);
});
</script>

<style lang="scss">
.ProseMirror .highlight-keep {
  background-color: var(--highlight-text-bg);
}
</style>
