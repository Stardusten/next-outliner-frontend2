<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex flex-row max-w-[80vw] max-h-[80vh] w-[800px] h-[600px] p-0 !outline-none"
    >
      <DialogHeader class="hidden">
        <DialogTitle>
          {{ $t("kbView.attachmentsManager.title") }}
        </DialogTitle>
      </DialogHeader>
      <!-- <input type="file" @change="onFileChange" />
      <Button @click="handleSubmit">上传</Button> -->
      <FileTree />
      <PreviewPane />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { fsEnsureAttachmentsDir } from "@/common/api-call/fs";
import AttachmentsManagerContext from "@/context/attachmentsManager";
import { onMounted, ref } from "vue";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import FileTree from "./FileTree.vue";
import PreviewPane from "./PreviewPane.vue";

const {
  open,
  files,
  refetchFiles,
  fetchFilesStatus,
  uploadStatus,
  currentPathSegments,
  dbBasePath,
} = AttachmentsManagerContext.useContext();

const pendingFiles = ref<File[]>([]);

onMounted(async () => {
  await fsEnsureAttachmentsDir({});
  await refetchFiles();
});
</script>
