<template>
  <Input
    class="p-0 h-[unset] border-none focus-visible:ring-transparent"
    type="datetime-local"
    v-model="value"
  />
</template>

<script setup lang="ts">
import { Input } from "../ui/input";

const value = defineModel<string>("model-value");
</script>
