<template>
  <Popover v-model:open="open">
    <PopoverTrigger class="hidden" />
    <PopoverContent
      class="ref-suggestions-content z-[999] py-2 pb-0 px-1 max-h-[300px] max-w-[300px] overflow-hidden"
      trap-focus
      tabindex="-1"
      @keydown="handleKeydown"
    >
      <div class="relative px-1">
        <div
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground flex items-center"
        >
          <template v-if="isFileRef">
            <File class="size-4" />
          </template>
          <template v-else-if="isFileEmbed">
            <span class="text-sm">![]</span>
          </template>
          <template v-else>
            <Search class="size-4" />
          </template>
        </div>
        <Input
          @input="onInput"
          @compositionend="onCompositionEnd"
          :placeholder="$t('kbView.refSuggestions.placeholder')"
          v-model="query"
          class="h-[32px] pl-8 rounded-sm focus-visible:outline-none focus-visible:ring-transparent placeholder:text-muted-foreground/50"
        />
      </div>
      <!-- XXX scroll area 的高度是 250px，因为 max-h 是 300px，减去 input 的高度和中间的 padding 就是 250px，并不优雅 -->
      <div class="my-2 max-h-[240px] overflow-y-auto px-1">
        <template v-for="(item, index) in suggestions" :key="item.type">
          <div
            v-if="item.type === 'block'"
            class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 text-sm outline-none [&.focus]:bg-accent [&.focus]:text-accent-foreground"
            :class="{ focus: focusItemIndex === index }"
            @mouseover="!suppressMouseOver && (focusItemIndex = index)"
            @click="handleSelectItem(item as any)"
          >
            <BlockContent
              :block="item.block as any"
              readonly
              class="*:cursor-default"
              :highlight-terms="queryTerms"
            ></BlockContent>
          </div>
          <div
            v-else-if="putNewBlockAtBlock && item.type === 'createNew'"
            class="flex w-full text-sm items-center cursor-default select-none text-muted-foreground rounded-sm py-1.5 pl-2 [&.focus]:bg-accent [&.focus]:text-accent-foreground"
            :class="{ focus: focusItemIndex === index }"
            @mouseover="!suppressMouseOver && (focusItemIndex = index)"
            @click="handleSelectItem(item)"
          >
            <Plus class="size-4 mr-2" />
            {{ $t("kbView.refSuggestions.createNewUnder1") }}
            "<BlockContent
              :block="putNewBlockAtBlock"
              class="*:cursor-default"
              readonly
            ></BlockContent
            >"
            {{ $t("kbView.refSuggestions.createNewUnder2") }}
          </div>
          <div
            v-else-if="item.type === 'file'"
            class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 text-sm outline-none [&.focus]:bg-accent [&.focus]:text-accent-foreground"
            :class="{ focus: focusItemIndex === index }"
            @mouseover="!suppressMouseOver && (focusItemIndex = index)"
            @click="handleSelectItem(item)"
          >
            <FileIcon class="size-4 mr-2 flex-shrink-0" />
            <span class="truncate">
              <HighlightedText :text="item.file.name" :highlight-terms="queryTerms" />
            </span>
          </div>
        </template>

        <div v-if="suggestions.length === 0" class="text-center">
          <span class="text-sm text-muted-foreground">
            {{ $t("kbView.refSuggestions.noSuggestions") }}
          </span>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { generateKeydownHandlerSimple } from "@/context/keymap";
import RefSuggestionsContext, { type SuggestionItem } from "@/context/refSuggestions";
import { calcPopoverPos } from "@/utils/popover";
import { hybridTokenize } from "@/utils/tokenize";
import { Plus, Search, FileIcon, File } from "lucide-vue-next";
import { computed, nextTick, watch } from "vue";
import BlockContent from "../block-contents/BlockContent.vue";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import BacklinksContext from "@/context/backlinks";
import BlocksContext from "@/context/blocks/blocks";
import { useTaskQueue } from "@/plugins/taskQueue";
import { plainTextToTextContent } from "@/utils/pm";
import { getPmSchema } from "../prosemirror/pmSchema";
import LastFocusContext from "@/context/lastFocus";
import { EditorView } from "prosemirror-view";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import HighlightedText from "@/components/highlighted-text/HighlightedText.vue";

const {
  showPos,
  open,
  query,
  queryTerms,
  focusItemIndex,
  suggestions,
  suppressMouseOver,
  handleSelectItem,
  updateSuggestions,
  withScrollSuppressed,
} = RefSuggestionsContext.useContext()!;
const { putNewBlockAt } = BacklinksContext.useContext()!;
const { blocksManager, blockEditor } = BlocksContext.useContext()!;

const taskQueue = useTaskQueue();

const putNewBlockAtBlock = computed(() => {
  const id = putNewBlockAt.value === "" ? "root" : putNewBlockAt.value;
  return blocksManager.getBlock(id);
});

watch(showPos, async () => {
  await nextTick();

  if (!showPos.value) {
    // 延迟 1s 移除样式，因为有淡出动画
    // setTimeout(() => {
    //   document.body.style.removeProperty("--popover-x");
    //   document.body.style.removeProperty("--popover-y");
    // }, 1000);
    // 不移除更好，因为可能会意外移除另一次弹出时设置的样式，导致奇怪的问题
    return;
  }

  const el = document.querySelector("[data-radix-popper-content-wrapper]");
  if (!(el instanceof HTMLElement)) return;
  const { x, y } = showPos.value!;
  // const elRect = el.getBoundingClientRect();
  // 这里固定宽度，高度计算，因为候选变化会导致高度变化，如果每次候选变化都重新计算高度
  // 可能导致 popover 位置变化，体验不好
  const popoverPos = calcPopoverPos(300, 300, x, y, {
    // const popoverPos = calcPopoverPos(elRect.width, elRect.height, x, y, {
    // showPos 是行内元素右上角的位置
    // 为了防止遮挡当前行，如果是向下方弹出，应该向下偏移 30px
    offset: (pos) => {
      pos.leftDown.y += 30;
      pos.rightDown.y += 30;
      return pos;
    },
  });
  // 默认向右下弹出
  // 这里把弹出位置作为 CSS 变量绑定到 body 上
  // 因为 shadcn / radix 把 popover 的样式写死了
  // 只能这样去覆盖
  document.body.style.setProperty("--popover-x", `${popoverPos.rightDown.x}px`);
  document.body.style.setProperty("--popover-y", `${popoverPos.rightDown.y}px`);
});

const onInput = (e: any) => {
  if (e.isComposing) return;
  updateSuggestions();
};

const onCompositionEnd = (e: any) => {
  updateSuggestions();
};

const ensureFocusedVisible = () => {
  setTimeout(() => {
    const el = document.body.querySelector(".ref-suggestions-content .focus");
    if (!(el instanceof HTMLElement)) return;
    el.scrollIntoView({ block: "nearest" });
  });
};

const handleKeydown = generateKeydownHandlerSimple({
  Escape: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      handleSelectItem({ type: "nothing" });
      return true;
    },
  },
  Enter: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      const focusItem = suggestions.value[focusItemIndex.value] as SuggestionItem;
      handleSelectItem(focusItem);
      return true;
    },
    preventDefault: true,
    stopPropagation: true,
  },
  Backspace: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      if (query.value.length == 0) {
        showPos.value = null;
        handleSelectItem({ type: "nothing" });
        return true;
      }
      return false;
    },
    preventDefault: true,
    stopPropagation: true,
  },
  ArrowUp: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      return withScrollSuppressed(() => {
        if (focusItemIndex.value > 0) {
          focusItemIndex.value--;
        } else {
          focusItemIndex.value = suggestions.value.length - 1;
        }
        ensureFocusedVisible();
        return true;
      });
    },
    preventDefault: true,
    stopPropagation: true,
  },
  ArrowDown: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      return withScrollSuppressed(() => {
        if (focusItemIndex.value < suggestions.value.length - 1) {
          focusItemIndex.value++;
        } else {
          focusItemIndex.value = 0;
        }
        ensureFocusedVisible();
        return true;
      });
    },
    preventDefault: true,
    stopPropagation: true,
  },
  Home: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      return withScrollSuppressed(() => {
        focusItemIndex.value = 0;
        ensureFocusedVisible();
        return true;
      });
    },
  },
  End: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      return withScrollSuppressed(() => {
        focusItemIndex.value = suggestions.value.length - 1;
        ensureFocusedVisible();
        return true;
      });
    },
    preventDefault: true,
    stopPropagation: true,
  },
});

const isFileRef = computed(() => query.value.startsWith("/"));
const isFileEmbed = computed(() => /^[!！]/.test(query.value));
</script>

<style lang="scss">
// 覆盖 radix-vue 的样式，这允许我们自己指定 popover 的位置
// 这里使用了 :has 选择器，保证不干扰其他 popover 的样式
[data-radix-popper-content-wrapper]:has(> .ref-suggestions-content) {
  transform: translate(var(--popover-x), var(--popover-y)) !important;
}

.ref-suggestions-content .highlight-keep {
  background-color: var(--highlight-text-bg);
}
</style>
