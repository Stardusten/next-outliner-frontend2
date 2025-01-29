<template>
  <BasicBlockItem
    v-bind="$props"
    item-type="backlink-descendant"
    :fold="fold"
    :can-expand="canExpand"
    :item-id="itemId"
    :handle-click-fold-button="handleClickFoldButton"
  />
</template>

<script setup lang="ts">
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import BasicBlockItem from "./BasicBlockItem.vue";
import { computed } from "vue";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type { DisplayItemId } from "@/utils/display-item";

const props = withDefaults(
  defineProps<{
    blockTree?: BlockTree;
    block: Block;
    level: number;
    itemId: DisplayItemId;
    readonly?: boolean;
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
  const expandedBP = props.blockTree?.expandedBP.value;
  if (!expandedBP) return;
  if (expandedBP[props.itemId]) {
    delete expandedBP[props.itemId];
  } else {
    expandedBP[props.itemId] = true;
  }
};
</script>
