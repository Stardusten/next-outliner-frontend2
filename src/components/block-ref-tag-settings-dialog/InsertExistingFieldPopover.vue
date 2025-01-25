<template>
  <Popover v-model:open="open">
    <PopoverTrigger>
      <slot />
    </PopoverTrigger>
    <PopoverContent
      class="field-suggestions-content z-[999] py-2 pb-0 px-1 max-h-[300px] max-w-[300px] overflow-hidden"
      trap-focus
      tabindex="-1"
      @keydown="handleKeydown"
    >
      <div class="relative px-1">
        <div
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground flex items-center"
        >
          <Search class="size-4" />
        </div>
        <Input
          @input="onInput"
          @compositionend="onCompositionEnd"
          :placeholder="$t('kbView.blockRefTagSettings.searchFields')"
          v-model="query"
          class="h-[32px] pl-8 rounded-sm focus-visible:outline-none focus-visible:ring-transparent placeholder:text-muted-foreground/50"
        />
      </div>

      <div class="my-2 max-h-[240px] overflow-y-auto px-1">
        <template v-for="(field, index) in suggestions" :key="field.id">
          <div
            class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 text-sm outline-none [&.focus]:bg-accent [&.focus]:text-accent-foreground"
            :class="{ focus: focusItemIndex === index }"
            @mouseover="!suppressMouseOver && (focusItemIndex = index)"
            @click="handleSelectField(field)"
          >
            <BlockContent
              :block="field as any"
              readonly
              class="*:cursor-default"
              :highlight-terms="queryTerms"
            ></BlockContent>
          </div>
        </template>

        <div v-if="suggestions.length === 0" class="text-center">
          <span class="text-sm text-muted-foreground">
            {{ $t("kbView.blockRefTagSettings.noFieldsFound") }}
          </span>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Search } from "lucide-vue-next";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import FieldsManagerContext from "@/context/fieldsManager";
import { generateKeydownHandlerSimple } from "@/context/keymap";
import { hybridTokenize, calcMatchScore } from "@/utils/tokenize";
import { useDebounceFn } from "@vueuse/core";
import BlockContent from "../block-contents/BlockContent.vue";
import type { Block, MinimalBlock } from "@/context/blocks/view-layer/blocksManager";
import BlocksContext from "@/context/blocks/blocks";
import SearchSettingsContext from "@/context/searchSettings";

const emit = defineEmits<{
  (e: "select", field: MinimalBlock): void;
}>();

const { allFields } = FieldsManagerContext.useContext()!;
const { blocksManager } = BlocksContext.useContext()!;
const { ignoreDiacritics } = SearchSettingsContext.useContext()!;

const open = ref(false);
const query = ref("");
const focusItemIndex = ref(0);
const suppressMouseOver = ref(false);
const suggestions = ref<Block[]>([]);

const queryTerms = computed(() => {
  if (query.value.length === 0) return [];
  return (
    hybridTokenize(query.value, {
      caseSensitive: false,
      cjkNGram: 1,
      includePrefix: false,
      removeDiacritics: ignoreDiacritics.value,
    }) ?? []
  );
});

const updateSuggestions = useDebounceFn(() => {
  const fieldIds = Array.from(allFields.value.keys());

  const fields: Block[] = [];
  for (const id of fieldIds) {
    const field = blocksManager.getBlock(id);
    if (!field) continue;
    fields.push(field);
  }

  if (!query.value) {
    suggestions.value = fields;
    return;
  }

  const queryTokens =
    hybridTokenize(query.value, {
      caseSensitive: false,
      cjkNGram: 1,
      includePrefix: false,
      removeDiacritics: ignoreDiacritics.value,
    }) ?? [];
  if (queryTokens.length === 0) {
    suggestions.value = fields;
    return;
  }

  const fieldsWithScores = fields
    .map((block) => ({
      block,
      score: calcMatchScore(queryTokens, block.ctext + " " + block.mtext),
    }))
    .filter((item) => item.score > 0);

  fieldsWithScores.sort((a, b) => b.score - a.score);

  suggestions.value = fieldsWithScores.map((item) => item.block);
}, 500);

const handleSelectField = (field: MinimalBlock) => {
  emit("select", field);
  close();
};

const withScrollSuppressed = (fn: () => boolean, timeout = 500) => {
  suppressMouseOver.value = true;
  setTimeout(() => (suppressMouseOver.value = false), timeout);
  return fn();
};

const ensureFocusedVisible = () => {
  setTimeout(() => {
    const el = document.body.querySelector(".field-suggestions-content .focus");
    if (!(el instanceof HTMLElement)) return;
    el.scrollIntoView({ block: "nearest" });
  });
};

const onInput = (e: any) => {
  if (e.isComposing) return;
  query.value = e.target.value;
  updateSuggestions();
};

const onCompositionEnd = (e: any) => {
  query.value = e.target.value;
  updateSuggestions();
};

const close = () => {
  open.value = false;
  query.value = "";
  suggestions.value = [];
  focusItemIndex.value = 0;
};

const handleKeydown = generateKeydownHandlerSimple({
  Escape: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      close();
      return true;
    },
  },
  Enter: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      const field = suggestions.value[focusItemIndex.value];
      if (field) {
        handleSelectField(field);
      }
      return true;
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
});
</script>
