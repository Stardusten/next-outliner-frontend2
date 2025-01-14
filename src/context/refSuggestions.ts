import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { createContext } from "@/utils/createContext";
import { computed, ref, type ShallowRef } from "vue";
import BlocksContext from "./blocks/blocks";
import { useDebounceFn } from "@vueuse/core";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { Block } from "./blocks/view-layer/blocksManager";
import IndexContext from ".";
import AttachmentsManagerContext from "./attachmentsManager";
import { type Dirents } from "@/common/type-and-schemas/dirents";
import { useTaskQueue } from "@/plugins/taskQueue";
import BacklinksContext from "./backlinks";
import LastFocusContext from "./lastFocus";
import { EditorView as PmEditorView } from "prosemirror-view";
import { plainTextToTextContent } from "@/utils/pm";

export type SuggestionItem =
  | { type: "block"; block: Block }
  | { type: "createNew" }
  | { type: "file"; file: Dirents[string]; path: string }
  | { type: "nothing" };

const RefSuggestionsContext = createContext(() => {
  const { blocksManager, blockEditor } = BlocksContext.useContext()!;
  const { search } = IndexContext.useContext()!;
  const { files } = AttachmentsManagerContext.useContext()!;
  const { putNewBlockAt } = BacklinksContext.useContext()!;
  const { lastFocusedBlockTree, lastFocusedDiId } = LastFocusContext.useContext()!;

  const showPos = ref<{ x: number; y: number } | null>(null);
  const open = computed({
    get: () => showPos.value !== null,
    set: (val) => !val && (showPos.value = null),
  });
  const query = ref<string>("");
  // callbacks
  let onSelectBlock: ((blockId: BlockId) => void) | null = null;
  let onSelectFile: ((file: Dirents[string], path: string) => void) | null = null;
  let onSelectCreateNew: ((query: string) => void) | null = null;
  let onSelectNothing: (() => void) | null = null;
  const focusItemIndex = ref<number>(0);
  const suggestions = ref<SuggestionItem[]>([]);
  const suppressMouseOver = ref(false);
  // 选项
  const allowFileRef = ref(false); // 是否允许文件引用
  const allowCreateNew = ref(false); // 是否允许创建新块

  const updateSuggestions = useDebounceFn(() => {
    const newSuggestions: SuggestionItem[] = [];

    if (query.value && query.value.trim().length > 0) {
      if (query.value.startsWith("/") && allowFileRef.value) {
        const searchQuery = query.value.slice(1);
        const searchFiles = (files: Dirents, parentPath = ""): void => {
          Object.entries(files).forEach(([name, file]) => {
            const fullPath = parentPath ? `${parentPath}/${name}` : name;
            if (fullPath.toLowerCase().includes(searchQuery.toLowerCase())) {
              newSuggestions.push({
                type: "file",
                file,
                path: fullPath,
              });
            }
            if (file.isDirectory && file.subDirents) {
              searchFiles(file.subDirents, fullPath);
            }
          });
        };
        searchFiles(files.value);
      } else {
        const result = search(query.value);
        result
          .slice(0, 100)
          .map((id) => blocksManager.getBlock(id as string))
          .filter((block) => block != null && block.content[0] === BLOCK_CONTENT_TYPES.TEXT)
          .forEach((block) => {
            newSuggestions.push({ type: "block", block: block! });
          });
      }
    }

    if (allowCreateNew.value && query.value.trim().length > 0 && !query.value.startsWith("/")) {
      newSuggestions.push({ type: "createNew" });
    }

    suggestions.value = newSuggestions;
    focusItemIndex.value = 0;
  }, 500);

  const withScrollSuppressed = (fn: () => boolean, timeout = 500) => {
    suppressMouseOver.value = true;
    setTimeout(() => (suppressMouseOver.value = false), timeout);
    return fn();
  };

  const handleCreateNew = (query: string) => {
    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      const tree = lastFocusedBlockTree.value;
      const diId = lastFocusedDiId.value;
      if (!tree || !diId) return;
      const view = tree.getEditorView(diId);
      if (!(view instanceof PmEditorView)) return;
      const schema = view.state.schema;
      // 在指定位置创建新块
      const parentId = putNewBlockAt.value === "" ? "root" : putNewBlockAt.value;
      const { newNormalBlockId } =
        blockEditor.insertNormalBlock({
          content: plainTextToTextContent(query, schema),
          pos: {
            parentId,
            childIndex: "last-space",
          },
        }) ?? {};
      if (!newNormalBlockId) return;
      // 当前光标位置插入到新块的块引用
      const node = schema.nodes.blockRef_v2.create({ toBlockId: newNormalBlockId, tag: false });
      const cursorPos = view.state.selection.anchor;
      const tr = view.state.tr.replaceRangeWith(cursorPos - 1, cursorPos, node);
      view.dispatch(tr);
      // 关闭弹窗
      open.value = false;
      // 重新聚焦
      setTimeout(() => view.focus(), 50);
    });
  };

  const openRefSuggestions = (params: {
    showPos: { x: number; y: number };
    initQuery?: string;
    allowCreateNew?: boolean;
    allowFileRef?: boolean;
    onSelectCreateNew?: (query: string) => void;
    onSelectFile?: (file: Dirents[string], path: string) => void;
    onSelectBlock?: (blockId: BlockId) => void;
    onSelectNothing?: () => void;
  }) => {
    onSelectCreateNew = params.onSelectCreateNew ?? handleCreateNew;
    onSelectFile = params.onSelectFile ?? (() => {});
    onSelectBlock = params.onSelectBlock ?? (() => {});
    onSelectNothing = params.onSelectNothing ?? (() => {});
    query.value = params.initQuery ?? "";
    suggestions.value = [];
    allowCreateNew.value = params.allowCreateNew ?? false;
    allowFileRef.value = params.allowFileRef ?? false;
    updateSuggestions();
    showPos.value = params.showPos;
  };

  const handleSelectItem = (item: SuggestionItem) => {
    if (item.type === "block") {
      onSelectBlock?.(item.block.id);
    } else if (item.type === "file") {
      onSelectFile?.(item.file, item.path);
    } else if (item.type === "createNew") {
      onSelectCreateNew?.(query.value);
    } else if (item.type === "nothing") {
      onSelectNothing?.();
    }
  };

  const close = () => {
    open.value = false;
    query.value = "";
    suggestions.value = [];
  };

  const ctx = {
    showPos,
    open,
    query,
    focusItemIndex,
    suggestions,
    suppressMouseOver,
    allowFileRef,
    updateSuggestions,
    withScrollSuppressed,
    openRefSuggestions,
    handleSelectItem,
    close,
  };
  return ctx;
});

export default RefSuggestionsContext;
