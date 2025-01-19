import { createContext } from "@/utils/createContext";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type { DisplayItem, DisplayItemId } from "@/utils/display-item";
import type mitt from "@/utils/mitt";
import type { EditorView as PmEditorView } from "prosemirror-view";
import type { EditorView as CmEditorView } from "@codemirror/view";
import type { Block } from "./blocks/view-layer/blocksManager";
import { ref, type Ref } from "vue";

export type BlockTreeId = string;

export type BlockTreeEventMap = {
  displayItemsUpdated: [DisplayItem[]];
};

export interface BlockTreeProps {
  id: string;
  virtual?: boolean;
  rootBlockIds: BlockId[];
  rootBlockLevel: number;
  addSidePaneHeader?: boolean;
  enlargeRootBlock?: boolean;
  showBacklinks?: boolean;
  showPotentialLinks?: boolean;
  paddingBottom?: number;
  paddingTop?: number;
}

export type DiFocusOptions = {
  scrollIntoView?: boolean;
  highlight?: boolean;
};

export type BlockFocusOptions = {
  scrollIntoView?: boolean;
  highlight?: boolean;
  expandIfFold?: boolean;
};

export const DI_FILTERS = {
  isBlockDi: (di: DisplayItem) =>
    di.type === "basic-block" ||
    di.type === "backlink-block" ||
    di.type === "backlink-descendant" ||
    di.type === "potential-links-block" ||
    di.type === "potential-links-descendant" ||
    di.type === "root-block",
};

export type BlockTree = {
  getProps: () => BlockTreeProps;
  getId: () => string;
  getDom: () => HTMLElement;
  getRootBlockIds: () => BlockId[];
  getDisplayItems: () => DisplayItem[];
  getDi: (itemId: DisplayItemId) => DisplayItem | null;
  findDi: (
    filter: (item: DisplayItem, index: number) => boolean,
    dir?: "forward" | "backward",
  ) => readonly [DisplayItem, number] | null;

  expandedBP: Ref<Record<DisplayItemId, boolean>>;

  localEventBus: ReturnType<typeof mitt<BlockTreeEventMap>>;
  nextUpdate: (cb?: () => void | Promise<void>) => Promise<void>;

  getEditorViews: () => Map<DisplayItemId, CmEditorView | PmEditorView>;
  getEditorView: (itemId: DisplayItemId) => CmEditorView | PmEditorView | null;
  registerEditorView: (itemId: DisplayItemId, editorView: PmEditorView | CmEditorView) => void;
  unregisterEditorView: (itemId: DisplayItemId, editorView: PmEditorView | CmEditorView) => void;

  getSuccessorDi: (
    itemId: DisplayItemId,
    filter?: (item: DisplayItem) => boolean,
  ) => [DisplayItem, number] | null;
  getPredecessorDi: (
    itemId: DisplayItemId,
    filter?: (item: DisplayItem) => boolean,
  ) => [DisplayItem, number] | null;
  getDiAbove: (
    itemId: DisplayItemId,
    filter?: (item: DisplayItem) => boolean,
  ) => [DisplayItem, number] | null;
  getDiBelow: (
    itemId: DisplayItemId,
    filter?: (item: DisplayItem) => boolean,
  ) => [DisplayItem, number] | null;

  focusDi: (itemId: DisplayItemId, options?: DiFocusOptions) => Promise<void>;
  focusBlock: (blockId: BlockId, options?: BlockFocusOptions) => Promise<void>;
  getDomOfDi: (itemId: string) => HTMLElement | null;

  moveCursorToTheEnd: (itemId: DisplayItemId) => void;
  moveCursorToBegin: (itemId: DisplayItemId) => void;
};

export const BlockTreeContext = createContext(() => {
  const blockTrees = new Map<BlockTreeId, BlockTree>();

  const registerBlockTree = (blockTree: BlockTree) => {
    blockTrees.set(blockTree.getId(), blockTree);
  };

  const getBlockTree = (id: BlockTreeId) => {
    return blockTrees.get(id);
  };

  const unregisterBlockTree = (id: BlockTreeId) => {
    blockTrees.delete(id);
  };

  const ctx = {
    registerBlockTree,
    getBlockTree,
    unregisterBlockTree,
  };
  return ctx;
});

export default BlockTreeContext;
