<template>
  <div class="block-content audio-content">
    <div class="flex items-center justify-center w-[300px]" v-if="status === 'viewing' && url">
      <audio controls class="h-9 my-2">
        <source :src="url" type="audio/mpeg" />
        {{ $t("kbView.attachmentViewer.audioNotSupported") }}
      </audio>
    </div>
    <div v-else-if="status === 'loading'" class="flex items-center gap-2">
      <i class="ri-loader-4-line animate-spin"></i>
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
import type { AudioBlock } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import ServerInfoContext from "@/context/serverInfo";
import type { DisplayItemId } from "@/utils/display-item";
import { ref, watch } from "vue";

const props = defineProps<{
  blockTree?: BlockTree;
  block: AudioBlock;
  itemId?: DisplayItemId;
}>();

const { serverUrl } = ServerInfoContext.useContext()!;
const status = ref<"loading" | "error" | "viewing">("loading");
const errorMessage = ref<string>("");
const url = ref<string | null>(null);

watch(
  () => props.block.content,
  async (content) => {
    if (content[0] !== BLOCK_CONTENT_TYPES.AUDIO) {
      console.log("not an audio block");
      status.value = "loading";
      return;
    }

    try {
      status.value = "loading";
      errorMessage.value = "";

      const resp = await fsGetAttachmentSignedUrl({
        path: content[1],
        attachment: false,
        inferMimeType: true,
      });

      if (!resp.success) {
        throw new Error("Failed to get signed URL");
      }

      url.value = `${serverUrl.value}${resp.data.signedUrl}`;
      status.value = "viewing";
    } catch (error) {
      console.error("Error previewing audio attachment", error);
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "Unknown error";
      url.value = null;
    }
  },
  { immediate: true },
);
</script>
