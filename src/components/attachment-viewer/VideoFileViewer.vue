<template>
  <div class="flex flex-col gap-2">
    <video
      ref="videoRef"
      controls
      class="max-w-full max-h-[50vh] rounded-md"
      :src="viewingAttachment.url"
      preload="metadata"
    >
      <source :src="viewingAttachment.url" :type="`video/${getExtname(viewingAttachment.name)}`" />
      {{ $t("kbView.attachmentViewer.videoNotSupported") }}
    </video>
  </div>
</template>

<script setup lang="ts">
import type { ViewingVideoState } from "@/context/attachmentViewer";
import { getExtname } from "@/utils/fileType";

defineProps<{
  viewingAttachment: ViewingVideoState;
}>();
</script>

<style scoped>
video {
  outline: none;
}

video::-webkit-media-controls-timeline {
  margin: 0 12px;
}
</style>
