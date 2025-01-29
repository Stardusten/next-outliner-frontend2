<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ $t("kbView.blockProperties.optionsDialog.title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("kbView.blockProperties.optionsDialog.description") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div v-for="(option, index) in localOptions" :key="index" class="flex items-center gap-2">
          <Input
            v-model="localOptions[index]"
            :placeholder="$t('kbView.blockProperties.optionsDialog.optionPlaceholder')"
          />
          <Button
            variant="ghost"
            size="icon"
            class="shrink-0"
            @click="localOptions.splice(index, 1)"
          >
            <X class="size-4" />
          </Button>
        </div>
        <Button variant="outline" class="w-full" @click="localOptions.push('')">
          <Plus class="size-4 mr-2" />
          {{ $t("kbView.blockProperties.optionsDialog.addOption") }}
        </Button>
      </div>
      <DialogFooter>
        <p v-if="hasDuplicateOptions" class="text-sm text-orange-500 mr-auto flex items-center">
          <CircleAlert class="size-4 mr-2" />
          {{ $t("kbView.blockProperties.optionsDialog.duplicateOptions") }}
        </p>
        <Button variant="outline" @click="$emit('update:open', false)">
          {{ $t("kbView.blockProperties.optionsDialog.cancel") }}
        </Button>
        <Button @click="handleSave" :disabled="hasDuplicateOptions">
          {{ $t("kbView.blockProperties.optionsDialog.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, X, CircleAlert } from "lucide-vue-next";

const props = defineProps<{
  open: boolean;
  options: string[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:options": [value: string[]];
}>();

const localOptions = ref<string[]>([]);

watch(
  () => props.options,
  (newOptions) => {
    localOptions.value = [...newOptions];
  },
  { immediate: true },
);

const hasDuplicateOptions = computed(() => {
  const options = localOptions.value.filter(Boolean);
  return options.length !== new Set(options).size;
});

const handleSave = () => {
  if (hasDuplicateOptions.value) return;
  emit("update:options", localOptions.value.filter(Boolean));
  emit("update:open", false);
};
</script>
