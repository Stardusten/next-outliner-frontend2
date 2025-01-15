<template>
  <div class="h-full flex items-center justify-center" v-if="viewingAttachment">
    <img
      :src="viewingAttachment.url"
      :alt="viewingAttachment.name"
      class="max-w-full max-h-full object-contain"
    />
  </div>
</template>

<script setup lang="ts">
import type { ViewingImageState } from "@/context/attachmentViewer";

const viewingAttachment = defineModel<ViewingImageState>("viewingAttachment");
</script>
