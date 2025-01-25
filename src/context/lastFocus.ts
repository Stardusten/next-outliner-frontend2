import { createContext } from "@/utils/createContext";
import type { DisplayItemId } from "@/utils/display-item";
import { computed, shallowRef } from "vue";
import BlockTreeContext, { type BlockTree } from "./blockTree";

const LastFocusContext = createContext(() => {
  const lastFocusedDiId = shallowRef<DisplayItemId | null>(null);
  const lastFocusedBlockTree = shallowRef<BlockTree | null>(null);
  const { getBlockTree } = BlockTreeContext.useContext()!;

  const lastFocusedEditorView = computed(() => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return null;
    return tree.getEditorView(diId);
  });

  const lastFocusedDi = computed(() => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return null;
    return tree.getDi(diId);
  });

  const focusedDiId = computed(() => {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement) {
      let curr = activeEl;
      while (curr) {
        if (curr.dataset.itemId) return curr.dataset.itemId;
        if (!(curr.parentElement instanceof HTMLElement)) break;
        curr = curr.parentElement;
      }
    }
    return null;
  });

  const focusedBlockTree = computed(() => {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement) {
      let curr = activeEl;
      while (curr) {
        if (curr.dataset.blockTreeId) {
          const treeId = curr.dataset.blockTreeId;
          return getBlockTree(treeId) ?? null;
        }
        if (!(curr.parentElement instanceof HTMLElement)) break;
        curr = curr.parentElement;
      }
    }
    return null;
  });

  const focusedEditorView = computed(() => {
    const tree = focusedBlockTree.value;
    const diId = focusedDiId.value;
    if (!tree || !diId) return null;
    return tree.getEditorView(diId);
  });

  const focusedDi = computed(() => {
    const tree = focusedBlockTree.value;
    const diId = focusedDiId.value;
    if (!tree || !diId) return null;
    return tree.getDi(diId);
  });

  const ctx = {
    lastFocusedDiId,
    lastFocusedBlockTree,
    lastFocusedEditorView,
    lastFocusedDi,
    focusedDiId,
    focusedBlockTree,
    focusedEditorView,
    focusedDi,
  };
  return ctx;
});

export default LastFocusContext;
