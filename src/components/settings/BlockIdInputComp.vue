<template>
  <div class="flex items-center gap-2">
    <Button v-if="!item.value.value" variant="outline" size="icon" @click="handleClickAdd">
      <Plus class="size-4" />
    </Button>
    <BlockContent v-else-if="item.value.value && block" :block="block" readonly></BlockContent>
    <div v-else class="text-red-500">MISSING BLOCK</div>
    <ResetButton v-if="item.value.value" :item="item" />
  </div>
</template>

<script setup lang="ts">
import type { SettingItem } from "@/context/settings";
import ResetButton from "./ResetButton.vue";
import { Plus } from "lucide-vue-next";
import { Button } from "../ui/button";
import BlockContent from "../block-contents/BlockContent.vue";
import BlocksContext from "@/context/blocks/blocks";
import { computed } from "vue";
import RefSuggestionsContext from "@/context/refSuggestions";

const { blocksManager } = BlocksContext.useContext()!;
const { openRefSuggestions, close } = RefSuggestionsContext.useContext()!;

const props = defineProps<{
  item: SettingItem<string, "blockIdInput">;
}>();

const block = computed(() => {
  if (!props.item.value) return null;
  return blocksManager.getBlock(props.item.value.value);
});

const handleClickAdd = (e: MouseEvent) => {
  openRefSuggestions({
    showPos: { x: e.clientX, y: e.clientY },
    onSelectBlock: (blockId) => {
      props.item.value.value = blockId;
      close();
    },
    onSelectNothing: close,
    allowCreateNew: false,
    allowFileRef: false,
  });
};
</script>
