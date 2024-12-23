<template>
  <Dialog class="fusion-command" v-model:open="open">
    <DialogContent
      class="fusion-command-content p-0 [&>button]:hidden overflow-hidden gap-y-0"
      trap-focus
    >
      <div ref="contentEl" @keydown="handleKeydown">
        <div class="relative border-b">
          <div class="absolute left-3 top-1/2 -translate-y-1/2">
            <Search class="size-4 text-muted-foreground" v-if="mode === 'searchBlock'" />
            <Command class="size-4 text-muted-foreground" v-else />
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
          <Input
            class="border-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none pl-10 pr-20"
            v-model="inputText"
            :placeholder="$t('kbView.fusionCommand.searchPlaceholder')"
            @input="handleInput"
            @compositionend="handleInput"
          />
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
              <BlockContent
                :key="block.id"
                :readonly="true"
                :block="block as Block"
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
import { useDebounceFn } from "@vueuse/core";
import { Command, Delete, Search, SlidersHorizontal } from "lucide-vue-next";
import { computed, nextTick, onMounted, ref } from "vue";
import BasicBlockItem from "../display-items/BasicBlockItem.vue";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import ScrollArea from "../ui/scroll-area/ScrollArea.vue";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Checkbox from "../ui/checkbox/Checkbox.vue";
import { BLOCK_TYPE_ZH_NAMES } from "@/common/constants";
import type { Block } from "@/context/blocks-provider/app-state-layer/blocksManager";
import BlocksContext from "@/context/blocks-provider/blocks";
import BlockTreeContext from "@/context/blockTree";
import FusionCommandContext from "@/context/fusionCommand";
import { generateKeydownHandlerSimple } from "@/context/keymap";
import { simpleTokenize } from "@/utils/tokenize";
import BlockContent from "../block-contents/BlockContent.vue";
import IndexContext from "@/context";

const { blocksManager, blockEditor } = BlocksContext.useContext();
const { search } = IndexContext.useContext();
const blockTreeContext = BlockTreeContext.useContext();
const fusionCommandContext = FusionCommandContext.useContext();
const inputText = ref("");
const mode = computed(() => (inputText.value.startsWith("/") ? "searchCommand" : "searchBlock"));
const blockSearchResult = ref<Block[]>([]);
const focusIndex = ref(-1); // -1: 没有选中项
const contentEl = ref<HTMLDivElement | null>(null);
const suppressMouseOver = ref(false);
const open = ref(false);
const allowedBlockTypes = ref<boolean[]>([true, false, false, false, false]); // 默认只允许文本块

const queryTerms = computed(() => {
  if (inputText.value.length == 0) return [];
  return simpleTokenize(inputText.value, false, 1) ?? [];
});

const updateBlockSearchResult = () => {
  const query = inputText.value.trim();
  if (query === "") {
    blockSearchResult.value = [];
    return;
  }
  blockSearchResult.value = search(query)
    .map((r) => blocksManager.getBlock(r.id))
    .filter((b): b is Block => b !== null)
    .filter((b) => b.type == "normalBlock" && allowedBlockTypes.value[b.content[0]]);
  focusIndex.value = blockSearchResult.value.length > 0 ? 0 : -1;
};

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
  const mainTree = blockTreeContext.getBlockTree("main");
  if (!mainTree) return false;
  open.value = false;
  mainTree.focusBlock(focusBlock.id, { highlight: true, expandIfFold: true });
};

const handleKeydown = generateKeydownHandlerSimple({
  ArrowUp: {
    run: () => {
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
    run: () => {
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
    run: () => {
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
    run: () => {
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
    run: () => {
      gotoFocused();
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  // 插入块链接
  "Mod-Enter": {
    run: () => {
      // TODO
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
});

onMounted(() => {
  fusionCommandContext.registerFusionCommand({
    open: (query) => {
      open.value = true;
      inputText.value = query;
      // 打开时，使输入框聚焦
      setTimeout(() => {
        const el = contentEl.value?.querySelector(".fusion-command-content input");
        if (!(el instanceof HTMLInputElement)) return;
        el.focus();
      });
    },
  });
});
</script>
