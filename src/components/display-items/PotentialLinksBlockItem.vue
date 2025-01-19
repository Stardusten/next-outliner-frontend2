<template>
  <BasicBlockItem
    v-bind="$props"
    item-type="potential-links-block"
    :level="0"
    :highlight-refs="[...(highlightRefs ?? []), refBlockId]"
    :fold="fold"
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
    block: Block;
    readonly?: boolean;
    itemId: DisplayItemId;
    highlightTerms?: string[];
    highlightRefs?: BlockId[];
  }>(),
  {
    blockTree: undefined,
    readonly: false,
    itemId: undefined,
    highlightTerms: () => [],
    highlightRefs: () => [],
  },
);

const fold = computed(() => {
  const tree = props.blockTree;
  if (!tree) return props.block.fold;
  const expandedBP = tree.expandedBP.value;
  if (expandedBP[props.itemId]) return false;
  return true; // 潜在链接面板里根块默认是折叠的，不管 props.block.fold 的值是怎么样
});

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
