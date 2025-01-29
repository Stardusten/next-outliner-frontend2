<template>
  <BasicBlockItem
    v-bind="$props"
    item-type="potential-links-descendant"
    :fold="fold"
    :can-expand="canExpand"
    :handle-click-fold-button="handleClickFoldButton"
    :item-id="itemId"
  />
</template>

<script setup lang="ts">
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import BasicBlockItem from "./BasicBlockItem.vue";
import { computed } from "vue";
import type { DisplayItemId } from "@/utils/display-item";

const props = withDefaults(
  defineProps<{
    blockTree?: BlockTree;
    block: Block;
    level: number;
    readonly?: boolean;
    itemId: DisplayItemId;
    highlightTerms?: string[];
    highlightRefs?: BlockId[];
    fold: boolean;
    canExpand: boolean;
  }>(),
  {
    blockTree: undefined,
    readonly: false,
    itemId: undefined,
    highlightTerms: () => [],
    highlightRefs: () => [],
  },
);

const handleClickFoldButton = () => {
  const tree = props.blockTree;
  if (!tree) return;
  const expandedBP = tree.expandedBP.value;
  if (expandedBP[props.itemId]) {
    delete expandedBP[props.itemId];
  } else {
    expandedBP[props.itemId] = true;
  }
};
</script>
