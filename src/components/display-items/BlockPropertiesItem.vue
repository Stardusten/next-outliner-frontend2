<template>
  <div class="block-properties-item">
    <div class="indent-lines">
      <div class="indent-line" v-for="i in level + 1" :key="i" :data-level="i"></div>
    </div>
    <div class="text-sm text-muted-foreground">Block Properties</div>
  </div>
</template>

<script setup lang="ts">
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import type { DisplayItem, DisplayItemId } from "@/utils/display-item";

const props = defineProps<{
  blockTree?: BlockTree;
  block: Block;
  level: number;
  itemType?: DisplayItem["type"];
  itemId?: DisplayItemId;
}>();
</script>

<style lang="scss">
.block-properties-item {
  display: flex;

  .indent-lines {
    display: flex;

    .indent-line {
      width: calc(var(--block-indent-width) - var(--block-indent-adjust));
      height: 100%;
      border-right: var(--border-indent);
      margin-right: var(--block-indent-adjust);
      border-right: 1px solid var(--indent-line-color);
    }
  }
}
</style>
