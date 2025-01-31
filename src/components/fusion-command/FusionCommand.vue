<template>
  <Dialog class="fusion-command" v-model:open="open">
    <DialogContent
      class="fusion-command-content fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-background border p-0 [&>button]:hidden overflow-hidden gap-y-0"
      @keydown.stop
    >
      <DialogHeader class="hidden">
        <DialogTitle></DialogTitle>
        <DialogDescription></DialogDescription>
      </DialogHeader>
      <div ref="contentEl" @keydown="handleKeydown">
        <div class="relative border-b">
          <Input
            class="border-none relative focus-visible:ring-0 focus-visible:ring-offset-0 outline-none pl-10 pr-20"
            v-model="inputText"
            :placeholder="$t('kbView.fusionCommand.searchPlaceholder')"
            @input.capture="handleInput"
            @compositionend="handleInput"
          />
          <div class="absolute left-3 top-1/2 -translate-y-1/2">
            <Search class="size-4" v-if="mode === 'searchBlock'" />
            <Command class="size-4" v-else />
          </div>
          <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-x-2">
            <Popover v-if="mode === 'searchBlock'">
              <PopoverTrigger>
                <SlidersHorizontal
                  class="size-4 text-muted-foreground hover:text-foreground transition cursor-pointer"
                />
              </PopoverTrigger>
              <PopoverContent class="w-40 p-2">
                <!-- TODO: 添加允许的块类型 -->
                <div class="text-[.8em] text-muted-foreground mb-1">
                  {{ $t("kbView.fusionCommand.allowedBlockTypes") }}
                </div>
                <template v-for="(allowed, index) in allowedBlockTypes" :key="index">
                  <div class="flex items-center gap-x-1">
                    <Checkbox
                      :checked="allowedBlockTypes[index]"
                      class="size-3 mr-1"
                      @update:checked="allowedBlockTypes[index] = $event"
                    />
                    <div class="text-[.8em]">{{ BLOCK_TYPE_ZH_NAMES[index] }}</div>
                  </div>
                </template>
              </PopoverContent>
            </Popover>
            <Delete
              class="size-4 text-muted-foreground hover:text-foreground transition cursor-pointer"
              @click="handleClear"
            />
          </div>
        </div>
        <template v-if="mode === 'searchBlock'">
          <div
            class="max-h-[60vh] overflow-y-auto pt-2 px-2 mr-1"
            v-if="blockSearchResult.length > 0"
          >
            <div
              v-for="(block, index) in blockSearchResult"
              tabindex="0"
              :class="{ focus: focusIndex === index }"
              class="cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors [&.focus]:bg-accent [&.focus]:text-accent-foreground [&_.text-content]:cursor-default *:pointer-events-none"
              @mouseover="!suppressMouseOver && (focusIndex = index)"
              @click="gotoFocused()"
            >
              <BlockPath
                :block-id="block.id"
                :include-self="false"
                class="*:text-xs mb-1"
                @click-path-segment="gotoFocused"
              />
              <BlockContent
                :key="block.id"
                :readonly="true"
                :block="block as unknown as Block"
                :highlight-terms="queryTerms"
              ></BlockContent>
            </div>
          </div>
          <div v-else class="text-center text-sm text-muted-foreground pt-4 pb-2">
            {{ $t("kbView.fusionCommand.noResults") }}
          </div>
        </template>
        <template v-else>
          <ScrollArea max-height="60vh" v-if="blockSearchResult.length > 0">
            <div class="px-2 py-2"></div>
          </ScrollArea>
          <div v-else class="text-center text-sm text-muted-foreground pt-4 pb-2">
            {{ $t("kbView.fusionCommand.noCommandResults") }}
          </div>
        </template>
        <div v-if="mode === 'searchBlock'" class="text-center text-xs text-muted2-foreground py-2">
          {{ $t("kbView.fusionCommand.searchHelp") }}
        </div>
        <div v-else class="text-center text-xs text-muted2-foreground py-2">
          {{ $t("kbView.fusionCommand.commandHelp") }}
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { BLOCK_TYPE_ZH_NAMES } from "@/common/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import BlockTreeContext from "@/context/blockTree";
import FusionCommandContext from "@/context/fusionCommand";
import { generateKeydownHandlerSimple } from "@/context/keymap";
import { useDebounceFn } from "@vueuse/core";
import { Command, Delete, Search, SlidersHorizontal } from "lucide-vue-next";
import BlockContent from "../block-contents/BlockContent.vue";
import Checkbox from "../ui/checkbox/Checkbox.vue";
import { Input } from "../ui/input";
import ScrollArea from "../ui/scroll-area/ScrollArea.vue";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import BlockPath from "../BlockPath.vue";

const blockTreeContext = BlockTreeContext.useContext()!;
const {
  inputText,
  mode,
  blockSearchResult,
  focusIndex,
  contentEl,
  suppressMouseOver,
  open,
  allowedBlockTypes,
  queryTerms,
  updateBlockSearchResult,
} = FusionCommandContext.useContext()!;

const handleInput = useDebounceFn((e: any) => {
  if (e.isComposing) return;
  if (mode.value === "searchBlock") updateBlockSearchResult();
}, 500);

const handleClear = () => {
  inputText.value = "";
  blockSearchResult.value = [];
};

const ensureFocusedVisiblle = () => {
  setTimeout(() => {
    const el = contentEl.value?.querySelector(".fusion-command-content .focus");
    if (!(el instanceof HTMLElement)) return;
    el.scrollIntoView({ block: "nearest" });
  });
};

const withScrollSuppressed = (fn: () => boolean, timeout = 500) => {
  suppressMouseOver.value = true;
  setTimeout(() => (suppressMouseOver.value = false), timeout);
  return fn();
};

const gotoFocused = () => {
  if (focusIndex.value === -1) return false;
  const focusBlock = blockSearchResult.value[focusIndex.value];
  if (!focusBlock) return false;
  const tree = blockTreeContext.getBlockTree("main");
  if (!tree) return false;
  open.value = false;
  tree.focusBlock(focusBlock.id, { highlight: true, expandIfFold: true });
};

const handleKeydown = generateKeydownHandlerSimple({
  ArrowUp: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      return withScrollSuppressed(() => {
        if (focusIndex.value > 0) {
          focusIndex.value--;
        } else {
          focusIndex.value = blockSearchResult.value.length - 1;
        }
        ensureFocusedVisiblle();
        return true;
      });
    },
    stopPropagation: true,
    preventDefault: true,
  },
  ArrowDown: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      return withScrollSuppressed(() => {
        if (focusIndex.value < blockSearchResult.value.length - 1) {
          focusIndex.value++;
        } else {
          focusIndex.value = 0;
        }
        ensureFocusedVisiblle();
        return true;
      });
    },
    stopPropagation: true,
    preventDefault: true,
  },
  Home: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      return withScrollSuppressed(() => {
        focusIndex.value = 0;
        ensureFocusedVisiblle();
        return true;
      });
    },
    stopPropagation: true,
    preventDefault: true,
  },
  End: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      return withScrollSuppressed(() => {
        focusIndex.value = blockSearchResult.value.length - 1;
        ensureFocusedVisiblle();
        return true;
      });
    },
    stopPropagation: true,
    preventDefault: true,
  },
  // 聚焦到选中项
  Enter: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      gotoFocused();
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  // 插入块链接
  "Mod-Enter": {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      // TODO
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  Escape: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      open.value = false;
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
});
</script>
