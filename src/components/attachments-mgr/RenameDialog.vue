<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ $t("kbView.attachmentsManager.rename.title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("kbView.attachmentsManager.rename.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="flex flex-col gap-3">
          <Label>{{ $t("kbView.attachmentsManager.rename.newNameLabel") }}</Label>
          <Input
            ref="inputRef"
            v-model="newName"
            :placeholder="$t('kbView.attachmentsManager.rename.newNamePlaceholder')"
          />
          <div v-if="errorMsg" class="text-red-500 flex items-center text-sm">
            <X class="size-4 mr-2" />
            {{ errorMsg }}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          {{ $t("kbView.attachmentsManager.rename.cancelBtn") }}
        </Button>
        <Button
          :disabled="isSubmitDisabled"
          @click="handleSubmit"
          :class="{ 'opacity-50 cursor-not-allowed': isSubmitDisabled }"
        >
          <Loader2 v-if="status === 'submitting'" class="size-4 mr-2 animate-spin" />
          {{ $t("kbView.attachmentsManager.rename.submitBtn") }}
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AttachmentsManagerContext from "@/context/attachmentsManager";
import { timeout } from "@/utils/time";
import { Loader2, X } from "lucide-vue-next";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  path: string;
  name: string;
}>();
const open = defineModel<boolean>("open");

const { t } = useI18n();
const newName = ref("");
const status = ref<"idle" | "submitting" | "success" | "error">("idle");
const inputRef = ref<HTMLInputElement>();
const { currentFiles, handleRename } = AttachmentsManagerContext.useContext()!;

const errorMsg = computed(() => {
  if (status.value === "submitting") return null;
  if (!newName.value) {
    return t("kbView.attachmentsManager.rename.error.emptyName");
  }

  const existed = new Set(Object.values(currentFiles.value).map((f) => f.name));

  if (existed.has(newName.value)) {
    return t("kbView.attachmentsManager.rename.error.duplicateName");
  }
  return null;
});

const isSubmitDisabled = computed(() => {
  return !!errorMsg.value || status.value === "submitting";
});

// 监听对话框打开，自动聚焦输入框并填入旧文件名
watch(open, async (newVal) => {
  if (newVal) {
    newName.value = props.name;
    status.value = "idle";
    await timeout(0);
    if (!(inputRef.value instanceof HTMLInputElement)) return;
    inputRef.value.focus();
    inputRef.value.select();
  }
});

const handleSubmit = async () => {
  if (isSubmitDisabled.value) return;

  status.value = "submitting";
  try {
    await handleRename(props.path, newName.value);
    status.value = "success";
  } catch (error) {
    status.value = "error";
  }
};
</script>
