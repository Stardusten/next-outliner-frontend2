<template>
  <div ref="container" class="w-full">
    <Input
      v-model="modelValue"
      :error="error"
      :class="class"
      :style="{ width: `${width}px` }"
      @blur="emits('blur')"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup lang="ts">
import { useElementSize, useVModel } from "@vueuse/core";
import { Input } from "../ui/input";
import { useTemplateRef, type HTMLAttributes } from "vue";

const el = useTemplateRef("container");
const { width } = useElementSize(el);

const props = defineProps<{
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes["class"];
  error?: boolean;
  placeholder?: string;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
  (e: "blur"): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>
