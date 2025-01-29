<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" class="p-0 h-[unset] border-none justify-start">
        <div class="truncate">
          {{
            value?.length ? value.join(", ") : $t("kbView.blockProperties.common.selectPlaceholder")
          }}
        </div>
        <ChevronDown class="ml-2 size-4 shrink-0" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-[200px]">
      <DropdownMenuCheckboxItem
        v-for="option in options"
        :key="option"
        :checked="value?.includes(option)"
        @select="toggleOption(option)"
      >
        {{ option }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-vue-next";

const props = defineProps<{
  options: string[];
}>();

const value = defineModel<string[]>("model-value");

const toggleOption = (option: string) => {
  if (!value.value) {
    value.value = [option];
    return;
  }

  const index = value.value.indexOf(option);
  if (index === -1) {
    value.value = [...value.value, option];
  } else {
    value.value = value.value.filter((v) => v !== option);
  }
};
</script>
