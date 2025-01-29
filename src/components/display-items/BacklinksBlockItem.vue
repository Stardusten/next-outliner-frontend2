<template>
  <BasicBlockItem
    v-bind="$props"
    item-type="backlink-block"
    :level="0"
    :highlight-refs="[...highlightRefs, refBlockId]"
    :fold="fold"
    :can-expand="canExpand"
    :item-id="itemId"
    :handle-click-fold-button="handleClickFoldButton"
  />
</template>

<script setup lang="ts">
import type { BlockTree } from "@/context/blockTree";
import BasicBlockItem from "./BasicBlockItem.vue";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { computed } from "vue";
import type { DisplayItemId } from "@/utils/display-item";

const props = withDefaults(
  defineProps<{
    blockTree?: BlockTree;
    refBlockId: BlockId;
    itemId: DisplayItemId;
    block: Block;
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
