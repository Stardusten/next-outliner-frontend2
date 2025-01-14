<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ $t("kbView.attachmentsManager.info.title") }}</DialogTitle>
      </DialogHeader>

      <div class="py-4">
        <div class="space-y-4">
          <!-- 名称 -->
          <div class="space-y-1.5">
            <Label class="text-sm text-muted-foreground">
              {{ $t("kbView.attachmentsManager.info.name") }}
            </Label>
            <p class="text-sm">{{ name }}</p>
          </div>

          <!-- 路径 -->
          <div class="space-y-1.5">
            <Label class="text-sm text-muted-foreground">
              {{ $t("kbView.attachmentsManager.info.path") }}
            </Label>
            <p class="text-sm">{{ path }}</p>
          </div>

          <!-- 类型 -->
          <div class="space-y-1.5">
            <Label class="text-sm text-muted-foreground">
              {{ $t("kbView.attachmentsManager.info.type") }}
            </Label>
            <p class="text-sm">
              {{ isDirectory ? $t("kbView.attachmentsManager.folders") : getFileType(name) }}
            </p>
          </div>

          <!-- 大小 -->
          <div v-if="!isDirectory" class="space-y-1.5">
            <Label class="text-sm text-muted-foreground">
              {{ $t("kbView.attachmentsManager.info.size") }}
            </Label>
            <p class="text-sm">{{ formatFileSize(size ?? 0) }}</p>
          </div>

          <!-- 修改时间 -->
          <div class="space-y-1.5">
            <Label class="text-sm text-muted-foreground">
              {{ $t("kbView.attachmentsManager.info.modifiedTime") }}
            </Label>
            <p class="text-sm">{{ formatTime(mtime) }}</p>
          </div>

          <!-- 创建时间 -->
          <div class="space-y-1.5">
            <Label class="text-sm text-muted-foreground">
              {{ $t("kbView.attachmentsManager.info.createdTime") }}
            </Label>
            <p class="text-sm">{{ formatTime(ctime) }}</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          {{ $t("kbView.attachmentsManager.info.closeBtn") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import dayjs from "dayjs";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  path: string;
  name: string;
  isDirectory: boolean;
  size?: number;
  mtime?: Date | string;
  ctime?: Date | string;
}>();

const open = defineModel<boolean>("open");
const { t } = useI18n();

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatTime = (time?: Date | string) => {
  return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "-";
};

const getFileType = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const docExts = ["pdf", "doc", "docx", "txt", "md"];
  const audioExts = ["mp3", "wav", "ogg", "m4a"];
  const videoExts = ["mp4", "webm", "avi", "mov"];

  if (imageExts.includes(ext)) return t("kbView.attachmentsManager.images");
  if (docExts.includes(ext)) return t("kbView.attachmentsManager.documents");
  if (audioExts.includes(ext)) return t("kbView.attachmentsManager.audio");
  if (videoExts.includes(ext)) return t("kbView.attachmentsManager.video");
  return t("kbView.attachmentsManager.others");
};
</script>
