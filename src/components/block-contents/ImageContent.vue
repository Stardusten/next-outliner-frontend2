<template>
  <div
    class="block-content image-content relative"
    :data-showDropdown="showDropdown"
    :data-path="block.content[1]"
    v-if="block.content[0] === BLOCK_CONTENT_TYPES.IMAGE && image"
  >
    <div v-if="image.status === 'fetching'" class="flex items-center text-muted-foreground">
      <Loader2 class="size-4 mr-2 animate-spin" />
      {{ $t("kbView.imageContent.fetchingImage") }}
    </div>
    <div
      v-else-if="image.status === 'synced'"
      class="image-container flex select-none my-2 shrink-0"
      :class="{
        imageBlend: props.block.content[5]?.includes('blend'),
        imageBlendLuminosity: props.block.content[5]?.includes('blendLuminosity'),
        imageCircle: props.block.content[5]?.includes('circle'),
        imageInvert: props.block.content[5]?.includes('invert'),
        imageInvertW: props.block.content[5]?.includes('invertW'),
        imageOutline: props.block.content[5]?.includes('outline'),
      }"
      ref="imageElContainerRef"
    >
      <div class="image-fit-container relative w-fit bg-background">
        <img
          ref="imageElRef"
          class="rounded"
          :style="{
            width: block.content[4] ? block.content[4] + 'px' : 'unset',
          }"
          :src="image.url"
        />

        <!-- 拖曳调整宽度 -->
        <div
          class="absolute right-[2px] top-1/2 -translate-y-1/2 h-full max-h-[40px] rounded w-1 bg-muted cursor-col-resize"
          @mousedown="handleMouseDown"
        ></div>

        <!-- 图片操作 -->
        <DropdownMenu v-model:open="showDropdown" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon" class="image-actions absolute top-2 right-2">
              <MoreVertical class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-52 mx-4">
            <DropdownMenuItem>
              <MessageSquareMore class="size-4 mr-2" />
              {{ $t("kbView.imageContent.addCaption") }}
            </DropdownMenuItem>

            <!-- 下载图片 -->
            <DropdownMenuItem>
              <Download class="size-4 mr-2" />
              {{ $t("kbView.imageContent.download") }}
            </DropdownMenuItem>
            <!-- 详细信息 -->
            <DropdownMenuItem>
              <Info class="size-4 mr-2" />
              {{ $t("kbView.imageContent.metadata") }}
            </DropdownMenuItem>
            <!-- 清除扫描图片的背景 -->
            <DropdownMenuItem @click="handleClearScannedImage">
              <FileScan class="size-4 mr-2" />
              {{ $t("kbView.imageContent.clearScannedImage") }}
            </DropdownMenuItem>
            <!-- 滤镜 -->
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Blend class="size-4 mr-2" />
                {{ $t("kbView.imageContent.filter") }}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    :class="{
                      active: isFilterActive('invert'),
                    }"
                    @click="toggleFilter('invert')"
                  >
                    {{ $t("kbView.imageContent.invert") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    :class="{
                      active: isFilterActive('invertW'),
                    }"
                    @click="toggleFilter('invertW')"
                  >
                    {{ $t("kbView.imageContent.invertW") }}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <!-- 删除图片 -->
            <DropdownMenuItem class="!text-red-500" @click="handleDeleteImage">
              <Trash2 class="size-4 mr-2" />
              {{ $t("kbView.imageContent.deleteImage") }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- 一个可以容纳光标的容器，聚焦到图片时，光标会进入该容器 -->
      <!-- 在这个容器中按删除键，会删除图片 -->
      <!-- 按 Enter 等其他键也会有相应行为 -->
      <!-- 但是这个容器中不能输入文字！！ -->
      <div
        class="cursor-container flex-grow !outline-none min-w-1"
        contenteditable
        @keydown="handleKeydownOnCursorContainer"
        @compositionstart="preventCompositionInput"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fsClearScannedImage } from "@/common/api-call/fs";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { ImageContent } from "@/common/type-and-schemas/block/block-content";
import { Button } from "@/components/ui/button";
import BlocksContext from "@/context/blocks/blocks";
import type { BlockPos } from "@/context/blocks/view-layer/blocksEditor";
import type { ImageBlock } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import ImagesContext from "@/context/images";
import { generateKeydownHandlerSimple } from "@/context/keymap";
import { useTaskQueue } from "@/plugins/taskQueue";
import type { DisplayItemId } from "@/utils/display-item";
import { plainTextToTextContent } from "@/utils/pm";
import {
  Blend,
  Download,
  FileScan,
  Info,
  Loader2,
  MessageSquareMore,
  MoreVertical,
  Trash2,
} from "lucide-vue-next";
import { ref } from "vue";
import { getPmSchema } from "../prosemirror/pmSchema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const props = defineProps<{
  blockTree?: BlockTree;
  block: ImageBlock;
  itemId?: DisplayItemId;
}>();

const { useImage } = ImagesContext.useContext()!;
const imageElRef = ref<HTMLImageElement | null>(null);
const imageElContainerRef = ref<HTMLDivElement | null>(null);
const taskQueue = useTaskQueue();
const { blockEditor, blocksManager } = BlocksContext.useContext()!;
let imageLeft = 0; // 拖曳开始时，记录图片左侧的位置，用于计算宽度

const handleKeydownOnCursorContainer = generateKeydownHandlerSimple({
  // 按删除键时删除图片
  Backspace: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      taskQueue.addTask(() => {
        blockEditor.deleteBlock({ blockId: props.block.id });
      });
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  // 按 Enter 时在下方插入一个空段落
  Enter: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      const itemId = props.itemId;
      const tree = props.blockTree;
      if (!itemId || !tree) return false;
      taskQueue.addTask(async () => {
        const pos: BlockPos = {
          baseBlockId: props.block.id,
          offset: 1,
        };
        const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
        blockEditor.insertNormalBlock({ pos, content: plainTextToTextContent("", schema) });
        const diBelow = tree.getDiBelow(itemId);
        await tree.nextUpdate();
        diBelow && tree.focusDi(diBelow[0].itemId);
      });
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  ArrowDown: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      const tree = props.blockTree;
      if (!tree) return false;
      const diBelow = tree.getDiBelow(props.itemId!);
      diBelow && tree.focusDi(diBelow[0].itemId);
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  ArrowUp: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      const tree = props.blockTree;
      if (!tree) return false;
      const diAbove = tree.getDiAbove(props.itemId!);
      diAbove && tree.focusDi(diAbove[0].itemId);
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  ArrowLeft: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      const tree = props.blockTree;
      if (!tree) return false;
      const diBefore = tree.getPredecessorDi(props.itemId!);
      diBefore && tree.focusDi(diBefore[0].itemId);
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  ArrowRight: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      const tree = props.blockTree;
      if (!tree) return false;
      const diAfter = tree.getSuccessorDi(props.itemId!);
      diAfter && tree.focusDi(diAfter[0].itemId);
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  // 禁止其他所有按键
  "*": {
    run: () => true,
    stopPropagation: true,
    preventDefault: true,
  },
  Tab: {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      taskQueue.addTask(() => {
        blockEditor.promoteBlock({ blockId: props.block.id });
      });
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
  "Shift-Tab": {
    run: (e) => {
      if (e.isComposing || e.keyCode === 229) return false;
      taskQueue.addTask(() => {
        blockEditor.demoteBlock({ blockId: props.block.id });
      });
      return true;
    },
    stopPropagation: true,
    preventDefault: true,
  },
});

const preventCompositionInput = (e: CompositionEvent) => {
  const inputEl = e.target as HTMLElement;
  inputEl.blur();
  inputEl.contentEditable = "false";
  inputEl.innerHTML = "";
  setTimeout(() => {
    inputEl.contentEditable = "true";
    inputEl.focus();
  }, 0);
};

const image = useImage(() => props.block.content[1]);

const showDropdown = ref(false);

const toggleFilter = (
  filter: "blend" | "circle" | "invert" | "invertW" | "outline" | "blendLuminosity",
) => {
  taskQueue.addTask(() => {
    const blockId = props.block.id;
    const newContent = [...props.block.content] as ImageContent;
    const newFilters = newContent[5] ?? [];
    if (newFilters.includes(filter)) {
      newFilters.splice(newFilters.indexOf(filter), 1);
    } else {
      newFilters.push(filter);
    }
    newContent[5] = newFilters;
    blockEditor.changeBlockContent({ blockId, content: newContent });
  });
};

const isFilterActive = (
  filter: "blend" | "circle" | "invert" | "invertW" | "outline" | "blendLuminosity",
) => {
  const filters = props.block.content[5] ?? [];
  return filters.includes(filter);
};

const handleDeleteImage = () => {
  taskQueue.addTask(() => {
    blockEditor.deleteBlock({ blockId: props.block.id });
  });
};

const handleMouseMove = (e: MouseEvent) => {
  const newWidth = e.clientX - imageLeft + 3;
  // 更新图片宽度
  // 注意，此时直接修改 img 的 width，而不是修改 blockContent
  // 等拖曳完成后，再修改 blockContent
  const imageEl = imageElRef.value;
  if (!imageEl) return;
  imageEl.style.width = Math.min(imageEl.naturalWidth, newWidth) + "px";
};

const handleMouseUpOrLeave = () => {
  // 拖曳结束
  const imageEl = imageElRef.value;
  if (!imageEl) return;
  const newWidth = imageEl.clientWidth;
  taskQueue.addTask(() => {
    const blockId = props.block.id;
    const newContent = [...props.block.content] as ImageContent;
    newContent[4] = newWidth;
    blockEditor.changeBlockContent({ blockId, content: newContent });
  });

  // 恢复全局 cursor 样式
  document.getElementById("cursor-style")?.remove();

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUpOrLeave);
  document.removeEventListener("mouseleave", handleMouseUpOrLeave);
};

const handleMouseDown = (e: MouseEvent) => {
  // 记录图片左侧的位置，用于计算宽度
  const imageEl = imageElRef.value;
  const rect = imageEl?.getBoundingClientRect();
  if (!rect) return;
  imageLeft = rect.left;

  // 修改全局 cursor 样式
  // 参考：https://stackoverflow.com/questions/10750582/global-override-of-mouse-cursor-with-javascript
  const cursorStyle = document.createElement("style");
  cursorStyle.innerHTML = "*{cursor: col-resize!important;}";
  cursorStyle.id = "cursor-style";
  document.head.appendChild(cursorStyle);

  e.preventDefault();
  e.stopPropagation();
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUpOrLeave);
  document.addEventListener("mouseleave", handleMouseUpOrLeave);
};

const handleClearScannedImage = async () => {
  const content = props.block.content;
  if (content[0] !== BLOCK_CONTENT_TYPES.IMAGE) return;
  const resp = await fsClearScannedImage({ path: content[1] });
  if (!resp.success) return;
  taskQueue.addTask(() => {
    const newContent = [...content] as ImageContent;
    newContent[1] = resp.data.path;
    blockEditor.changeBlockContent({ blockId: props.block.id, content: newContent });
  });
};
</script>

<style lang="scss">
// hover 在图片上，或者 dropdown 打开时，显示按钮
.block-content {
  .image-actions {
    opacity: 0;
    transition: opacity 200ms var(--tf);
  }

  .image-fit-container:hover .image-actions {
    opacity: 1;
  }

  &[data-showDropdown="true"] .image-actions {
    opacity: 1;
  }
}

// Filters
.block-content .imageBlend img {
  mix-blend-mode: screen;
}

.dark .block-content .imageBlendLuminosity img {
  filter: grayscale(1) contrast(1.5);
}

.light .block-content .imageBlendLuminosity img {
  filter: grayscale(1) contrast(1.5) invert(1);
}

.dark .block-content .imageInvert img {
  filter: invert(1) hue-rotate(180deg);
  mix-blend-mode: screen;
}

.light .block-content .imageInvertW img {
  filter: invert(1) hue-rotate(180deg);
  mix-blend-mode: multiply;
}

// 激活的 dropdown-menu-item
.dropdown-menu-item.active {
  background-color: hsl(var(--muted));
}
</style>
