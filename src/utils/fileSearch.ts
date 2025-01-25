import { type Dirents } from "@/common/type-and-schemas/dirents";
import { hybridTokenize } from "./tokenize";

export interface SearchResult {
  files: Dirents[string][];
  // 根目录下被搜索过滤掉的文件数量
  filteredCount: number;
  // 每个目录下被搜索过滤掉的文件数量
  dirFilteredCounts: Map<string, number>;
}

export function searchFiles(
  files: Dirents[string][],
  query: string,
  options: {
    includeDirectories?: boolean;
    ignoreDiacritics?: boolean;
  } = {},
): SearchResult {
  if (!query || query.trim().length === 0) {
    return {
      files,
      filteredCount: 0,
      dirFilteredCounts: new Map(),
    };
  }

  const searchTerms =
    hybridTokenize(query, {
      caseSensitive: false,
      cjkNGram: 1,
      includePrefix: false,
      removeDiacritics: options.ignoreDiacritics ?? true,
    }) ?? [];
  if (searchTerms.length === 0) {
    return {
      files,
      filteredCount: 0,
      dirFilteredCounts: new Map(),
    };
  }

  const dirFilteredCounts = new Map<string, number>();

  // 递归搜索文件和目录
  const searchInItems = (items: Dirents[string][]): Dirents[string][] => {
    return items.filter((item) => {
      // 如果是目录且有子项，递归搜索
      if (item.isDirectory && item.subDirents) {
        const directChildren = Object.values(item.subDirents);
        const matchedSubDirents = searchInItems(directChildren);

        // 计算当前目录下被过滤掉的直接子文件数量
        const dirFilteredCount =
          directChildren.filter((child) => !child.isDirectory).length -
          matchedSubDirents.filter((child) => !child.isDirectory).length;

        if (dirFilteredCount > 0) {
          dirFilteredCounts.set(item.name, dirFilteredCount);
        }

        // 如果子项有匹配或目录名匹配，保留该目录
        if (matchedSubDirents.length > 0 || matchFileName(item.name, searchTerms)) {
          item.subDirents = Object.fromEntries(matchedSubDirents.map((d) => [d.name, d]));
          return true;
        }
        // 如果设置了包含目录且目录名匹配，保留该目录
        return options.includeDirectories && matchFileName(item.name, searchTerms);
      }

      // 文件名匹配
      return matchFileName(item.name, searchTerms);
    });
  };

  // 计算根目录下被过滤掉的文件数量
  const rootFilteredCount =
    files.filter((file) => !file.isDirectory).length -
    searchInItems(files).filter((file) => !file.isDirectory).length;

  const searchedFiles = searchInItems(files);
  return {
    files: searchedFiles,
    filteredCount: rootFilteredCount,
    dirFilteredCounts,
  };
}

// 检查文件名是否匹配搜索词
function matchFileName(filename: string, searchTerms: string[]): boolean {
  const normalizedName = filename.toLowerCase();
  return searchTerms.every((term) => normalizedName.includes(term.toLowerCase()));
}
