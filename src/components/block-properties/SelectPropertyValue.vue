<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" class="p-0 h-[unset] border-none justify-start">
        <div class="truncate">
          {{ value || $t("kbView.blockProperties.common.selectPlaceholder") }}
        </div>
        <ChevronDown class="ml-2 size-4 shrink-0" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-[200px]">
      <DropdownMenuCheckboxItem
        v-for="option in options"
        :key="option"
        :checked="value === option"
        @select="value = option"
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

const value = defineModel<string>("model-value");
</script>
