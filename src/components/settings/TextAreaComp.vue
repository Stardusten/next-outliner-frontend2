<template>
  <div class="relative">
    <CodeMirror
      class="border rounded-md min-h-[100px] p-2 cursor-text"
      v-model:src="item.value.value"
      :lang="item.componentType.lang"
    ></CodeMirror>
    <div class="absolute right-0 top-0 m-2">
      <ResetButton :item="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SettingItem } from "@/context/settings";
import ResetButton from "./ResetButton.vue";
import CodeMirror from "../codemirror/CodeMirror.vue";

defineProps<{
  item: SettingItem<string, "textArea">;
}>();
</script>
