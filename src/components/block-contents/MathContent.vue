<template>
  <div
    v-if="block.content[0] === BLOCK_CONTENT_TYPES.MATH"
    class="math-content block-content overflow-x-auto [&.empty]:italic [&.empty]:text-muted-foreground [&.empty]:!w-fit"
    ref="$contentEl"
    @click="showMathEditor"
  ></div>
</template>

<script setup lang="ts">
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import BlocksContext from "@/context/blocks/blocks";
import type { MathBlock } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import FloatingMathInputContext from "@/context/floatingMathInput";
import { useTaskQueue } from "@/plugins/taskQueue";
import type { DisplayItemId } from "@/utils/display-item";
import katex, { type KatexOptions } from "katex";
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
  blockTree?: BlockTree;
  block: MathBlock;
  readonly?: boolean;
  itemId?: DisplayItemId;
}>();

const taskQueue = useTaskQueue();
const { blockEditor } = BlocksContext.useContext()!;
const floatingMathInputContext = FloatingMathInputContext.useContext()!;
const $contentEl = ref<HTMLElement | null>(null);
let currSrc = ""; // 当前的 src

const KATEX_RENDER_OPTION: KatexOptions = {
  displayMode: true,
  throwOnError: false,
};

const renderEquation = () => {
  const katexContainer = $contentEl.value;
  if (!katexContainer) return;
  if (currSrc.trim().length > 0) {
    katex.render(currSrc, katexContainer, KATEX_RENDER_OPTION);
    katexContainer.classList.remove("empty");
  } else {
    // 空公式
    katexContainer.textContent = "EMPTY EQUATION";
    katexContainer.classList.add("empty");
  }
};

const showMathEditor = () => {
  const content = props.block.content;
  const katexContainer = $contentEl.value;
  if (!katexContainer || content[0] !== BLOCK_CONTENT_TYPES.MATH) return; // IMPOSSIBLE

  floatingMathInputContext.openFloatingMathInput(
    katexContainer,
    content[1],
    (newSrc: string) => {
      currSrc = newSrc;
      syncToState();
    },
    skipLeft,
    skipRight,
    skipRight,
    deleteThis,
  );
};

const skipLeft = () => {
  const tree = props.blockTree;
  if (!tree) return;
  const diAbove = tree.getDiAbove(props.itemId!);
  diAbove && tree.focusDi(diAbove[0].itemId, { scrollIntoView: true });
};

const skipRight = () => {
  const tree = props.blockTree;
  if (!tree) return;
  const diBelow = tree.getDiBelow(props.itemId!);
  diBelow && tree.focusDi(diBelow[0].itemId, { scrollIntoView: true });
};

const deleteThis = () => {
  taskQueue.addTask(() => {
    blockEditor.deleteBlock({ blockId: props.block.id });
  });
};

// 将当前的 src 同步到 state 中
const syncToState = () => {
  taskQueue.addTask(() => {
    blockEditor.changeBlockContent({
      blockId: props.block.id,
      content: [BLOCK_CONTENT_TYPES.MATH, currSrc],
    });
  });
};

// 监听 block 的 content 变化，更新当前的 src
watch(
  () => props.block.content,
  (newContent) => {
    if (newContent[0] !== BLOCK_CONTENT_TYPES.MATH) return;
    currSrc = newContent[1];
    nextTick(() => {
      renderEquation();
    });
  },
  {
    immediate: true,
  },
);
</script>

<style lang="scss">
.math-content {
  .katex-display {
    margin: 0.3em 0; // 取消上下边距
  }

  .katex {
    font-size: 1em;
  }

  &.empty {
    text-align: center;
  }
}
</style>
