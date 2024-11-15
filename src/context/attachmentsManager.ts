import { fsLs, type Dirents } from "@/common/api/fs";
import { createContext } from "@/utils/createContext";
import { getSeperator, joinPathSegments } from "@/common/path";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import PathsContext from "./paths";

const AttachmentsManagerContext = createContext(() => {
  
  const { dbBasePath, attachmentsBasePath, attachmentsFolderName } = PathsContext.useContext();
  const open = ref(false);
  // /dbBasePath/attachments 下的所有文件
  const files = ref<Dirents>({});
  const fetchFilesStatus = ref<"idle" | "fetching" | "success" | "failed">("idle");
  const uploadStatus = ref<"idle" | "uploading" | "success" | "failed">("idle");
  // 当前路径相对 /dbBasePath/attachments 多出来的 segments
  // 例如，当前路径是 /dbBasePath/attachments/images/screenshots，
  // 那么 segments 就是 ['images', 'screenshots']
  const currentPathSegments = ref<string[]>([]);
  // 当前聚焦的 dirent
  const activeDirent = ref<{
    path: string;
    isDirectory: boolean;
    isPreview: boolean;
  } | null>(null);
  // 当前路径下的所有文件
  const currentFiles = computed(() => {
    let ctx = files.value;
    for (const segment of currentPathSegments.value) {
      if (segment in ctx && ctx[segment].isDirectory)
        ctx = ctx[segment].subDirents;
      else return {};
    }
    return ctx;
  });

  const refetchFiles = async (basePath?: string, maxDepth?: number) => {
    fetchFilesStatus.value = "fetching";
    const res = await fsLs({
      basePath: basePath ?? attachmentsBasePath.value,
      includeHidden: true,
      recursive: true,
      maxDepth: maxDepth ?? 1000, // Infinity
    });
    if (res.success) {
      files.value = res.data;
      fetchFilesStatus.value = "success";
    } else {
      fetchFilesStatus.value = "failed";
    }
  };

  return {
    open,
    files,
    refetchFiles,
    attachmentsFolderName,
    fetchFilesStatus,
    uploadStatus,
    currentPathSegments,
    dbBasePath,
    attachmentsBasePath,
    currentFiles,
    activeDirent,
  };
});

export default AttachmentsManagerContext;
