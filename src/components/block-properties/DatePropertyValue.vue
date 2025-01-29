<template>
  <input
    class="bg-transparent text-sm"
    type="date"
    v-model="value"
    :placeholder="$t('kbView.blockProperties.common.selectDate')"
  />
</template>

<script setup lang="ts">
const value = defineModel<string>("model-value");
</script>
