<template>
  <Dialog v-model:open="open">
    <DialogContent class="p-4 h-[80vh] w-[80vw] max-w-[unset] flex flex-col">
      <DialogHeader>
        <div class="text-sm text-muted-foreground bg-muted rounded-md px-2 py-1 w-fit">
          {{ viewingAttachment?.name }}
        </div>
      </DialogHeader>

      <div class="border rounded-md p-2 h-0 flex-grow overflow-hidden">
        <!-- 加载状态 -->
        <div v-if="status === 'loading'" class="h-full flex items-center justify-center">
          <div class="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 class="size-8 animate-spin" />
            <div>{{ $t("kbView.attachmentViewer.loading") }}</div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="status === 'error'" class="h-full flex items-center justify-center">
          <div class="flex flex-col items-center gap-2 text-destructive">
            <XCircle class="size-8" />
            <div>{{ errorMessage }}</div>
          </div>
        </div>

        <!-- 查看状态 -->
        <TextFileViewer
          v-else-if="status === 'viewing' && viewingAttachment"
          v-model:viewingAttachment="viewingAttachment"
          :allowEdit="allowEdit"
        />
      </div>

      <DialogFooter as-child>
        <div class="flex items-center gap-2 w-full justify-between">
          <div class="flex items-center gap-2">
            <Checkbox v-model:checked="allowEdit" />
            <Label>{{ $t("kbView.attachmentViewer.allowEdit") }}</Label>
          </div>
          <Button
            variant="outline"
            :disabled="!allowEdit || viewingAttachment?.tempContent === viewingAttachment?.content"
            @click="viewingAttachment?.save()"
          >
            <Save class="size-4 mr-2" />
            {{ $t("kbView.attachmentViewer.save") }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import AttachmentViewerContext from "@/context/attachmentViewer";
import { computed, ref } from "vue";
import TextFileViewer from "./TextFileViewer.vue";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Save, Loader2, XCircle } from "lucide-vue-next";

const { viewingAttachment, status, errorMessage, closeViewer } =
  AttachmentViewerContext.useContext()!;

const open = computed({
  get: () => status.value !== "idle",
  set: (value) => !value && closeViewer(),
});
const allowEdit = ref(false);
</script>
