import { createContext } from "@/utils/createContext";
import { computed, ref, type Ref } from "vue";
import type { Block } from "./blocks/view-layer/blocksManager";
import { hybridTokenize } from "@/utils/tokenize";
import IndexContext from ".";
import BlocksContext from "./blocks/blocks";
import { nextTick } from "vue";
import SearchSettingsContext from "./searchSettings";

export const FusionCommandContext = createContext(() => {
  const { blocksManager } = BlocksContext.useContext()!;
  const { search } = IndexContext.useContext()!;
  const { ignoreDiacritics } = SearchSettingsContext.useContext()!;

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
    const result =
      hybridTokenize(inputText.value, {
        caseSensitive: false,
        cjkNGram: 1,
        includePrefix: false,
        removeDiacritics: ignoreDiacritics.value,
      }) ?? [];
    return result;
  });

  const updateBlockSearchResult = () => {
    const query = inputText.value.trim();
    if (query === "") {
      blockSearchResult.value = [];
      return;
    }
    blockSearchResult.value = search(query)
      .map((id) => blocksManager.getBlock(id as string))
      .filter((b): b is Block => b !== null)
      .filter((b) => b.type == "normalBlock" && allowedBlockTypes.value[b.content[0]]);
    focusIndex.value = blockSearchResult.value.length > 0 ? 0 : -1;
  };

  const openFusionCommand = (query: string) => {
    inputText.value = query;
    open.value = true;
    nextTick(() => {
      const inputEl = contentEl.value?.querySelector("input");
      if (!(inputEl instanceof HTMLElement)) return;
      inputEl.focus();
    });
  };

  const ctx = {
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
    openFusionCommand,
  };
  return ctx;
});

export default FusionCommandContext;
