<template>
  <div
    class="block-tree select-none"
    ref="$blockTree"
    :block-tree-id="id"
    :style="{
      '--padding-bottom': `${paddingBottom}px`,
      '--padding-top': `${paddingTop}px`,
    }"
    @pointerdown="handlePointerDown"
  >
    <virt-list
      v-if="virtual"
      itemKey="itemId"
      class="vlist"
      :list="displayItems"
      :buffer="10"
      :minSize="24"
      ref="$vlist"
      itemClass="block-container"
    >
      <template #header> </template>
      <template #default="{ itemData }">
        <RootBlockItem
          v-if="itemData.type == 'root-block'"
          :key="itemData.itemId"
          :item-id="itemData.itemId"
          :block-tree="controller"
          :block="itemData.block"
          :highlight-terms="itemData.highlightTerms"
          :highlight-refs="itemData.highlightRefs"
        ></RootBlockItem>
        <BasicBlockItem
          v-if="itemData.type == 'basic-block'"
          :key="itemData.itemId"
          :item-id="itemData.itemId"
          :block-tree="controller"
          :block="itemData.block"
          :level="itemData.level"
          :highlight-terms="itemData.highlightTerms"
          :highlight-refs="itemData.highlightRefs"
        ></BasicBlockItem>
        <BacklinksHeaderItem
          v-if="itemData.type == 'backlink-header'"
          :key="itemData.itemId"
          :block-tree="controller"
          :block-id="itemData.blockId"
          :backlinks="itemData.backlinks"
        ></BacklinksHeaderItem>
        <BacklinksBlockItem
          v-if="itemData.type == 'backlink-block'"
          :key="itemData.itemId"
          :item-id="itemData.itemId"
          :block-tree="controller"
          :block="itemData.block"
          :ref-block-id="itemData.refBlockId"
          :readonly="itemData.readonly"
          :highlight-terms="itemData.highlightTerms"
          :highlight-refs="itemData.highlightRefs"
        ></BacklinksBlockItem>
        <BacklinksDescendantItem
          v-if="itemData.type == 'backlink-descendant'"
          :key="itemData.itemId"
          :item-id="itemData.itemId"
          :block-tree="controller"
          :block="itemData.block"
          :level="itemData.level"
          :readonly="itemData.readonly"
          :highlight-terms="itemData.highlightTerms"
          :highlight-refs="itemData.highlightRefs"
        ></BacklinksDescendantItem>
        <PotentialLinksHeaderItem
          v-if="itemData.type == 'potential-links-header'"
          :key="itemData.itemId"
          :block-id="itemData.blockId"
          :potential-links="itemData.potentialLinks"
        ></PotentialLinksHeaderItem>
        <PotentialLinksBlockItem
          v-if="itemData.type == 'potential-links-block'"
          :key="itemData.itemId"
          :item-id="itemData.itemId"
          :block-tree="controller"
          :block="itemData.block"
          :ref-block-id="itemData.refBlockId"
          :readonly="itemData.readonly"
          :highlight-terms="itemData.highlightTerms"
          :highlight-refs="itemData.highlightRefs"
        ></PotentialLinksBlockItem>
        <PotentialLinksDescendantItem
          v-if="itemData.type == 'potential-links-descendant'"
          :key="itemData.itemId"
          :item-id="itemData.itemId"
          :block-tree="controller"
          :block="itemData.block"
          :level="itemData.level"
          :readonly="itemData.readonly"
          :highlight-terms="itemData.highlightTerms"
          :highlight-refs="itemData.highlightRefs"
        ></PotentialLinksDescendantItem>
        <MissingBlockItem
          v-if="itemData.type == 'missing-block'"
          :key="itemData.itemId"
          :item-id="itemData.itemId"
          :block-id="itemData.blockId"
          :level="itemData.level"
        ></MissingBlockItem>
        <SidePaneItemHeader
          v-if="itemData.type == 'side-pane-header'"
          :key="itemData.itemId"
          :block-tree="controller"
          :block-id="itemData.blockId"
          :item-id="itemData.itemId"
        ></SidePaneItemHeader>
      </template>
      <template #footer> </template>
    </virt-list>
  </div>
</template>

<script setup lang="ts">
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import BlocksContext from "@/context/blocks/blocks";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import BlockSelectDragContext from "@/context/blockSelect";
import {
  BlockTreeContext,
  DI_FILTERS,
  type BlockFocusOptions,
  type BlockTree,
  type BlockTreeEventMap,
  type BlockTreeProps,
  type DiFocusOptions,
} from "@/context/blockTree";
import { useEventBus } from "@/plugins/eventbus";
import {
  generateDisplayItems,
  isBlockDi,
  type DisplayBlockItem,
  type DisplayItem,
  type DisplayItemId,
} from "@/utils/display-item";
import { getHoveredElementWithClass, inViewport } from "@/utils/dom";
import mitt from "@/utils/mitt";
import { EditorView as CmEditorView } from "@codemirror/view";
import { useThrottleFn } from "@vueuse/core";
import { AllSelection } from "prosemirror-state";
import { EditorView as PmEditorView } from "prosemirror-view";
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { VirtList } from "vue-virt-list";
import BasicBlockItem from "./display-items/BasicBlockItem.vue";
import { timeout } from "@/utils/time";
import BacklinksBlockItem from "./display-items/BacklinksBlockItem.vue";
import BacklinksHeaderItem from "./display-items/BacklinksHeaderItem.vue";
import PotentialLinksBlockItem from "./display-items/PotentialLinksBlockItem.vue";
import PotentialLinksHeaderItem from "./display-items/PotentialLinksHeaderItem.vue";
import BacklinksDescendantItem from "./display-items/BacklinksDescendantItem.vue";
import PotentialLinksDescendantItem from "./display-items/PotentialLinksDescendantItem.vue";
import { clip } from "@/utils/popover";
import { useTaskQueue } from "@/plugins/taskQueue";
import MissingBlockItem from "./display-items/MissingBlockItem.vue";
import RootBlockItem from "./display-items/RootBlockItem.vue";
import BacklinksContext from "@/context/backlinks";
import IndexContext from "@/context";
import SidePaneItemHeader from "./display-items/SidePaneItemHeader.vue";

const props = withDefaults(defineProps<BlockTreeProps>(), {
  virtual: true,
  showBacklinks: true,
  showPotentialLinks: true,
  addSidePaneHeader: false,
  enlargeRootBlock: false,
  paddingBottom: 200,
  paddingTop: 0,
});
const eventBus = useEventBus();
const blockTreeContext = BlockTreeContext.useContext()!;
const backlinksContext = BacklinksContext.useContext()!;
const indexContext = IndexContext.useContext()!;
const { blocksManager, blockEditor } = BlocksContext.useContext()!;
const dndCtx = BlockSelectDragContext.useContext()!;
const $blockTree = ref<HTMLElement | null>(null);
const $vlist = ref<InstanceType<typeof VirtList> | null>(null);
const displayItems = shallowRef<DisplayItem[]>();
const localEventBus = mitt<BlockTreeEventMap>();
const changeRef = eventBus.eventRefs.afterBlocksTrCommit;
const editorViews = new Map<BlockId, PmEditorView | CmEditorView>();
// 反链和潜在链接面板中所有被展开的 display item 的 itemId
// 由于反链和潜在链接面板中默认都是折叠的，因此这里记录所有被展开的更合适
const expandedBP = ref<Record<DisplayItemId, boolean>>({});
let fixedOffset: number | null = null;

const updateDisplayItems = () => {
  // 计算 displayItems
  const blockTreeId = props.id;
  console.time(`calc displayItems ${blockTreeId}`);
  displayItems.value = generateDisplayItems({
    rootBlockIds: props.rootBlockIds,
    rootBlockLevel: props.rootBlockLevel,
    enlargeRootBlock: props.enlargeRootBlock,
    blocksManager,
    showBacklinks: props.showBacklinks ?? true,
    showPotentialLinks: props.showPotentialLinks ?? true,
    expandedBP: expandedBP.value,
    getBacklinksContext: () => backlinksContext,
    getIndexContext: () => indexContext,
    addSidePaneHeader: props.addSidePaneHeader,
  });
  console.timeEnd(`calc displayItems ${blockTreeId}`);

  // 更新 $vlist
  $vlist.value?.forceUpdate?.();

  nextTick(() => {
    // 如果设置了 fixedOffset，则使 $vlist 滚动到 fixedOffset
    if (fixedOffset != null) $vlist.value?.scrollToOffset(fixedOffset);

    // 触发 displayItemsUpdated 事件
    localEventBus.emit("displayItemsUpdated", [displayItems.value!]);
  });
};

watch(expandedBP, updateDisplayItems, { deep: true });
watch([() => props.rootBlockIds, changeRef], updateDisplayItems, {
  immediate: true,
});

const nextUpdate = (cb?: () => void | Promise<void>) => {
  return new Promise<void>((resolve) => {
    localEventBus.once("displayItemsUpdated", () => {
      cb && cb();
      resolve();
    });
  });
};

const getPredecessorDi = (
  itemId: DisplayItemId,
  filter?: (item: DisplayItem) => boolean,
): [DisplayItem, number] | null => {
  for (let i = 0; i < displayItems.value!.length; i++) {
    const item = displayItems.value![i];
    if (item.itemId === itemId) {
      for (let j = i - 1; j >= 0; j--) {
        const itemJ = displayItems.value![j];
        if (!filter || filter(itemJ)) return [itemJ, j];
      }
      return null;
    }
  }
  return null;
};

const getSuccessorDi = (
  itemId: DisplayItemId,
  filter?: (item: DisplayItem) => boolean,
): [DisplayItem, number] | null => {
  for (let i = 0; i < displayItems.value!.length; i++) {
    const item = displayItems.value![i];
    if (item.itemId === itemId) {
      for (let j = i + 1; j < displayItems.value!.length; j++) {
        const itemJ = displayItems.value![j];
        if (!filter || filter(itemJ)) return [itemJ, j];
      }
      return null;
    }
  }
  return null;
};

// 未引入多列布局，因此 getDiAbove 和 getPredecessorDi 的实现是一样的
const getDiAbove = (
  itemId: DisplayItemId,
  filter?: (item: DisplayItem) => boolean,
): [DisplayItem, number] | null => {
  return getPredecessorDi(itemId, filter);
};

// 未引入多列布局，因此 getDiBelow 和 getSuccessorDi 的实现是一样的
const getDiBelow = (
  itemId: DisplayItemId,
  filter?: (item: DisplayItem) => boolean,
): [DisplayItem, number] | null => {
  return getSuccessorDi(itemId, filter);
};

// 获得一个 DisplayItem 的 DOM 元素
const getDomOfDi = (itemId: string): HTMLElement | null => {
  return $blockTree.value?.querySelector(`[data-id="${itemId}"]`) ?? null;
};

const getEditorView = (itemId: DisplayItemId) => editorViews.get(itemId) ?? null;

const registerEditorView = (itemId: DisplayItemId, editorView: PmEditorView | CmEditorView) => {
  editorViews.set(itemId, editorView);
};

const unregisterEditorView = (itemId: DisplayItemId, editorView: PmEditorView | CmEditorView) => {
  const oldEditorView = editorViews.get(itemId);
  if (oldEditorView === editorView && !oldEditorView.dom.isConnected) {
    editorViews.delete(itemId);
  }
};

const scrollDiIntoView = (itemId: DisplayItemId): boolean => {
  const diDom = getDomOfDi(itemId);
  // 如果已经在视口内，则不滚动
  if (diDom && inViewport(diDom)) return true;
  // 滚动到该块
  const index = displayItems.value!.findIndex((item) => item.itemId == itemId);
  if (index != null && index >= 0) {
    const pos = $vlist.value?.getItemPosByIndex(index);
    if (pos) {
      const { top } = pos;
      $vlist.value?.scrollToOffset(top - 60); // 60 是 headerbar 的高度多一点
    }
  }
  return true;
};

const focusDi = async (itemId: DisplayItemId, options: DiFocusOptions = {}) => {
  let { scrollIntoView, highlight } = options;
  scrollIntoView ??= true;
  highlight ??= false;

  if (scrollIntoView) {
    const success = scrollDiIntoView(itemId);
    if (!success) return;
  }

  await timeout(50); // 等待渲染完成，50 是随便选择，也许有更好的方法？

  // 聚焦到文本或代码块
  const view = getEditorView(itemId);
  if (view) view.focus();

  const diEl = getDomOfDi(itemId)?.querySelector(".block-item");
  if (!diEl) return;

  // 点击公式块以聚焦到公式
  const mathContentEl = diEl.querySelector(".math-content");
  if (mathContentEl instanceof HTMLElement) {
    mathContentEl.click();
  }

  // 聚焦到图片块
  const cursorContainerEl = diEl.querySelector(".cursor-container");
  if (cursorContainerEl instanceof HTMLElement) {
    cursorContainerEl.focus();
  }

  if (highlight) {
    // 0-1000ms 高亮，1000-3000ms 淡化，3000ms 后移除高亮
    diEl.classList.add("highlight-keep");
    setTimeout(() => {
      diEl.classList.add("highlight-fade");
    }, 1000);
    setTimeout(() => {
      diEl.classList.remove("highlight-keep");
      diEl.classList.remove("highlight-fade");
    }, 3000);
  }
};

const focusBlock = async (blockId: BlockId, options: BlockFocusOptions = {}) => {
  let { scrollIntoView, highlight, expandIfFold } = options;
  scrollIntoView ??= true;
  highlight ??= false;
  expandIfFold ??= false;

  if (expandIfFold) {
    await blockEditor.locateBlock(blockId, controller);
  }

  await timeout(0);
  // TODO：只检查 basic-block 是否合适？
  const di = findDi((item) => item.type === "basic-block" && item.block.id === blockId);
  if (!di) return;
  await focusDi(di[0].itemId, { scrollIntoView, highlight });
};

const findDi = (
  filter: (item: DisplayItem, index: number) => boolean,
  dir: "forward" | "backward" = "forward",
) => {
  for (
    let i = dir === "forward" ? 0 : displayItems.value!.length - 1;
    i >= 0 && i < displayItems.value!.length;
    i += dir === "forward" ? 1 : -1
  ) {
    const item = displayItems.value![i];
    if (filter(item, i)) return [item, i] as const;
  }
  return null;
};

const moveCursorToTheEnd = (itemId: DisplayItemId) => {
  const editorView = getEditorView(itemId);
  if (editorView instanceof PmEditorView) {
    const tr = editorView.state.tr;
    const sel = AllSelection.atEnd(editorView.state.doc);
    tr.setSelection(sel);
    editorView.dispatch(tr);
  } else if (editorView instanceof CmEditorView) {
    const sel = editorView.state.doc.length;
    editorView.dispatch({
      selection: { anchor: sel },
    });
  }
};

const moveCursorToBegin = (itemId: DisplayItemId) => {
  const editorView = getEditorView(itemId);
  if (editorView instanceof PmEditorView) {
    const tr = editorView.state.tr;
    const sel = AllSelection.atStart(editorView.state.doc);
    tr.setSelection(sel);
    editorView.dispatch(tr);
  } else if (editorView instanceof CmEditorView) {
    editorView.dispatch({
      selection: { anchor: 0 },
    });
  }
};

const getDi = (itemId: DisplayItemId) => {
  return displayItems.value?.find((item) => item.itemId === itemId) ?? null;
};

const controller: BlockTree = {
  getProps: () => props,
  getId: () => props.id,
  getDom: () => $blockTree.value!,
  getRootBlockIds: () => props.rootBlockIds,
  getDisplayItems: () => displayItems.value!,
  getDi,
  findDi,

  localEventBus,
  expandedBP,
  nextUpdate,

  getEditorViews: () => editorViews,
  getEditorView,
  registerEditorView,
  unregisterEditorView,

  getSuccessorDi,
  getPredecessorDi,
  getDiAbove,
  getDiBelow,

  focusDi,
  focusBlock,
  getDomOfDi,

  moveCursorToTheEnd,
  moveCursorToBegin,
};
defineExpose(controller);

let pointerDownDi: DisplayItem | null = null;
let pointerDownTime: number | null = null;
// 现在是在移动块还是框选块
let movingBlocks = false;

// 获得当前 blockTree 的缩进宽度
let indentSize: { width: number; rightMargin: number } | null = null;
const getIndentSize = () => {
  if (!indentSize) {
    const indentEl = $blockTree.value?.querySelector(".indent-line");
    if (indentEl) {
      const indentRightMargin = parseFloat(window.getComputedStyle(indentEl).marginRight);
      indentSize = {
        width: indentEl.clientWidth,
        rightMargin: indentRightMargin,
      };
    }
  }
  return indentSize!;
};

const handlePointerUpOrLeave = (e: PointerEvent) => {
  try {
    if (movingBlocks) {
      const taskQueue = useTaskQueue();
      // 拖动结束，将选中的块移动到拖动结束的位置
      const draggingDropPos = dndCtx.draggingDropPos.value;
      if (!draggingDropPos) return;
      const { itemId, absLevel } = draggingDropPos;
      const di = getDi(itemId);
      if (!di || !DI_FILTERS.isBlockDi(di)) return;
      const selected = dndCtx.selectedBlockIds.value;
      if (!selected) return;
      const blockLevel = blocksManager.getBlockLevel(di.block.id);
      if (absLevel > blockLevel) {
        // 将 selected 插入到 block 的子级
        taskQueue.addTask(() => {
          const pos = blockEditor.normalizePos({
            parentId: di.block.id,
            childIndex: "first",
          });
          if (!pos) return;
          blockEditor.moveBlocks({
            blockIds: selected.topLevelOnly,
            pos,
          });
        });
      } else {
        // 将 selected 插入到 block 的下方（与 block 同级）
        taskQueue.addTask(() => {
          const pos = blockEditor.normalizePos({
            baseBlockId: di.block.id,
            offset: 1,
          });
          if (!pos) return;
          blockEditor.moveBlocks({
            blockIds: selected.topLevelOnly,
            pos,
          });
        });
      }
    }
  } finally {
    pointerDownDi = null;
    pointerDownTime = null;
    movingBlocks = false;
    dndCtx.dragging.value = false;
    dndCtx.draggingDropPos.value = null;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUpOrLeave);
    document.removeEventListener("pointerleave", handlePointerUpOrLeave);
  }
};

const clearDraggingDropPos = () => {
  dndCtx.draggingDropPos.value = null;
};

const handlePointerMove = useThrottleFn((e: PointerEvent) => {
  // 如果按下时间小于 200ms，则认为是点击
  const duration = Date.now().valueOf() - (pointerDownTime ?? 0);
  if (duration < 200) return;

  dndCtx.dragging.value = true;
  e.preventDefault();
  e.stopPropagation();

  // 1. 拖动
  if (movingBlocks) {
    // 如果是在拖动块，并且目前没有选中任何块
    // 则将光标按下时的块加入选中
    if (!dndCtx.selectedBlockIds.value || dndCtx.selectedBlockIds.value.topLevelOnly.length === 0) {
      if (!pointerDownDi || !DI_FILTERS.isBlockDi(pointerDownDi)) return; // IMPOSSIBLE
      const newSelected = {
        baseBlockId: pointerDownDi.block.id,
        topLevelOnly: [pointerDownDi.block.id],
        allNonFolded: [] as BlockId[],
      };
      blocksManager.forDescendants({
        rootBlockId: pointerDownDi.block.id,
        rootBlockLevel: 0,
        nonFoldOnly: true,
        includeSelf: true,
        onEachBlock: (b) => {
          newSelected.allNonFolded.push(b.id);
        },
      });
      dndCtx.selectedBlockIds.value = newSelected;
    }

    const hoveredBlockItem = getHoveredElementWithClass(e.target, "block-item");

    const hoveredItemId = hoveredBlockItem?.dataset["itemId"];
    // 指针悬停的块的缩进层级，相对于 rootBlockLevel
    const hoveredBlockLevel = parseInt(hoveredBlockItem?.dataset["blockLevel"]!);
    if (!hoveredItemId) return clearDraggingDropPos();

    // 禁止自己拖动到自己上
    if (hoveredBlockItem.classList.contains("selected")) return clearDraggingDropPos();

    // 指针悬停处的缩进层级，相对 rootBlockLevel，不一定等于 hoveredBlockLevel！
    const { width, rightMargin } = getIndentSize();
    const pointerLevel = Math.floor((e.x + rightMargin) / (width + rightMargin));

    // 判断是希望插到悬停的块上方还是下方
    const rect = hoveredBlockItem.getBoundingClientRect();
    const upperHalf = e.y < rect.y + rect.height / 2; // 光标悬停在块的上半部分还是下半部分
    if (upperHalf) {
      const diAbove = getDiAbove(hoveredItemId, DI_FILTERS.isBlockDi);
      if (!diAbove || !DI_FILTERS.isBlockDi(diAbove[0])) return clearDraggingDropPos();
      const domAbove = getDomOfDi(diAbove[0].itemId)?.querySelector(".block-item");
      if (!(domAbove instanceof HTMLElement)) return clearDraggingDropPos();
      const levelAbove = parseInt(domAbove.dataset["blockLevel"]!);
      // 禁止将自己拖动到自己上
      const aboveFold = domAbove.classList.contains("fold");
      const aboveHasChild = domAbove.classList.contains("hasChildren");

      // 如果 pred 折叠了，并且有孩子，则不允许拖成 pred 的子级
      const clipFrom = aboveFold && aboveHasChild ? levelAbove : levelAbove + 1;
      const clipTo = hoveredBlockLevel;
      const clippedLevel = clip(pointerLevel, clipFrom, clipTo);

      dndCtx.draggingDropPos.value = {
        itemId: diAbove[0].itemId,
        relIndent: clippedLevel * (width + rightMargin) + width,
        absLevel: clippedLevel + props.rootBlockLevel, // 加上 rootBlockLevel 才是绝对层级
      };
    } else {
      let clippedLevel;
      const diBelow = getDiBelow(hoveredItemId, DI_FILTERS.isBlockDi);
      const hoveredFold = hoveredBlockItem.classList.contains("fold");
      const hoveredHasChild = hoveredBlockItem.classList.contains("hasChildren");
      if (!diBelow) {
        const clipFrom = hoveredFold && hoveredHasChild ? hoveredBlockLevel : hoveredBlockLevel + 1;
        const clipTo = 1;
        clippedLevel = clip(pointerLevel, clipFrom, clipTo);
      } else {
        if (!DI_FILTERS.isBlockDi(diBelow[0])) return clearDraggingDropPos();
        const domBelow = getDomOfDi(diBelow[0].itemId)?.querySelector(".block-item");
        if (!(domBelow instanceof HTMLElement)) return clearDraggingDropPos();
        const belowLevel = parseInt(domBelow.dataset["blockLevel"]!);
        const clipFrom = hoveredFold && hoveredHasChild ? hoveredBlockLevel : hoveredBlockLevel + 1;
        const clipTo = belowLevel;
        clippedLevel = clip(pointerLevel, clipFrom, clipTo);
        console.log(
          `pointerLevel: ${pointerLevel}, clipFrom: ${clipFrom}, clipTo: ${clipTo}, clippedLevel: ${clippedLevel}`,
        );
      }
      dndCtx.draggingDropPos.value = {
        itemId: hoveredItemId,
        relIndent: clippedLevel * (width + rightMargin) + width,
        absLevel: clippedLevel + props.rootBlockLevel, // 加上 rootBlockLevel 才是绝对层级
      };
    }
  }
  // 2. 框选
  else {
    const hoveredBlockItem = getHoveredElementWithClass(e.target, "block-item");
    const currItemId = hoveredBlockItem?.dataset["itemId"];
    const currDi = currItemId ? getDi(currItemId) : null;
    if (
      !currItemId ||
      !currDi ||
      !DI_FILTERS.isBlockDi(currDi) ||
      pointerDownDi == null ||
      !DI_FILTERS.isBlockDi(pointerDownDi)
    )
      return;
    // 如果点击的是同一个块，则取消选中，并聚焦到这个块，以框选其中的文字
    if (pointerDownDi.itemId === currItemId) {
      dndCtx.selectedBlockIds.value = null;
      focusDi(currItemId, { scrollIntoView: false });
      return;
    }
    // 框选区域：blockIdStart 到 blockIdCurrent
    (document.activeElement as HTMLElement)?.blur(); // 先让当前聚焦的块失焦
    dndCtx.selectedBlockIds.value = null;
    // 计算选中的块
    const startBlockPath = blocksManager.getBlockPath(pointerDownDi.block.id).map((b) => b.id);
    const currBlockPath = blocksManager.getBlockPath(currDi.block.id).map((b) => b.id);
    let commonParentI = -1,
      commonParentJ = -1;
    for (let i = 0; i < startBlockPath.length; i++) {
      const indexJ = currBlockPath.indexOf(startBlockPath[i]);
      if (indexJ != -1) {
        commonParentI = i;
        commonParentJ = indexJ;
        break;
      }
    }
    if (commonParentI !== -1 && commonParentJ !== -1) {
      if (commonParentI === 0 || commonParentJ === 0) {
        const commonParentId = startBlockPath[commonParentI];
        const newSelected = {
          baseBlockId: pointerDownDi.block.id,
          topLevelOnly: [commonParentId],
          allNonFolded: [] as BlockId[],
        };
        blocksManager.forDescendants({
          rootBlockId: commonParentId,
          rootBlockLevel: 0,
          nonFoldOnly: true,
          includeSelf: true,
          onEachBlock: (b) => {
            newSelected.allNonFolded.push(b.id);
          },
        });
        dndCtx.selectedBlockIds.value = newSelected;
      } else {
        const commonParentId = startBlockPath[commonParentI];
        const commonParentBlock = blocksManager.getBlock(commonParentId);
        if (!commonParentBlock) return;
        const childFrom = startBlockPath[commonParentI - 1];
        const childTo = currBlockPath[commonParentJ - 1];
        const childFromIndex = commonParentBlock.childrenIds.indexOf(childFrom);
        const childToIndex = commonParentBlock.childrenIds.indexOf(childTo);
        const from = Math.min(childFromIndex, childToIndex);
        const to = Math.max(childFromIndex, childToIndex);
        const newSelected = {
          baseBlockId: pointerDownDi.block.id,
          topLevelOnly: commonParentBlock.childrenIds.slice(from, to + 1),
          allNonFolded: [] as BlockId[],
        };
        for (let i = from; i <= to; i++) {
          const childId = commonParentBlock.childrenIds[i];
          blocksManager.forDescendants({
            rootBlockId: childId,
            rootBlockLevel: 0,
            nonFoldOnly: true,
            includeSelf: true,
            onEachBlock: (b) => {
              newSelected.allNonFolded.push(b.id);
            },
          });
        }
        dndCtx.selectedBlockIds.value = newSelected;
      }
    }
  }
}, 100);

const handlePointerDown = (e: PointerEvent) => {
  // 如果是鼠标事件，仅处理左键
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const hoveredBlockItem = getHoveredElementWithClass(e.target, "block-item");
  if (!hoveredBlockItem) return;
  const diId = hoveredBlockItem.dataset["itemId"];
  const di = diId ? getDi(diId) : null;
  // 仅处理普通块
  // 反链和潜在链接面板中的块都不允许拖拽
  if (!diId || !di || di.type !== "basic-block") return;
  pointerDownDi = di;
  pointerDownTime = Date.now().valueOf();
  dndCtx.dragging.value = false;
  // 如果按下的是块的 bullet，则认为是拖动，否则认为是框选
  const hoveredBullet = getHoveredElementWithClass(e.target, "bullet");
  if (hoveredBullet) movingBlocks = true;

  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUpOrLeave);
  document.addEventListener("pointerleave", handlePointerUpOrLeave);
};

onMounted(() => {
  const el = $blockTree.value;
  if (el) Object.assign(el, { controller });
  blockTreeContext.registerBlockTree(controller);
});

onUnmounted(() => {
  blockTreeContext.unregisterBlockTree(props.id);
});
</script>

<style lang="scss">
.block-tree {
  position: relative;

  // 用 footer 遮挡掉不想看到的缩进线
  .vlist {
    [data-id="footer"] {
      flex-grow: 1;
      flex-shrink: 0;
      min-height: var(--padding-bottom);
      background-color: var(--bg-color-primary);
      position: relative;
      z-index: 99;
    }

    [data-id="header"] {
      min-height: var(--padding-top);
    }
  }

  .block-item.fold-disappear {
    opacity: 0;
    transition: opacity 1000ms ease-in-out;
  }

  .block-container {
    z-index: 1;
    position: relative;
  }

  .bg {
    position: absolute;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    top: 0;
    padding: inherit;
    padding-left: 26px;

    .indent-line {
      height: 100%;
      padding-right: calc(36px - 1px); // - border-right
      border-left: var(--border-indent);
    }
  }
}

// 高亮
.block-item.highlight-keep .block-content,
.block-item.highlight-keep .bullet {
  background-color: var(--highlight-block-bg);
}

.block-item.highlight-fade .block-content,
.block-item.highlight-fade .bullet {
  background-color: unset !important;
  transition: all 300ms ease-out;
}

.suggestion-item .highlight-keep {
  background-color: var(--highlight-text-bg);
}

.suggestion-item .highlight-fade {
  background-color: unset !important;
  transition: all 300ms ease-out;
}

span.cloze.highlight-keep {
  background-color: var(--cloze-highlight-color);
  box-shadow: var(--cloze-highlight-color) 0 0 10px 2px;
}

span.cloze.highlight-fade {
  background-color: unset !important;
  box-shadow: unset !important;
  transition: all 300ms ease-out;
}
</style>
