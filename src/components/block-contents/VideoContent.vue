<template>
  <div class="block-content video-content">
    <div class="flex flex-col gap-2 py-1" v-if="status === 'viewing' && url">
      <div class="video-fit-container relative w-fit bg-background">
        <video
          ref="videoElRef"
          controls
          class="w-fit h-fit max-w-full max-h-full rounded-md outline-none [&::-webkit-media-controls-timeline]:mx-3"
          preload="metadata"
          :style="{
            width: block.content[2] ? block.content[2] + 'px' : 'unset',
          }"
        >
          <source :src="url" type="video/mp4" />
          {{ $t("kbView.attachmentViewer.videoNotSupported") }}
        </video>

        <div
          class="absolute right-[2px] top-1/2 -translate-y-1/2 h-full max-h-[40px] rounded w-1 bg-muted cursor-col-resize"
          @mousedown="handleMouseDown"
        ></div>
      </div>
    </div>
    <div v-else-if="status === 'loading'" class="flex items-center gap-2 text-muted-foreground">
      <Loader2 class="animate-spin size-4" />
      {{ $t("kbView.attachmentViewer.loading") }}
    </div>
    <div v-else-if="status === 'error'" class="text-red-500">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { fsGetAttachmentSignedUrl } from "@/common/api-call/fs";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import ServerInfoContext from "@/context/serverInfo";
import type { DisplayItemId } from "@/utils/display-item";
import { Loader2 } from "lucide-vue-next";
import { ref, watch } from "vue";
import { useTaskQueue } from "@/plugins/taskQueue";
import BlocksContext from "@/context/blocks/blocks";
import type { VideoContent } from "@/common/type-and-schemas/block/block-content";

const props = defineProps<{
  blockTree?: BlockTree;
  block: Block;
  itemId?: DisplayItemId;
}>();

const { serverUrl } = ServerInfoContext.useContext()!;
const status = ref<"loading" | "error" | "viewing">("loading");
const errorMessage = ref<string>("");
const url = ref<string | null>(null);
const videoElRef = ref<HTMLVideoElement | null>(null);
const taskQueue = useTaskQueue();
const { blockEditor } = BlocksContext.useContext()!;
let videoLeft = 0;

const handleMouseMove = (e: MouseEvent) => {
  const newWidth = e.clientX - videoLeft + 3;
  const videoEl = videoElRef.value;
  if (!videoEl) return;
  videoEl.style.width = `${newWidth}px`;
};

const handleMouseUpOrLeave = () => {
  const videoEl = videoElRef.value;
  if (!videoEl) return;
  const newWidth = videoEl.clientWidth;

  taskQueue.addTask(() => {
    const blockId = props.block.id;
    const newContent = [...props.block.content] as VideoContent;
    newContent[2] = newWidth;
    blockEditor.changeBlockContent({ blockId, content: newContent });
  });

  document.getElementById("cursor-style")?.remove();

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUpOrLeave);
  document.removeEventListener("mouseleave", handleMouseUpOrLeave);
};

const handleMouseDown = (e: MouseEvent) => {
  const videoEl = videoElRef.value;
  const rect = videoEl?.getBoundingClientRect();
  if (!rect) return;
  videoLeft = rect.left;

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

watch(
  () => props.block.content[1],
  async (newPath, oldPath) => {
    if (props.block.content[0] !== BLOCK_CONTENT_TYPES.VIDEO) {
      console.log("not a video block");
      status.value = "loading";
      return;
    }

    if (newPath === oldPath && url.value) {
      return;
    }

    try {
      status.value = "loading";
      errorMessage.value = "";

      const resp = await fsGetAttachmentSignedUrl({
        path: newPath,
        attachment: false,
        inferMimeType: true,
      });

      if (!resp.success) {
        throw new Error("Failed to get signed URL");
      }

      url.value = `${serverUrl.value}${resp.data.signedUrl}`;
      status.value = "viewing";
    } catch (error) {
      console.error("Error previewing video attachment", error);
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "Unknown error";
      url.value = null;
    }
  },
  { immediate: true },
);
</script>

<style lang="scss">
.video-fit-container {
  .resize-handle {
    opacity: 0;
    transition: opacity 200ms var(--tf);
  }

  &:hover .resize-handle {
    opacity: 1;
  }
}
</style>
