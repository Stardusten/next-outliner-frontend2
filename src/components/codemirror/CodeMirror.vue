<template>
  <div class="code-mirror-wrapper !w-full" ref="$wrapper"></div>
</template>

<script setup lang="ts">
import ThemeContext from "@/context/theme";
import { LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Compartment, EditorSelection, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, type KeyBinding } from "@codemirror/view";
import { minimalSetup } from "codemirror";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { mkContentChangePlugin } from "./plugins/content-change";
import { updateHighlightTerms } from "./plugins/highlight-matches";
import { basicDark } from "./themes/basicDark";
import { basicLight } from "./themes/basicLight";

const props = defineProps<{
  theme?: string;
  readonly?: boolean;
  lang: string;
  extensionsBuilder?: () => Extension[];
  highlightTerms?: string[];
  onSrcChanged?: (newSrc: string, oldSrc?: string) => void;
  keymap?: { [key: string]: KeyBinding };
}>();

defineExpose({
  getEditorView: () => editorView,
  getWrapperDom: () => $wrapper.value,
});

const src = defineModel<string>("src");

let editorView: EditorView | null = null;
const $wrapper = ref<HTMLElement | null>(null);
const languageCompartment = new Compartment();
const themeCompartment = new Compartment();
const keymapCompartment = new Compartment();
const readonlyCompartment = new Compartment();
const themeContext = ThemeContext.useContext();

const registeredThemes = {
  light: basicLight,
  dark: basicDark,
};

// src 更改时，更新代码块中的内容
watch(src, () => {
  if (!editorView) return;
  if (src.value != editorView.state.doc.toString()) {
    const sel = editorView.state.selection.toJSON();
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: src.value,
      },
      selection: EditorSelection.fromJSON(sel),
    });
  }
  updateHighlightTerms(props.highlightTerms ?? [], editorView);
});

// props.highlightTerms 更改时，更新高亮
watch(
  () => props.highlightTerms,
  () => {
    if (!editorView) return;
    updateHighlightTerms(props.highlightTerms ?? [], editorView);
  },
);

const configureLanguage = async (lang: string) => {
  if (!editorView) return;
  if (lang == "" || lang == "unknown") {
    editorView.dispatch({
      effects: languageCompartment.reconfigure([]),
    });
    return;
  }
  const langDesc = await LanguageDescription.matchLanguageName(languages, lang, true);
  if (!langDesc) return;
  const l = await langDesc.load();
  editorView!.dispatch({
    effects: languageCompartment.reconfigure([l]),
  });
};
// lang 改变时更新代码块语言
watch(() => props.lang, configureLanguage);

const configureTheme = (themeName: string | undefined) => {
  if (!editorView) return;
  const theme = themeName ?? themeContext?.theme.value ?? "dark";
  const themePlugin = (registeredThemes as any)[theme];
  if (themePlugin) {
    editorView.dispatch({
      effects: themeCompartment.reconfigure([themePlugin]),
    });
  }
};
// props.theme 改变时更新主题
watch(() => props.theme, configureTheme);

const configureReadonly = (readonly: boolean) => {
  if (!editorView) return;
  editorView.dispatch({
    effects: readonlyCompartment.reconfigure([EditorState.readOnly.of(readonly)]),
  });
};
// props.readonly 改变时更新只读
watch(() => props.readonly, configureReadonly);

const configureKeymap = (keymapObj: { [key: string]: KeyBinding } | undefined) => {
  if (!editorView) return;
  const keymapArr = Object.values(keymapObj ?? {});
  editorView.dispatch({
    effects: keymapCompartment.reconfigure(keymap.of(keymapArr)),
  });
};
// props.keymap 改变时更新 keymap
watch(() => props.keymap, configureKeymap);

const mkExtensions = () => {
  const customExtension = props.extensionsBuilder?.() ?? [];

  return [
    minimalSetup,
    languageCompartment.of([]),
    themeCompartment.of([]),
    keymapCompartment.of([]),
    readonlyCompartment.of([]),
    mkContentChangePlugin(
      (newSrc, oldSrc) => {
        if (props.onSrcChanged) props.onSrcChanged(newSrc, oldSrc);
        else {
          src.value = newSrc;
        }
      },
      () => true,
    ),
    ...customExtension,
  ];
};

onMounted(() => {
  if (!$wrapper.value) return;
  editorView = new EditorView({
    doc: src.value ?? "",
    extensions: mkExtensions(),
    parent: $wrapper.value,
  });

  configureLanguage(props.lang ?? "");
  configureTheme(props.theme);
  configureKeymap(props.keymap ?? {});
  configureReadonly(props.readonly ?? false);
});

// 延迟销毁 editorView，以确保动画完成
onUnmounted(() => {
  setTimeout(() => {
    editorView && editorView.destroy();
  }, 1000);
});
</script>

<style lang="scss">
// CodeMirror
.ͼ1.cm-focused {
  outline: none;
}

.ͼ1 .cm-content {
  line-height: 1.3em;
  font-size: var(--code-font-size);
  font-family: var(--code-font);
}

.ͼ1 .cm-line {
  padding-left: 0;
}

.cm-cursor {
  // 光标稍向左移动，否则 tauri 中光标在开头是看不到
  margin-left: 1px !important;
  border-color: var(--text-primary-color);
  border-left-width: 1px !important;
}

.cm-matchingBracket {
  background-color: var(--bg-hover) !important;
  color: var(--text-primary-color) !important;
  outline: none;

  @at-root .cm-focused .cm-matchingBracket {
    outline: none !important;
  }
}
</style>
