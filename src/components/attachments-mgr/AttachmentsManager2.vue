<template>
  <Dialog v-model:open="open">
    <DialogTrigger class="hidden" />
    <DialogContent
      class="attachments-mgr flex flex-col max-w-[80vw] max-h-[80vh] w-[800px] h-[600px] gap-0 p-0 !outline-none"
    >
      <!-- Header -->
      <div class="px-4 pt-5 pb-2">
        <DialogHeader>
          <DialogTitle class="flex items-center">
            <FolderOpen class="size-5 mr-2" />
            {{ $t("kbView.attachmentsManager.title") }}
          </DialogTitle>
          <DialogDescription>
            {{ $t("kbView.attachmentsManager.description") }}
          </DialogDescription>
        </DialogHeader>
      </div>

      <!-- 工具栏 -->
      <div class="p-2 pb-1 flex items-center justify-between gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            class="pl-8 h-9"
            :placeholder="$t('kbView.attachmentsManager.searchPlaceholder')"
          />
          <Button
            v-if="searchQuery"
            variant="ghost"
            size="sm"
            class="absolute right-1 top-1/2 -translate-y-1/2 size-7 p-0 hover:bg-transparent"
            @click="searchQuery = ''"
          >
            <X class="size-4" />
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                class="size-9 p-0"
                :class="{ 'bg-muted': showPreview }"
                @click="showPreview = !showPreview"
              >
                <Eye class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {{
                $t(
                  `kbView.attachmentsManager.tooltip.${showPreview ? "hidePreview" : "showPreview"}`,
                )
              }}
            </TooltipContent>
          </Tooltip>

          <!-- 文件类型过滤按钮 -->
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" class="size-9 p-0">
                <Filter
                  class="size-4"
                  :class="{ 'text-primary': Object.values(fileTypeFilter).some((v) => !v) }"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-64 p-3">
              <div>
                <h4 class="font-medium mb-3">
                  {{ $t("kbView.attachmentsManager.filterByType") }}
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="type in ['folders', 'images', 'documents', 'audio', 'video', 'others']"
                    :key="type"
                    class="flex items-center"
                  >
                    <Checkbox
                      :id="type"
                      v-model:checked="fileTypeFilter[type as keyof typeof fileTypeFilter]"
                      @change="handleFilterChange(type)"
                      class="opacity-70 mr-2"
                    />
                    <Label class="font-normal" :for="type">{{
                      $t(`kbView.attachmentsManager.${type}`)
                    }}</Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <!-- 文件排序按钮 -->
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" class="size-9 p-0">
                <ArrowUpDown
                  class="size-4"
                  :class="{ 'text-primary': Object.values(sortBy).some((v) => v !== 'none') }"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-64 p-3">
              <div>
                <h4 class="font-medium mb-3">
                  {{ $t("kbView.attachmentsManager.sortBy") }}
                </h4>
                <div>
                  <div
                    v-for="type in ['name', 'date', 'size']"
                    :key="type"
                    class="flex text-sm select-none items-center justify-between -mx-1 px-1 py-1 cursor-pointer hover:bg-muted rounded-sm"
                    @click="handleSortChange(type as keyof typeof sortBy)"
                  >
                    <span>{{
                      $t(
                        `kbView.attachmentsManager.sortBy${type.charAt(0).toUpperCase() + type.slice(1)}`,
                      )
                    }}</span>
                    <div class="flex items-center gap-1">
                      <ArrowUpDown
                        v-if="sortBy[type as keyof typeof sortBy] === 'none'"
                        class="size-4 opacity-30"
                      />
                      <ArrowUp
                        v-if="sortBy[type as keyof typeof sortBy] === 'asc'"
                        class="size-4"
                      />
                      <ArrowDown
                        v-if="sortBy[type as keyof typeof sortBy] === 'desc'"
                        class="size-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="relative flex-1 overflow-hidden">
        <!-- 文件列表 -->
        <div
          class="h-full overflow-auto p-2"
          :style="{
            paddingRight: showPreview ? 'calc(50% + 0.5rem)' : '0.5rem',
            transition: 'padding 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          }"
        >
          <!-- 加载遮罩 -->
          <div
            v-if="fetchFilesStatus === 'fetching'"
            class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px]"
          >
            <div class="flex flex-col items-center gap-2">
              <Loader2 class="size-8 animate-spin text-muted-foreground" />
              <span class="text-sm text-muted-foreground">
                {{ $t("kbView.attachmentsManager.refreshing") }}
              </span>
            </div>
          </div>

          <div class="space-y-0.5">
            <template v-for="dirent in filterResult.files" :key="dirent.name">
              <DirectoryItem
                v-if="dirent.isDirectory"
                :name="dirent.name"
                :path="dirent.name"
                :mtime="dirent.mtime"
                :ctime="dirent.ctime"
                :size="dirent.size"
                :is-expanded="expandedDirs.has(dirent.name)"
                :sub-dirents="Object.values(dirent.subDirents)"
                :filtered-count="filterResult.dirFilteredCounts.get(dirent.name)"
                :on-toggle="() => toggleDirectory(dirent.name)"
                :highlight-terms="queryTerms"
              />
              <FileItem
                v-else
                :name="dirent.name"
                :path="dirent.name"
                :is-directory="false"
                :highlight-terms="queryTerms"
                @click="handleFileSelect(dirent)"
              />
            </template>
          </div>

          <div
            v-if="filterResult.files.length === 0"
            class="text-center text-sm text-muted-foreground py-8"
          >
            {{ $t("kbView.attachmentsManager.noFiles") }}
          </div>
          <div
            v-else-if="filterResult.filteredCount > 0"
            class="text-center text-xs text-muted-foreground mt-4"
          >
            {{ $t("kbView.attachmentsManager.hiddenFiles", { count: filterResult.filteredCount }) }}
          </div>
        </div>

        <!-- 预览面板 -->
        <Transition @leave="handlePreviewPanelClose" @enter="handlePreviewPanelOpen">
          <div
            v-if="showPreview"
            class="absolute right-2 top-2 bottom-2 w-[calc(50%-0.75rem)] border rounded-md p-2 overflow-hidden"
          >
            <div class="h-full">
              <div
                v-if="!previewingFile"
                class="h-full flex items-center justify-center text-muted-foreground"
              >
                {{
                  selectedFile
                    ? $t("kbView.attachmentsManager.fileNotPreviewable")
                    : $t("kbView.attachmentsManager.selectFileToPreview")
                }}
              </div>
              <div v-else class="h-full">
                <!-- 加载状态 -->
                <div
                  v-if="previewStatus === 'loading'"
                  class="h-full flex items-center justify-center"
                >
                  <div class="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 class="size-8 animate-spin" />
                    <div>{{ $t("kbView.attachmentViewer.loading") }}</div>
                  </div>
                </div>

                <!-- 错误状态 -->
                <div
                  v-else-if="previewStatus === 'error'"
                  class="h-full flex items-center justify-center"
                >
                  <div class="flex flex-col items-center gap-2 text-destructive">
                    <XCircle class="size-8" />
                    <div>{{ previewError }}</div>
                  </div>
                </div>

                <!-- 文本文件预览 -->
                <TextFileViewer
                  v-else-if="previewStatus === 'viewing' && previewingFile?.type === 'text'"
                  v-model:viewingAttachment="previewingFile"
                  :allowEdit="false"
                />

                <!-- 图片文件预览 -->
                <StaticImageFileViewer
                  v-else-if="previewStatus === 'viewing' && previewingFile?.type === 'image'"
                  v-model:viewingAttachment="previewingFile"
                />

                <!-- 动图预览 -->
                <AnimateImageFileViewerStaticSizing
                  v-else-if="previewStatus === 'viewing' && previewingFile?.type === 'animateImage'"
                  v-model:viewingAttachment="previewingFile"
                />

                <!-- 音频预览 -->
                <AudioFileViewer
                  v-else-if="previewStatus === 'viewing' && previewingFile?.type === 'audio'"
                  v-model:viewingAttachment="previewingFile"
                />

                <!-- 视频预览 -->
                <VideoFileViewer
                  v-else-if="previewStatus === 'viewing' && previewingFile?.type === 'video'"
                  v-model:viewingAttachment="previewingFile"
                />

                <!-- 其他预览组件... -->
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Footer -->
      <div class="border-t p-2">
        <div class="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            :disabled="fetchFilesStatus === 'fetching'"
            @click="refreshFiles"
          >
            <RefreshCw class="size-4 mr-2" />
            {{ $t("kbView.attachmentsManager.actions.refresh") }}
          </Button>

          <!-- 右侧操作按钮 -->
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="uploadStatus === 'uploading'"
              @click="() => uploadInput?.click()"
            >
              <template v-if="uploadStatus === 'uploading'">
                <Loader2 class="size-4 mr-2 animate-spin" />
                {{ $t("kbView.attachmentsManager.uploading") }}
              </template>
              <template v-else>
                <Upload class="size-4 mr-2" />
                {{ $t("kbView.attachmentsManager.upload") }}
              </template>
            </Button>
            <input
              ref="uploadInput"
              type="file"
              multiple
              class="hidden"
              @change="handleFileChange"
            />
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { fsEnsureAttachmentsDir } from "@/common/api-call/fs";
import type { Dirents } from "@/common/type-and-schemas/dirents";
import AttachmentsManagerContext from "@/context/attachmentsManager";
import { isAnimateImage, isAudio, isStaticImage, isText, isVideo } from "@/utils/fileType";
import { hybridTokenize } from "@/utils/tokenize";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Filter,
  FolderOpen,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  X,
  XCircle,
} from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import AnimateImageFileViewerStaticSizing from "../attachment-viewer/AnimateImageFileViewerStaticSizing.vue";
import AudioFileViewer from "../attachment-viewer/AudioFileViewer.vue";
import StaticImageFileViewer from "../attachment-viewer/StaticImageFileViewer.vue";
import TextFileViewer from "../attachment-viewer/TextFileViewer.vue";
import VideoFileViewer from "../attachment-viewer/VideoFileViewer.vue";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import DirectoryItem from "./DirectoryItem.vue";
import FileItem from "./FileItem.vue";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const { t: $t } = useI18n();
const queryTerms = computed(() => {
  if (!searchQuery.value) return [];
  return hybridTokenize(searchQuery.value, false, 1, false) ?? [];
});
const {
  open,
  refreshFiles,
  attachmentsFolderName,
  currentPathSegments,
  activeDirent,
  fileTypeFilter,
  sortBy,
  expandedDirs,
  handleClickItem,
  handleFilterChange,
  handleSortChange,
  toggleDirectory,
  filterResult,
  searchQuery,
  fetchFilesStatus,
  uploadStatus,
  handleUpload,
  showPreview,
  previewingFile,
  previewStatus,
  previewError,
  previewFile,
} = AttachmentsManagerContext.useContext()!;

const uploadInput = ref<HTMLInputElement>();

const selectedFile = ref<Dirents[string] | null>(null);

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    handleUpload(target.files);
    // 重置 input，这样同一个文件可以重复上传
    target.value = "";
  }
};

const handleFileSelect = async (file: Dirents[string]) => {
  if (file.isDirectory) {
    selectedFile.value = null;
    previewingFile.value = null;
    return;
  }

  const isPreviewable =
    isText(file.name) ||
    isStaticImage(file.name) ||
    isAnimateImage(file.name) ||
    isAudio(file.name) ||
    isVideo(file.name);

  // 只有当文件不可预览时才设置 selectedFile
  selectedFile.value = isPreviewable ? null : file;

  // 如果不可预览，清除之前的预览状态
  if (!isPreviewable) {
    previewingFile.value = null;
  }

  if (!showPreview.value) {
    showPreview.value = true;
  }

  if (isPreviewable) {
    await previewFile(file.name);
  }
};

const handlePreviewPanelClose = (el: Element, done: () => void) => {
  if (!(el instanceof HTMLElement)) return;
  const animation = el.animate(
    [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: "translateX(100%)" },
    ],
    {
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  );
  animation.onfinish = () => {
    done();
  };
};

const handlePreviewPanelOpen = (el: Element, done: () => void) => {
  if (!(el instanceof HTMLElement)) return;
  const animation = el.animate(
    [
      { opacity: 0, transform: "translateX(100%)" },
      { opacity: 1, transform: "translateX(0)" },
    ],
    {
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  );
  animation.onfinish = () => {
    done();
  };
};

onMounted(async () => {
  await fsEnsureAttachmentsDir({});
  await refreshFiles();
});
</script>

<style lang="scss">
.attachments-mgr .highlight-keep {
  background-color: var(--highlight-text-bg);
}
</style>
