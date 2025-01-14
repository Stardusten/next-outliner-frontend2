<template>
  <div class="flex items-center gap-2">
    <Select v-model="item.value.value">
      <SelectTrigger>
        <SelectValue></SelectValue>
      </SelectTrigger>
      <SelectContent class="max-h-[var(--radix-select-content-available-height)]">
        <SelectItem
          v-for="option in item.componentType.options"
          :key="option.value"
          :value="option.value"
        >
          {{ getTrans(option.label, locale) }}
        </SelectItem>
      </SelectContent>
    </Select>
    <ResetButton :item="item" />
  </div>
</template>

<script setup lang="ts">
import type { SettingItem } from "@/context/settings";
import ResetButton from "./ResetButton.vue";
import { useI18n } from "vue-i18n";
import getTrans from "@/utils/getTrans";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const { locale } = useI18n();
const props = defineProps<{
  item: SettingItem<string, "select">;
}>();
</script>
