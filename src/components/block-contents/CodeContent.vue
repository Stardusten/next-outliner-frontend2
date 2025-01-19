<template>
  <div class="relative w-full">
    <CodeMirror
      class="code-content block-content"
      ref="cmWrapper"
      v-model:src="src!"
      :readonly="readonly"
      :lang="block.content[2]"
      :extensions-builder="extensionsBuilder"
      :on-src-changed="handleSrcChange"
      :keymap="codemirrorKeymap"
    >
    </CodeMirror>

    <div
      class="toolbar absolute -top-9 right-0 flex items-center w-fit gap-x-1 rounded-md p-1 data-[state=closed]:hidden"
      :data-state="toolbarState"
    >
      <Select :value="currLang" @update:modelValue="handleLangChange">
        <SelectTrigger
          class="h-8 min-w-32 focus-visible:outline-none focus-visible:ring-transparent"
        >
          {{ currLang ?? $t("kbView.codeblock.unknownLanguage") }}
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="lang in langs" :value="lang">{{ lang }}</SelectItem>
        </SelectContent>
      </Select>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline" size="icon" class="flex-shrink-0" @click="handleCopyCode">
            <Copy class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {{ $t("kbView.codeblock.copyCode") }}
        </TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { CodeContent } from "@/common/type-and-schemas/block/block-content";
import BlocksContext from "@/context/blocks/blocks";
import type { BlockTree } from "@/context/blockTree";
import KeymapContext from "@/context/keymap";
import { useTaskQueue } from "@/plugins/taskQueue";
import { closeBrackets } from "@codemirror/autocomplete";
import { bracketMatching, indentOnInput, LanguageDescription } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from "vue";
import CodeMirror from "../codemirror/CodeMirror.vue";
import type { Block, CodeBlock } from "@/context/blocks/view-layer/blocksManager";
import type { DisplayItemId } from "@/utils/display-item";
import { Copy } from "lucide-vue-next";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { languages } from "@codemirror/language-data";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import LastFocusContext from "@/context/lastFocus";

const props = defineProps<{
  blockTree?: BlockTree;
  itemId?: DisplayItemId;
  block: CodeBlock;
  readonly?: boolean;
}>();

const { blockEditor } = BlocksContext.useContext()!;
const taskQueue = useTaskQueue();
const src = ref<string | null>(null);
const cmWrapper = ref<InstanceType<typeof CodeMirror> | null>(null);
const { codemirrorKeymap } = KeymapContext.useContext()!;
const { lastFocusedDiId } = LastFocusContext.useContext()!;
const langs = languages.map((l) => l.name);

const currLang = computed(() => {
  const abbr = props.block.content[2]!;
  const langDesc = LanguageDescription.matchLanguageName(languages, abbr, true);
  if (!langDesc) return abbr;
  return langDesc.name;
});

const toolbarState = computed(() => (lastFocusedDiId.value === props.itemId ? "open" : "closed"));

const extensionsBuilder = () => {
  const ret: Extension[] = props.readonly
    ? []
    : [indentOnInput(), bracketMatching(), closeBrackets()];
  return ret;
};

const handleSrcChange = (newSrc: string) => {
  const blockId = props.block.id;
  const newBlockContent: CodeContent = [
    BLOCK_CONTENT_TYPES.CODE,
    newSrc,
    props.block.content[2]!,
  ] as const;
  taskQueue.addTask(
    () => {
      blockEditor.changeBlockContent({
        blockId,
        content: newBlockContent,
      });
    },
    {
      type: "updateBlockContent" + blockId,
      delay: 500,
      debounce: true,
    },
  );
};

watch(
  () => props.block.content,
  (newContent) => {
    if (newContent[0] !== BLOCK_CONTENT_TYPES.CODE) return; // IMPOSSIBLE
    src.value = newContent[1];
  },
  { immediate: true },
);

const handleLangChange = (lang: string) => {
  taskQueue.addTask(() => {
    blockEditor.changeBlockContent({
      blockId: props.block.id,
      content: [BLOCK_CONTENT_TYPES.CODE, src.value!, lang] as const,
    });
  });
};

const handleCopyCode = () => {
  navigator.clipboard.writeText(src.value!);
};

onMounted(() => {
  // 加载时，向 blockTree 注册 editorView
  if (props.itemId) {
    const editorView = cmWrapper.value?.getEditorView();
    if (editorView) {
      props.blockTree?.registerEditorView(props.itemId, editorView);
    }
  }
});

onUnmounted(() => {
  // 卸载时，从 blockTree 注销 editorView
  if (props.itemId) {
    const editorView = cmWrapper.value?.getEditorView();
    if (editorView) {
      props.blockTree?.unregisterEditorView(props.itemId, editorView);
      editorView.destroy();
    }
  }
});
</script>
