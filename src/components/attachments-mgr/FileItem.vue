<template>
  <div class="group w-full flex items-center h-8 px-2 hover:bg-muted rounded-sm overflow-hidden">
    <div v-if="!isDirectory" class="w-8 flex-shrink-0" />
    <Label :for="name" class="flex-1 flex items-center cursor-pointer min-w-0">
      <component :is="isDirectory ? Folder : File" class="size-4 mr-2 flex-shrink-0" />
      <span class="text-sm truncate flex-1">
        <HighlightedText :text="name" :highlight-terms="highlightTerms" />
      </span>
    </Label>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" class="size-8 p-0 opacity-0 group-hover:opacity-100">
          <MoreHorizontal class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          v-if="
            !isDirectory &&
            (isTextFile(name) ||
              isStaticImage(name) ||
              isAnimateImage(name) ||
              isAudioFile(name) ||
              isVideo(name))
          "
          @click="handlePreview(path, name)"
        >
          <Eye class="size-4 mr-2" />
          {{ $t("kbView.attachmentsManager.actions.preview") }}
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isDirectory" @click="handleDownload(path)">
          <Download class="size-4 mr-2" />
          {{ $t("kbView.attachmentsManager.actions.download") }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openRenameDialog = true">
          <Pencil class="size-4 mr-2" />
          {{ $t("kbView.attachmentsManager.actions.rename") }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openInfoDialog = true">
          <Info class="size-4 mr-2" />
          {{ $t("kbView.attachmentsManager.actions.info") }}
        </DropdownMenuItem>
        <DropdownMenuItem class="!text-red-500" @click="openDeleteDialog = true">
          <Trash class="size-4 mr-2" />
          {{ $t("kbView.attachmentsManager.actions.delete") }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <RenameDialog v-model:open="openRenameDialog" :path="path" :name="name" />
    <DeleteDialog
      v-model:open="openDeleteDialog"
      :path="path"
      :name="name"
      :is-directory="isDirectory"
    />
    <InfoDialog
      v-model:open="openInfoDialog"
      :path="path"
      :name="name"
      :is-directory="isDirectory"
      :size="size"
      :mtime="mtime"
      :ctime="ctime"
    />
  </div>
</template>

<script setup lang="ts">
import HighlightedText from "@/components/highlighted-text/HighlightedText.vue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import AttachmentsManagerContext from "@/context/attachmentsManager";
import AttachmentViewerContext from "@/context/attachmentViewer";
import { Download, Eye, File, Folder, Info, MoreHorizontal, Pencil, Trash } from "lucide-vue-next";
import { ref } from "vue";
import DeleteDialog from "./DeleteDialog.vue";
import InfoDialog from "./InfoDialog.vue";
import RenameDialog from "./RenameDialog.vue";

const props = defineProps<{
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  mtime?: Date | string;
  ctime?: Date | string;
  highlightTerms?: string[];
}>();

const {
  handleDownload,
  isText: isTextFile,
  isStaticImage,
  isAnimateImage,
  isAudio: isAudioFile,
  isVideo,
} = AttachmentsManagerContext.useContext()!;
const { handlePreview } = AttachmentViewerContext.useContext()!;

const openRenameDialog = ref(false);
const openDeleteDialog = ref(false);
const openInfoDialog = ref(false);
</script>
