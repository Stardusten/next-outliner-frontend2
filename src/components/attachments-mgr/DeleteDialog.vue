<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ $t("kbView.attachmentsManager.delete.title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("kbView.attachmentsManager.delete.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <div class="text-sm space-y-4">
          <p class="font-medium">{{ name }}</p>
          <p v-if="isDirectory && fileCount > 0" class="text-muted-foreground">
            {{ $t("kbView.attachmentsManager.delete.fileCount", { count: fileCount }) }}
          </p>
          <p class="text-red-500">
            {{ $t("kbView.attachmentsManager.delete.warning") }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          {{ $t("kbView.attachmentsManager.delete.cancelBtn") }}
        </Button>
        <Button variant="destructive" :disabled="status === 'submitting'" @click="handleSubmit">
          <Loader2 v-if="status === 'submitting'" class="size-4 mr-2 animate-spin" />
          {{ $t("kbView.attachmentsManager.delete.submitBtn") }}
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-vue-next";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import AttachmentsManagerContext from "@/context/attachmentsManager";

const props = defineProps<{
  path: string;
  name: string;
  isDirectory: boolean;
}>();

const open = defineModel<boolean>("open");
const { t } = useI18n();
const status = ref<"idle" | "submitting">("idle");
const { currentFiles, handleDelete } = AttachmentsManagerContext.useContext()!;

// 计算文件夹中的文件数量
const fileCount = computed(() => {
  if (!props.isDirectory) return 0;
  const countFiles = (files: typeof currentFiles.value): number => {
    return Object.values(files).reduce((count, file) => {
      if (file.isDirectory) {
        return count + countFiles(file.subDirents);
      }
      return count + 1;
    }, 0);
  };
  const dir = currentFiles.value[props.name];
  return dir?.isDirectory ? countFiles(dir.subDirents) : 0;
});

const handleSubmit = async () => {
  status.value = "submitting";
  try {
    await handleDelete(props.path, props.isDirectory);
    open.value = false;
  } catch {
    status.value = "idle";
  }
};
</script>
