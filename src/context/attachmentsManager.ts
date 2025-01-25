import {
  type FileTypeFilter,
  filterFiles,
  type FilterResult,
} from "./attachmentsManager/fileFilter";
import { fsLs, fsUpload, fsRename, fsDelete, fsGetAttachmentSignedUrl } from "@/common/api-call/fs";
import { type Dirents } from "@/common/type-and-schemas/dirents";
import { createContext } from "@/utils/createContext";
import { computed, ref, reactive, watch } from "vue";
import PathsContext from "./paths";
import { searchFiles } from "@/utils/fileSearch";
import { useDebounceFn } from "@vueuse/core";
import { timeout } from "@/utils/time";
import { toast } from "@/components/ui/toast/use-toast";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import ServerInfoContext from "./serverInfo";
import { isText, isStaticImage, isAnimateImage, isAudio, isVideo } from "@/utils/fileType";
import { getSeperator } from "@/common/helper-functions/path";
import { type ViewingState, type AttachmentInfo, createViewingState } from "./attachmentViewer";
import AttachmentViewerContext from "./attachmentViewer";
import SearchSettingsContext from "./searchSettings";

const AttachmentsManagerContext = createContext(() => {
  const { dbBasePath, attachmentsBasePath, attachmentsFolderName } = PathsContext.useContext()!;
  const { serverUrl } = ServerInfoContext.useContext()!;
  const {
    handlePreview,
    viewingAttachment,
    previewTextFile,
    previewStaticImageFile,
    previewAnimateImageFile,
    previewAudioFile,
    previewVideoFile,
    getPreviewInfo,
  } = AttachmentViewerContext.useContext()!;
  const { ignoreDiacritics } = SearchSettingsContext.useContext()!;

  const { t } = useI18n();
  const open = ref(false);
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
  // 文件类型过滤
  const fileTypeFilter = ref<FileTypeFilter>({
    folders: true,
    images: true,
    documents: true,
    audio: true,
    video: true,
    others: true,
  });
  // 排序方式
  const sortBy = ref<{
    name: SortOrder;
    date: SortOrder;
    size: SortOrder;
  }>({
    name: "none",
    date: "none",
    size: "none",
  });
  // 展开的目录
  const expandedDirs = ref<Set<string>>(new Set());
  // 搜索查询
  const searchQuery = ref("");
  // 防抖的搜索查询
  const debouncedSearchQuery = ref("");
  // 当前过滤结果
  const filterResult = ref<FilterResult>({
    files: [],
    filteredCount: 0,
    dirFilteredCounts: new Map(),
  });
  const showPreview = ref(false);
  const previewingFile = ref<ViewingState | null>(null);
  const previewStatus = ref<"idle" | "loading" | "error" | "viewing">("idle");
  const previewError = ref("");

  // 当前路径下的所有文件
  const currentFiles = computed(() => {
    let ctx = files.value;
    for (const segment of currentPathSegments.value) {
      if (segment in ctx && ctx[segment].isDirectory) {
        ctx = (ctx[segment] as any).subDirents;
      } else return {};
    }
    return ctx;
  });

  type SortOrder = "none" | "asc" | "desc";
  type SortField = keyof typeof sortBy.value;

  // 获取排序函数
  const getSortFn = (field: SortField, order: SortOrder) => {
    if (order === "none") return null;

    return (a: Dirents[string], b: Dirents[string]) => {
      let result = 0;
      switch (field) {
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "date":
          result = dayjs(a.mtime).valueOf() - dayjs(b.mtime).valueOf();
          break;
        case "size":
          result = (a.size ?? 0) - (b.size ?? 0);
          break;
      }
      return order === "asc" ? result : -result;
    };
  };

  const toggleDirectory = (dirName: string) => {
    expandedDirs.value.has(dirName)
      ? expandedDirs.value.delete(dirName)
      : expandedDirs.value.add(dirName);
  };

  // 更新防抖搜索查询
  const updateDebouncedSearchQuery = useDebounceFn((value: string) => {
    debouncedSearchQuery.value = value;
  }, 300);

  // 监听搜索查询变化
  watch(searchQuery, (value) => {
    updateDebouncedSearchQuery(value);
  });

  watch(
    [currentFiles, fileTypeFilter, sortBy, debouncedSearchQuery],
    ([currentFiles, fileTypeFilter, sortBy, debouncedSearchQuery]) => {
      const rawFilesArray = JSON.parse(JSON.stringify(Object.values(currentFiles)));
      const rawQuery = JSON.parse(JSON.stringify(debouncedSearchQuery));
      // 先应用搜索过滤
      // 要转换为原始对象，因为 searchFiles 里面有很深的递归
      // 转换可以防止 vue 的响应性追踪超过最大递归深度
      const searchResult = searchFiles(rawFilesArray, rawQuery, {
        includeDirectories: true,
        ignoreDiacritics: ignoreDiacritics.value,
      });

      // 先按文件夹在前排序
      searchResult.files.sort((a, b) => {
        return a.isDirectory === b.isDirectory ? 0 : a.isDirectory ? -1 : 1;
      });

      // 应用文件类型过滤
      const typeFilterResult = filterFiles(searchResult.files, fileTypeFilter);

      // 合并搜索和类型过滤的结果
      const newFilterResult = {
        files: typeFilterResult.files,
        filteredCount: searchResult.filteredCount + typeFilterResult.filteredCount,
        dirFilteredCounts: new Map([
          ...searchResult.dirFilteredCounts,
          ...typeFilterResult.dirFilteredCounts,
        ]),
      };

      // 应用所有非 none 的排序规则
      const sortFns = Object.entries(sortBy)
        .map(([field, order]) => getSortFn(field as SortField, order))
        .filter((fn): fn is NonNullable<typeof fn> => fn !== null);

      if (sortFns.length > 0) {
        // 分别对文件夹和文件进行排序
        const folders = newFilterResult.files.filter((f) => f.isDirectory);
        const files = newFilterResult.files.filter((f) => !f.isDirectory);

        // 对文件夹排序
        folders.sort((a, b) => {
          for (const fn of sortFns) {
            const result = fn(a, b);
            if (result !== 0) return result;
          }
          return 0;
        });

        // 对文件排序
        files.sort((a, b) => {
          for (const fn of sortFns) {
            const result = fn(a, b);
            if (result !== 0) return result;
          }
          return 0;
        });

        // 合并排序后的文件夹和文件
        newFilterResult.files = [...folders, ...files];
      }

      filterResult.value = newFilterResult;
    },
    { immediate: true, deep: true },
  );

  // 处理点击文件/文件夹
  const handleClickItem = (dirent: Dirents[string], path: string) => {
    activeDirent.value = {
      path,
      isDirectory: dirent.isDirectory,
      isPreview: false,
    };
  };

  // 切换文件类型过滤
  const handleFilterChange = (type: string) => {
    fileTypeFilter.value[type as keyof typeof fileTypeFilter.value] =
      !fileTypeFilter.value[type as keyof typeof fileTypeFilter.value];
  };

  // 切换排序方式
  const handleSortChange = (type: keyof typeof sortBy.value) => {
    const currentOrder = sortBy.value[type];
    // 重置所有排序
    Object.keys(sortBy.value).forEach((key) => {
      sortBy.value[key as keyof typeof sortBy.value] = "none";
    });
    // 设置新的排序
    sortBy.value[type] = currentOrder === "none" ? "asc" : currentOrder === "asc" ? "desc" : "none";
  };

  // 刷新文件列表
  const refreshFiles = async () => {
    fetchFilesStatus.value = "fetching";

    try {
      // 并行执行刷新和最小等待时间
      const [res] = await Promise.all([
        fsLs({
          basePath: currentPathSegments.value.join(getSeperator()),
          includeHidden: true,
          recursive: true,
          maxDepth: 1000, // Infinity
        }),
        timeout(1000), // 确保加载动画至少显示 1s
      ]);

      if (res.success) {
        files.value = res.data;
        fetchFilesStatus.value = "success";
      } else {
        fetchFilesStatus.value = "failed";
      }
    } catch (error) {
      fetchFilesStatus.value = "failed";
    }
  };

  // 不带动画的刷新
  const refreshFilesWithoutAnimation = async (basePath?: string, maxDepth?: number) => {
    try {
      const res = await fsLs({
        basePath: basePath ?? "",
        includeHidden: true,
        recursive: true,
        maxDepth: maxDepth ?? 1000,
      });

      if (res.success) {
        files.value = res.data;
      }
    } catch (error) {
      // 忽略错误
    }
  };

  // 处理文件上传
  const handleUpload = async (files: FileList) => {
    if (files.length === 0) return;
    uploadStatus.value = "uploading";

    try {
      // 检查文件名是否重复
      const existed = new Set(
        Object.values(currentFiles.value)
          .filter((f) => !f.isDirectory)
          .map((f) => f.name),
      );
      const duplicates = Array.from(files).filter((f) => existed.has(f.name));

      if (duplicates.length > 0) {
        toast({
          title: t("kbView.attachmentsManager.uploadError.title"),
          description: t("kbView.attachmentsManager.uploadError.duplicateFiles", {
            0: duplicates.map((f) => f.name).join(", "),
          }),
          variant: "destructive",
        });
        uploadStatus.value = "failed";
        return;
      }

      // 上传所有文件
      type Args = Parameters<typeof fsUpload>[0];
      const args: Args = Array.from(files).map((file) => [file.name, file] as const);

      // 上传文件，并等待 1 秒
      await Promise.all([fsUpload(args), timeout(1000)]);

      // 上传成功后静默刷新文件列表
      await refreshFilesWithoutAnimation();

      toast({
        title: t("kbView.attachmentsManager.uploadSuccess.title"),
        description: t("kbView.attachmentsManager.uploadSuccess.description", files.length),
      });

      uploadStatus.value = "success";
    } catch (error) {
      uploadStatus.value = "failed";
      toast({
        title: t("kbView.attachmentsManager.uploadError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("kbView.attachmentsManager.uploadError.unknown"),
        variant: "destructive",
      });
    }
  };

  // 处理重命名
  const handleRename = async (path: string, newName: string) => {
    try {
      const [res] = await Promise.all([fsRename({ path, newName }), timeout(1000)]);

      if (res.success) {
        toast({
          title: t("kbView.attachmentsManager.renameSuccess.title"),
          description: t("kbView.attachmentsManager.renameSuccess.description"),
        });
        await refreshFilesWithoutAnimation();
        return true;
      } else {
        toast({
          title: t("kbView.attachmentsManager.renameError.title"),
          description: t("kbView.attachmentsManager.renameError.unknown"),
          variant: "destructive",
        });
        throw new Error(t("kbView.attachmentsManager.renameError.unknown"));
      }
    } catch (error) {
      toast({
        title: t("kbView.attachmentsManager.renameError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("kbView.attachmentsManager.renameError.unknown"),
        variant: "destructive",
      });
      throw error;
    }
  };

  // 处理删除
  const handleDelete = async (path: string, isDirectory: boolean) => {
    try {
      const [res] = await Promise.all([fsDelete({ path }), timeout(1000)]);

      if (res.success) {
        toast({
          title: t("kbView.attachmentsManager.deleteSuccess.title"),
          description: t("kbView.attachmentsManager.deleteSuccess.description"),
        });
        await refreshFilesWithoutAnimation();
        return true;
      } else {
        toast({
          title: t("kbView.attachmentsManager.deleteError.title"),
          description: t("kbView.attachmentsManager.deleteError.unknown"),
          variant: "destructive",
        });
        throw new Error(t("kbView.attachmentsManager.deleteError.unknown"));
      }
    } catch (error) {
      toast({
        title: t("kbView.attachmentsManager.deleteError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("kbView.attachmentsManager.deleteError.unknown"),
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDownload = async (path: string) => {
    try {
      const res = await fsGetAttachmentSignedUrl({ path });
      if (!res.success) {
        toast({
          title: t("kbView.attachmentsManager.downloadError.title"),
          description: t("kbView.attachmentsManager.downloadError.unknown"),
          variant: "destructive",
        });
        return;
      }

      const signedUrl = res.data.signedUrl;
      const a = document.createElement("a");
      a.href = `${serverUrl.value}${signedUrl}`;
      a.download = path.split("/").pop() ?? path;
      a.click();
    } catch (error) {
      toast({
        title: t("kbView.attachmentsManager.downloadError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("kbView.attachmentsManager.downloadError.unknown"),
        variant: "destructive",
      });
    }
  };

  // 预览文件
  const previewFile = async (path: string) => {
    if (!path) return;

    previewStatus.value = "loading";
    previewError.value = "";

    try {
      const info = await getPreviewInfo(path, serverUrl.value);
      previewingFile.value = createViewingState(info);
      previewStatus.value = "viewing";
    } catch (error) {
      console.error("Error previewing file", error);
      previewStatus.value = "error";
      previewError.value = error instanceof Error ? error.message : "Unknown error";
      previewingFile.value = null;
    }
  };

  return {
    open,
    files,
    refreshFiles,
    attachmentsFolderName,
    fetchFilesStatus,
    uploadStatus,
    currentPathSegments,
    dbBasePath,
    attachmentsBasePath,
    currentFiles,
    activeDirent,
    sortBy,
    fileTypeFilter,
    expandedDirs,
    handleClickItem,
    handleFilterChange,
    handleSortChange,
    toggleDirectory,
    filterResult,
    searchQuery,
    handleUpload,
    handleRename,
    handleDelete,
    handleDownload,
    isText,
    isStaticImage,
    isAnimateImage,
    isAudio,
    isVideo,
    showPreview,
    previewingFile,
    previewStatus,
    previewError,
    previewFile,
    handlePreview,
    viewingAttachment,
  };
});

export default AttachmentsManagerContext;
