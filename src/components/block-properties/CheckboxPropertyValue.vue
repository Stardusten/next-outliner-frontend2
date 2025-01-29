<template>
  <Checkbox v-model:checked="value" class="size-4 scale-90 data-[state=unchecked]:opacity-50" />
</template>

<script setup lang="ts">
import { Checkbox } from "../ui/checkbox";

const value = defineModel<boolean>("model-value");
</script>
