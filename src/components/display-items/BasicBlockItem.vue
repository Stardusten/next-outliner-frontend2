<template>
  <div
    class="block-item"
    :data-item-type="itemType"
    :data-block-id="block.id"
    :data-item-id="itemId"
    :data-block-level="level"
    :data-block-ref-color="block.metadata?.blockRefColor"
    :class="{ hasChildren, fold, selected, [itemType]: true }"
    @focusin="handleFocusIn"
  >
    <div class="indent-lines">
      <div class="indent-line" v-for="i in level" :key="i" :data-level="i"></div>
    </div>
    <div class="relative block-content-container">
      <div class="fold-button" v-if="!hideFoldButton" @click.stop="handleClickFoldButton">
        <Triangle></Triangle>
      </div>

      <div
        class="bullet shrink-0"
        v-if="!hideBullet"
        @click.stop="handleClickBullet"
        @contextmenu="handleContextmenu"
      >
        <Diamond class="diamond" v-if="hasOrIsMirrors" />
        <Circle class="circle" v-else />
      </div>

      <BlockContent
        :block="block"
        :item-id="itemId"
        :block-tree="blockTree"
        :readonly="readonly"
        :highlight-terms="highlightTerms"
        :highlight-refs="highlightRefs"
      ></BlockContent>

      <BacklinksCounter :block-id="block.id" />
    </div>

    <!-- 拖拽时，显示拖拽指示线 -->
    <div
      v-if="draggingDropPos?.itemId === itemId"
      class="absolute bottom-[-2px] left-0 h-[2px] rounded w-[40%] bg-blue-500"
      :style="{ marginLeft: draggingDropPos.relIndent + 'px' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import BlocksContext from "@/context/blocks/blocks";
import BlockSelectDragContext from "@/context/blockSelect";
import type { BlockTree } from "@/context/blockTree";
import LastFocusContext from "@/context/lastFocus";
import MainTreeContext from "@/context/mainTree";
import { useTaskQueue } from "@/plugins/taskQueue";
import { Circle, Diamond, Triangle } from "lucide-vue-next";
import { computed } from "vue";

import IndexContext from "@/context";
import BlockContextMenuContext from "@/context/blockContextMenu";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import KeymapContext from "@/context/keymap";
import SidebarContext from "@/context/sidebar";
import type { DisplayItem, DisplayItemId } from "@/utils/display-item";
import BacklinksCounter from "../backlinks-counter/BacklinksCounter.vue";
import BlockContent from "../block-contents/BlockContent.vue";

const props = withDefaults(
  defineProps<{
    blockTree?: BlockTree;
    block: Block;
    level: number;
    hideFoldButton?: boolean;
    hideContextMenu?: boolean;
    hideBullet?: boolean;
    readonly?: boolean;
    highlightTerms?: string[];
    highlightRefs?: BlockId[];
    itemType?: DisplayItem["type"];
    itemId?: DisplayItemId;
    fold?: boolean;
    handleClickFoldButton?: () => void;
  }>(),
  {
    blockTree: undefined,
    hideFoldButton: false,
    hideContextMenu: false,
    hideBullet: false,
    readonly: false,
    highlightTerms: () => [],
    highlightRefs: () => [],
    itemType: "basic-block",
    itemId: undefined,
    fold: undefined,
    handleClickFoldButton: undefined,
  },
);

const taskQueue = useTaskQueue();
const { blockEditor } = BlocksContext.useContext()!;
const { lastFocusedDiId, lastFocusedBlockTree } = LastFocusContext.useContext()!;
const { mainRootBlockId } = MainTreeContext.useContext()!;
const { selectedBlockIds, draggingDropPos, dragging } = BlockSelectDragContext.useContext()!;
const { getMirrors } = IndexContext.useContext()!;
const { openAt } = BlockContextMenuContext.useContext()!;
const { ctrlPressed, shiftPressed } = KeymapContext.useContext()!;
const { addToSidePane } = SidebarContext.useContext()!;

// computed
const mirrorIds = computed(() => getMirrors(props.block.id));
const hasOrIsMirrors = computed(
  () => mirrorIds.value.size > 0 || props.block.type === "mirrorBlock",
);
const fold = computed(() => props.fold ?? props.block.fold);
const hasChildren = computed(() => props.block.childrenIds.length > 0);
const selected = computed(() => selectedBlockIds.value?.allNonFolded.includes(props.block.id));

// handlers
const handleFocusIn = () => {
  lastFocusedDiId.value = props.itemId ?? null;
  lastFocusedBlockTree.value = props.blockTree ?? null;
  console.log("set lastFocusedBlockTree", props.blockTree);
  // 一个块获得焦点时，清除块选择
  // 但是当拖拽时，不清除块选择
  if (!dragging.value) {
    selectedBlockIds.value = null;
  }
};

const handleClickFoldButton = () => {
  if (props.handleClickFoldButton) {
    props.handleClickFoldButton();
    return;
  } else {
    const blockId = props.block.id;
    taskQueue.addTask(() => blockEditor.toggleFold(blockId));
  }
};

const handleClickBullet = (e: MouseEvent) => {
  if (e.button !== 0) return; // 仅处理左键
  if (shiftPressed.value) {
    addToSidePane(props.block.id);
  } else if (ctrlPressed.value) {
    // TODO
  } else {
    mainRootBlockId.value = props.block.id;
  }
};

const handleContextmenu = (e: MouseEvent) => {
  if (e.button !== 2) return; // 仅处理右键
  e.preventDefault();
  openAt({ x: e.clientX, y: e.clientY }, props.block.id);
};
</script>

<style lang="scss">
.block-item {
  position: relative;
  display: flex;

  &.selected {
    .block-content,
    .bullet {
      background-color: hsl(var(--muted));
    }
  }

  .indent-lines {
    display: flex;

    .indent-line {
      width: calc(var(--block-indent-width) - var(--block-indent-adjust));
      height: 100%;
      border-right: var(--border-indent);
      margin-right: var(--block-indent-adjust);
      border-right: 1px solid var(--indent-line-color);
    }
  }

  .bullet {
    height: calc(var(--editor-line-height) + var(--content-padding));
    min-width: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-right: 6px;
    cursor: grab;
    background-color: var(--bg-color-primary);

    .no {
      float: right;
      width: fit-content;
      margin-right: 2px;
    }

    svg {
      height: var(--bullet-size);
      width: var(--bullet-size);
      stroke: none;
      fill: var(--bullet-color);
      padding: 4px;

      &.diamond {
        width: 15px;
        height: 15px;
      }
    }

    // 如果一个折叠的块
    // 1. 有孩子
    // 2. 有反链
    // 3. 有元数据
    // 总之就是可以展开，则 bullet 外面加一圈浅色
    @at-root .block-item.fold.hasChildren .bullet svg,
      .block-item.fold.hasBacklink .bullet svg,
      .block-item.fold.hasMetadata .bullet svg {
      background-color: var(--bullet-background);
      border-radius: 8px;
    }
  }

  .block-content-container {
    display: flex;
    flex-grow: 1;
    padding-left: 18px;

    .fold-button {
      position: absolute;
      left: 0;
      height: calc(var(--editor-line-height) + var(--content-padding));
      width: 18px;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      display: none; // 默认隐藏 fold button

      // 如果：
      // 1. 这个 block 有 children，且 hover
      // 2. 这个 block 有 backlink，且 hover
      // 3. 这个 block 有编号
      // 4. 这个 block 有 metadata，且 hover
      // 则显示 fold button
      @at-root .block-item.hasChildren:hover > .block-content-container > .fold-button,
        .block-item.hasBacklink:hover > .block-content-container > .fold-button,
        .block-item.hasChildren.no > .block-content-container > .fold-button,
        .block-item.hasMetadata:hover > .block-content-container > .fold-button {
        display: flex;
      }

      svg {
        height: var(--fold-button-size);
        width: var(--fold-button-size);
        stroke: none;
        fill: var(--block-button-color);
        transform: rotate(180deg);
        padding: 4px;
      }

      // 如果这个 block 是 folded 的，则将 fold button 旋转 90 度
      @at-root .block-item.fold > .block-content-container > .fold-button svg {
        transform: rotate(90deg);
      }
    }
  }

  .block-content {
    flex-grow: 1;
    width: min-content;
    background-color: var(--bg-color-primary);
  }

  .unsupported-block-content {
    background-color: var(--bg-color-primary);
    flex-grow: 1;
    color: red;
  }

  & > .block-content-container > .block-content:has(.tag[data-ctext~="later"]),
  & > .block-content-container > .block-content:has(.tag[data-ctext~="abort"]) {
    color: hsl(var(--muted-foreground));
  }

  & > .block-content-container > .block-content:has(.tag[data-ctext~="done"]) {
    color: hsl(var(--muted-foreground));
    text-decoration-line: line-through;
    text-decoration-thickness: 1px;
  }

  ///// 标签颜色
  .tag[data-ctext~="today"] {
    background-color: var(--highlight-3);
    color: var(--text-primary-color);
  }

  .tag[data-ctext~="later"] {
    background-color: var(--highlight-1);
    color: var(--text-primary-color);
  }

  .tag[data-ctext~="done"] {
    background-color: var(--highlight-2);
    color: var(--text-primary-color);
  }

  .tag[data-ctext~="ongoing"] {
    background-color: var(--highlight-4);
    color: var(--text-primary-color);
  }

  .block-ref-v2[data-block-ref-color="blue"] {
    background-color: var(--highlight-blue);
  }

  .block-ref-v2[data-block-ref-color="green"] {
    background-color: var(--highlight-green);
  }

  .block-ref-v2[data-block-ref-color="red"] {
    background-color: var(--highlight-red);
  }

  .block-ref-v2[data-block-ref-color="yellow"] {
    background-color: var(--highlight-yellow);
  }

  .block-ref-v2[data-block-ref-color="gray"] {
    background-color: var(--highlight-gray);
  }

  .block-ref-v2[data-block-ref-color="orange"] {
    background-color: var(--highlight-orange);
  }

  .block-ref-v2[data-block-ref-color="purple"] {
    background-color: var(--highlight-purple);
  }

  &.paragraph {
    .block-content {
      padding-top: 0.2em;
      padding-bottom: 0.2em;
    }

    .bullet {
      opacity: 0;
    }
  }
}

.drop-area {
  background-color: var(--drop-area-bg);
  height: 2px;
  margin: 1px 4px 1px;
  border-radius: 4px;
}
</style>
