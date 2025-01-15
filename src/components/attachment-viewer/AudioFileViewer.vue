<template>
  <div class="h-full flex items-center justify-center w-[300px]" v-if="viewingAttachment">
    <audio controls class="w-full">
      <source :src="viewingAttachment.url" :type="`audio/${getExtname(viewingAttachment.name)}`" />
      {{ $t("kbView.attachmentViewer.audioNotSupported") }}
    </audio>
  </div>
</template>

<script setup lang="ts">
import type { ViewingAudioState } from "@/context/attachmentViewer";
import { getExtname } from "@/utils/fileType";

const viewingAttachment = defineModel<ViewingAudioState>("viewingAttachment");
</script>
