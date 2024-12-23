import { createContext } from "@/utils/createContext";
import type { ShallowRef } from "vue";
import { computed, h, ref } from "vue";
import BlocksContext from "./blocks-provider/blocks";
import type { Block } from "./blocks-provider/app-state-layer/blocksManager";
import type { BlockId } from "@/common/types";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { useDebounceFn } from "@vueuse/core";
import type { BlockPos } from "./blocks-provider/app-state-layer/blocksEditor";
import { useTaskQueue } from "@/plugins/taskQueue";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "vue-i18n";
import ToastAction from "@/components/ui/toast/ToastAction.vue";
import { generateKeydownHandlerSimple } from "./keymap";
import { textContentFromBlockRef } from "@/utils/pm";
import IndexContext from ".";

const BlockMoverContext = createContext(() => {
  const { blocksManager } = BlocksContext.useContext();
  const { search } = IndexContext.useContext();
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
  const contentEl = ref<HTMLElement | null>(null);
  const contentClass = "block-mover-content";
  let leaveRef = false;
  let leaveMirror = false;

  const updateSuggestions = useDebounceFn(() => {
    if (!query.value || query.value.trim().length == 0) {
      suggestions.value = [];
      return;
    }
    const result = search(query.value, { prefix: true });
    suggestions.value = result
      .slice(0, 100)
      .map((item) => blocksManager.getBlockRef(item.id))
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

  const cb = (blockId: BlockId | null) => {
    if (blockId == null) return;
    const { lastFocusedBlockId, lastFocusedBlockTree } = globalThis.getLastFocusContext() ?? {};
    if (lastFocusedBlockId?.value == null) return;
    const movedBlockId = lastFocusedBlockId.value;
    const taskQueue = useTaskQueue();
    const targetPos: BlockPos = {
      parentId: blockId,
      childIndex: "last-space",
    };
    taskQueue.addTask(async () => {
      const { blockEditor } = globalThis.getBlocksContext() ?? {};
      if (blockEditor == null) return;
      const tree = lastFocusedBlockTree?.value;
      if (leaveRef) {
        blockEditor.insertNormalBlock({
          pos: {
            baseBlockId: movedBlockId,
            offset: 0,
          },
          content: textContentFromBlockRef(movedBlockId),
        });
      }
      // leave mirror TODO
      const { focusNext } = blockEditor.moveBlock({ blockId: movedBlockId, pos: targetPos }) ?? {};
      toast({
        title: t("kbView.blockMover.moveSuccess", { count: 1 }),
        action: h(
          ToastAction,
          {
            altText: t("kbView.blockMover.focusMovedBlock"),
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              if (tree && focusNext) {
                tree.focusBlock(focusNext, { highlight: true, expandIfFold: true });
              }
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
    options: {
      initQuery?: string;
      leaveRef?: boolean;
      leaveMirror?: boolean;
    } = {},
  ) => {
    query.value = options.initQuery ?? "";
    leaveRef = options.leaveRef ?? false;
    leaveMirror = options.leaveMirror ?? false;
    // updateSuggestions
    focusItemIndex.value = 0;
    showPos.value = _showPos;
  };

  const ensureFocusedVisible = () => {
    setTimeout(() => {
      const el = contentEl.value?.querySelector(".focus");
      if (!(el instanceof HTMLElement)) return;
      el.scrollIntoView({ block: "nearest" });
    });
  };

  const handleKeydown = generateKeydownHandlerSimple({
    Escape: {
      run: () => {
        showPos.value = null;
        cb(null);
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Enter: {
      run: () => {
        const focusBlockId = suggestions.value[focusItemIndex.value]?.value?.id;
        if (focusBlockId != null) {
          cb(focusBlockId);
        }
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Backspace: {
      run: () => {
        if (query.value.length == 0) {
          cb(null);
          return true;
        }
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    ArrowUp: {
      run: () => {
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
      run: () => {
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
      run: () => {
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
      run: () => {
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
    cb,
    focusItemIndex,
    suggestions,
    suppressMouseOver,
    updateSuggestions,
    withScrollSuppressed,
    openBlockMover,
    handleKeydown,
    contentEl,
    contentClass,
  };

  // 注册到全局
  globalThis.getBlockMoverContext = () => ctx;

  return ctx;
});

export default BlockMoverContext;
