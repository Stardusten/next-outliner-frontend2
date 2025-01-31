import { createContext } from "@/utils/createContext";
import type { ShallowRef } from "vue";
import { computed, h, ref } from "vue";
import BlocksContext from "./blocks/blocks";
import type { Block } from "./blocks/view-layer/blocksManager";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { useDebounceFn } from "@vueuse/core";
import type { BlockPos } from "./blocks/view-layer/blocksEditor";
import { useTaskQueue } from "@/plugins/taskQueue";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "vue-i18n";
import ToastAction from "@/components/ui/toast/ToastAction.vue";
import { generateKeydownHandlerSimple } from "./keymap";
import { blockRefToTextContent } from "@/utils/pm";
import IndexContext from ".";
import BlockTreeContext, { DI_FILTERS } from "./blockTree";
import LastFocusContext from "./lastFocus";
import BlockSelectDragContext from "./blockSelect";

const BlockMoverContext = createContext(() => {
  const { blocksManager, blockEditor } = BlocksContext.useContext()!;
  const { lastFocusedBlockTree, lastFocusedDiId } = LastFocusContext.useContext()!;
  const { search } = IndexContext.useContext()!;
  const { selectedBlockIds } = BlockSelectDragContext.useContext()!;
  const { getBlockTree } = BlockTreeContext.useContext()!;

  const showPos = ref<{ x: number; y: number } | null>(null);
  const open = computed({
    get: () => showPos.value !== null,
    set: (val) => !val && (showPos.value = null),
  });
  const query = ref<string>("");
  const focusItemIndex = ref<number>(0);
  const suggestions = ref<ShallowRef<Block>[]>([]);
  const suppressMouseOver = ref(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const contentClass = "block-mover-content";
  let leaveRef = false;
  let leaveMirror = false;
  let movedBlockId: BlockId | null = null;

  const updateSuggestions = useDebounceFn(() => {
    if (!query.value || query.value.trim().length == 0) {
      suggestions.value = [];
      return;
    }
    const result = search(query.value);
    suggestions.value = result
      .slice(0, 100)
      .map((id) => blocksManager.getBlockRef(id as string))
      // 只显示文本块
      .filter((blockRef) => {
        const block = blockRef.value;
        return block != null && block.content[0] === BLOCK_CONTENT_TYPES.TEXT;
      }) as any;
    focusItemIndex.value = 0;
  }, 100);

  const withScrollSuppressed = (fn: () => boolean, timeout = 500) => {
    suppressMouseOver.value = true;
    setTimeout(() => (suppressMouseOver.value = false), timeout);
    return fn();
  };

  const handleSelectItem = (blockId: BlockId) => {
    if (blockId == null || movedBlockId == null) return;
    const tree = lastFocusedBlockTree.value ?? getBlockTree("main");
    if (!tree) return;
    const taskQueue = useTaskQueue();

    taskQueue.addTask(async () => {
      const selected = selectedBlockIds.value?.topLevelOnly;
      const movedBlockIds = selected ?? [movedBlockId!];
      const tr = blocksManager.createBlockTransaction({ type: "ui" });
      if (leaveRef) {
        blockEditor.insertNormalBlocks({
          pos: {
            baseBlockId: movedBlockIds[movedBlockIds.length - 1],
            offset: 1,
          },
          blocks: movedBlockIds.map((id) => ({
            content: blockRefToTextContent(id),
          })),
          tr,
          commit: false,
        });
      }
      // leave mirror TODO
      blockEditor.moveBlocks({
        blockIds: movedBlockIds,
        pos: {
          parentId: blockId,
          childIndex: "last-space",
        },
        tr,
        commit: false,
      });
      tr.commit();
      toast({
        title: t("kbView.blockMover.moveSuccess", { count: movedBlockIds.length }),
        action: h(
          ToastAction,
          {
            altText: t("kbView.blockMover.focusMovedBlock"),
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              tree.focusBlock(movedBlockId!, { highlight: true, expandIfFold: true });
            },
          },
          {
            default: () => t("kbView.blockMover.focusMovedBlock"),
          },
        ),
      });
      showPos.value = null;
    });
  };

  const openBlockMover = (
    _showPos: { x: number; y: number },
    _movedBlockId: BlockId | null,
    options: {
      initQuery?: string;
      leaveRef?: boolean;
      leaveMirror?: boolean;
    } = {},
  ) => {
    query.value = options.initQuery ?? "";
    leaveRef = options.leaveRef ?? false;
    leaveMirror = options.leaveMirror ?? false;
    movedBlockId = _movedBlockId;
    // updateSuggestions
    focusItemIndex.value = 0;
    showPos.value = _showPos;
  };

  const ensureFocusedVisible = () => {
    setTimeout(() => {
      const el = document.body.querySelector(`.${contentClass} .focus`);
      if (!(el instanceof HTMLElement)) return;
      el.scrollIntoView({ block: "nearest" });
    });
  };

  const handleKeydown = generateKeydownHandlerSimple({
    Escape: {
      run: (e) => {
        if (e.isComposing || e.keyCode === 229) return false;
        showPos.value = null;
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Enter: {
      run: (e) => {
        if (e.isComposing || e.keyCode === 229) return false;
        const focusBlockId = suggestions.value[focusItemIndex.value]?.value?.id;
        if (focusBlockId != null) {
          handleSelectItem(focusBlockId);
        }
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Backspace: {
      run: (e) => {
        if (e.isComposing || e.keyCode === 229) return false;
        if (query.value.length == 0) {
          open.value = false;
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
      preventDefault: true,
      stopPropagation: true,
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

  const ctx = {
    showPos,
    open,
    query,
    handleSelectItem,
    focusItemIndex,
    suggestions,
    suppressMouseOver,
    updateSuggestions,
    withScrollSuppressed,
    openBlockMover,
    handleKeydown,
    contentClass,
  };
  return ctx;
});

export default BlockMoverContext;
