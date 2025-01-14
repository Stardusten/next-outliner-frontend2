<template>
  <CodeMirror
    v-if="viewingAttachment"
    class="text-file-viewer-cm"
    :lang="viewingAttachment.lang"
    v-model:src="viewingAttachment.tempContent"
    :readonly="!allowEdit"
  />
</template>

<script setup lang="ts">
import type { ViewingTextAttachment } from "@/context/attachmentViewer";
import CodeMirror from "../codemirror/CodeMirror.vue";

const props = defineProps<{
  allowEdit: boolean;
}>();

const viewingAttachment = defineModel<ViewingTextAttachment>("viewingAttachment");
</script>

<style lang="scss">
.text-file-viewer-cm {
  height: 100%;

  .cm-editor {
    height: 100%;
  }
}
</style>
