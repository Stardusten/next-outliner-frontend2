<template>
  <AutoResizeInput
    type="text"
    v-model="value"
    class="border-none h-[unset] p-0 focus-visible:ring-transparent"
    :placeholder="$t('kbView.blockProperties.common.inputPlaceholder')"
  />
</template>

<script setup lang="ts">
import AutoResizeInput from "../auto-resize-input/AutoResizeInput.vue";

const value = defineModel<string>("model-value");
</script>
