<template>
  <div class="group w-full flex items-center h-8 px-2 hover:bg-muted rounded-sm overflow-hidden">
    <div v-if="!isDirectory" class="w-8 flex-shrink-0" />
    <Label :for="name" class="flex-1 flex items-center cursor-pointer min-w-0">
      <component :is="isDirectory ? Folder : File" class="size-4 mr-2 flex-shrink-0" />
      <span class="text-sm truncate flex-1">{{ name }}</span>
    </Label>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" class="size-8 p-0 opacity-0 group-hover:opacity-100">
          <MoreHorizontal class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          v-if="!isDirectory && isTextFile(name)"
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  File,
  Folder,
  MoreHorizontal,
  Pencil,
  Copy,
  Info,
  Trash,
  Download,
  Eye,
} from "lucide-vue-next";
import RenameDialog from "./RenameDialog.vue";
import DeleteDialog from "./DeleteDialog.vue";
import InfoDialog from "./InfoDialog.vue";
import { ref } from "vue";
import AttachmentsManagerContext from "@/context/attachmentsManager";
import AttachmentViewerContext from "@/context/attachmentViewer";

defineProps<{
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  mtime?: Date | string;
  ctime?: Date | string;
}>();

const { handleDownload, isTextFile } = AttachmentsManagerContext.useContext()!;
const { previewTextFile } = AttachmentViewerContext.useContext()!;

const openRenameDialog = ref(false);
const openDeleteDialog = ref(false);
const openInfoDialog = ref(false);

const handlePreview = async (path: string, name: string) => {
  await previewTextFile(name, path);
};
</script>
