<template>
  <span v-html="highlightedContent"></span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  text: string;
  highlightTerms?: string[];
}>();

const highlightedContent = computed(() => {
  if (!props.highlightTerms?.length) return props.text;

  let result = props.text;
  const sortedTerms = [...props.highlightTerms].sort((a, b) => b.length - a.length);

  for (const term of sortedTerms) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    result = result.replace(regex, (match) => `<span class="highlight-keep">${match}</span>`);
  }

  return result;
});
</script>
