<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <div
        v-if="backlinks.size > 0"
        class="rounded-md bg-muted px-1 min-w-5 h-fit flex items-center justify-center text-sm text-muted-foreground select-none cursor-pointer"
      >
        {{ backlinks.size }}
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-[300px] max-h-[300px] overflow-y-auto">
      <DropdownMenuItem v-for="block in backlinkBlocks" :key="block.id" class="w-full block">
        <div class="pointer-events-none select-none">
          <BlockContent
            class="flex-grow !max-w-[unset]"
            :block="block"
            :block-tree="undefined"
            :readonly="true"
            :highlight-refs="aliases"
          />
          <BlockPath class="*:text-xs mt-1" :block-id="block.id" />
        </div>
      </DropdownMenuItem>
      <Button variant="outline" size="sm" class="w-full mt-2">
        {{ $t("kbView.backlinks.openBacklinksPanel") }}</Button
      >
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import BacklinksContext from "@/context/backlinks";
import BlocksContext from "@/context/blocks/blocks";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import { computed } from "vue";
import BlockContent from "../block-contents/BlockContent.vue";
import BlockPath from "../BlockPath.vue";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const props = defineProps<{
  blockId: string;
}>();

const { blocksManager } = BlocksContext.useContext();
const { getBacklinksConsideringAliases, getAllAliases } = BacklinksContext.useContext();

const backlinks = computed(() => getBacklinksConsideringAliases(props.blockId));
const aliases = computed(() => getAllAliases(props.blockId));
const backlinkBlocks = computed(() => {
  return [...backlinks.value]
    .map((id) => blocksManager.getBlock(id))
    .filter((block): block is Block => block !== null);
});
</script>
