import { type Dirents } from "@/common/type-and-schemas/dirents";
import { type Ref } from "vue";

export type FileTypeFilter = {
  folders: boolean;
  images: boolean;
  documents: boolean;
  audio: boolean;
  video: boolean;
  others: boolean;
};

// 文件类型的扩展名映射
const FILE_TYPE_EXTENSIONS: Record<keyof Omit<FileTypeFilter, "folders" | "others">, string[]> = {
  images: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"],
  documents: [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "md",
    "rtf",
    "csv",
    "json",
    "xml",
  ],
  audio: ["mp3", "wav", "ogg", "m4a", "flac", "aac"],
  video: ["mp4", "webm", "avi", "mov", "wmv", "flv", "mkv", "m4v"],
};

// 判断文件类型
export function getFileType(dirent: Dirents[string]): keyof FileTypeFilter {
  if (dirent.isDirectory) return "folders";

  const extension = dirent.name.split(".").pop()?.toLowerCase() || "";

  for (const [type, extensions] of Object.entries(FILE_TYPE_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return type as keyof FileTypeFilter;
    }
  }

  return "others";
}

// 过滤文件并返回过滤结果
export interface FilterResult {
  files: Dirents[string][];
  // 当前目录下被过滤的直接子文件数量（不包括子目录中的文件）
  filteredCount: number;
  dirFilteredCounts: Map<string, number>;
}

// 过滤文件
export function filterFiles(
  files: Dirents[string][],
  fileTypeFilter: FileTypeFilter,
): FilterResult {
  // 如果所有过滤器都启用或都禁用，显示所有文件
  const allEnabled = Object.values(fileTypeFilter).every((v) => v);
  const allDisabled = Object.values(fileTypeFilter).every((v) => !v);
  if (allEnabled || allDisabled) {
    return {
      files,
      filteredCount: 0,
      dirFilteredCounts: new Map(),
    };
  }

  const dirFilteredCounts = new Map<string, number>();

  // 递归过滤文件夹内容
  const processFiles = (items: Dirents[string][]): Dirents[string][] => {
    return items
      .map((dirent) => {
        if (dirent.isDirectory && dirent.subDirents) {
          // 计算当前目录下被过滤的直接子文件数量（不包括子目录）
          const directChildren = Object.values(dirent.subDirents);
          const filteredDirectChildren = directChildren.filter((child) => {
            if (child.isDirectory) return true; // 目录始终保留
            const type = getFileType(child);
            return fileTypeFilter[type];
          });

          const dirFilteredCount =
            directChildren.filter((child) => !child.isDirectory).length -
            filteredDirectChildren.filter((child) => !child.isDirectory).length;

          if (dirFilteredCount > 0) {
            dirFilteredCounts.set(dirent.name, dirFilteredCount);
          }

          // 递归处理子目录
          const filteredSubDirents = processFiles(Object.values(dirent.subDirents));
          return {
            ...dirent,
            subDirents: Object.fromEntries(filteredSubDirents.map((d) => [d.name, d])),
          };
        }
        return dirent;
      })
      .filter((dirent) => {
        const type = getFileType(dirent);
        const shouldKeep = fileTypeFilter[type];
        return shouldKeep;
      });
  };

  // 计算根目录下被类型过滤掉的文件数量
  const rootFilteredCount = files.filter((file) => {
    if (file.isDirectory) return false;
    const type = getFileType(file);
    return !fileTypeFilter[type];
  }).length;

  const filteredFiles = processFiles(files);
  return {
    files: filteredFiles,
    filteredCount: rootFilteredCount,
    dirFilteredCounts,
  };
}
