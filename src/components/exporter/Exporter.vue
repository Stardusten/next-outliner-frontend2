<template>
  <Dialog :open="open" @update:open="(open) => !open && closeExporter()">
    <DialogContent class="max-w-[80vw] w-[800px] flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>
          {{ $t("kbView.exporter.title") }}
        </DialogTitle>
        <DialogDescription>
          {{ $t("kbView.exporter.description") }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col space-y-3">
          <Label>{{ $t("kbView.exporter.exportFormat") }}</Label>
          <Select v-model="selectedFormat">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="plainText">Plain Text</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div v-if="selectedFormat === 'markdown'" class="flex flex-col space-y-3">
          <div class="flex items-center space-x-2">
            <Checkbox
              v-model:checked="markdownOptions.blockRefsToPlaintext"
              id="blockRefsToPlaintext"
            />
            <Label for="blockRefsToPlaintext">{{
              $t("kbView.exporter.blockRefsToPlaintext")
            }}</Label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox
              v-model:checked="markdownOptions.embedImagesAsBase64"
              id="embedImagesAsBase64"
            />
            <Label for="embedImagesAsBase64">{{ $t("kbView.exporter.embedImagesAsBase64") }}</Label>
          </div>
        </div>
        <div class="flex flex-col space-y-3" v-if="selectedFormat !== 'pdf'">
          <Label>{{ $t("kbView.exporter.preview") }}</Label>
          <div class="border rounded-md">
            <div class="text-sm max-h-[30vh] p-2 mr-1 max-w-full overflow-y-auto overflow-x-hidden">
              <pre class="text-wrap">{{ previewContent }}</pre>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeExporter">
          {{ $t("kbView.exporter.cancel") }}
        </Button>
        <Button variant="outline" :disabled="selectedFormat === 'pdf'" @click="copyToClipboard">
          <Clipboard class="size-4 mr-2" />
          {{ $t("kbView.exporter.copyToClipboard") }}
        </Button>
        <Button variant="outline" @click="exportToFile">
          <Download class="size-4 mr-2" />
          {{ $t("kbView.exporter.exportToFile") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import ExporterContext from "@/context/exporter";
import { copyAsHtml, copyAsPlainText } from "@/utils/clipboard";
import dayjs from "dayjs";
import { Clipboard, Download, File } from "lucide-vue-next";
import { computed, ref, reactive } from "vue";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";

const {
  open,
  blockId,
  closeExporter,
  exportSubtreeToHtml,
  exportSubtreeToMarkdown,
  exportSubtreeToPdf,
  exportSubtreeToPlainText,
} = ExporterContext.useContext()!;

const selectedFormat = ref("html");
const markdownOptions = ref({
  blockRefsToPlaintext: false,
  embedImagesAsBase64: false,
});

const previewContent = computed(() => {
  if (!blockId.value) return "";
  switch (selectedFormat.value) {
    case "html":
      return exportSubtreeToHtml(blockId.value);
    case "markdown":
      return exportSubtreeToMarkdown(blockId.value, markdownOptions.value);
    case "plainText":
      return exportSubtreeToPlainText(blockId.value);
    default:
      return "";
  }
});

function copyToClipboard() {
  const content =
    selectedFormat.value === "markdown"
      ? exportSubtreeToMarkdown(blockId.value!, markdownOptions.value)
      : previewContent.value;

  if (selectedFormat.value === "html") {
    copyAsHtml(content);
  } else if (selectedFormat.value === "markdown" || selectedFormat.value === "plainText") {
    copyAsPlainText(content);
  }
  closeExporter();
}

function exportToFile() {
  if (selectedFormat.value === "pdf") {
  } else {
    const content =
      selectedFormat.value === "markdown"
        ? exportSubtreeToMarkdown(blockId.value!, markdownOptions.value)
        : previewContent.value;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const extname =
      selectedFormat.value === "html" ? "html" : selectedFormat.value === "markdown" ? "md" : "txt";
    a.download = `export_${dayjs().format("YYYY-MM-DD-HH-mm-ss")}.${extname}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  closeExporter();
}
</script>
