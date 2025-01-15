import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type BlocksContext from "@/context/blocks/blocks";
import type { BlockTree } from "@/context/blockTree";
import type BlockTreeContext from "@/context/blockTree";
import type CommandsContext from "@/context/commands/commands";
import type HistoryContext from "@/context/history";
import type ImagesContext from "@/context/images";
import type KeymapContext from "@/context/keymap";
import type LastFocusContext from "@/context/lastFocus";
import type PasteDialogContext from "@/context/pasteDialog";
import type PathsContext from "@/context/paths";
import type RefSuggestionsContext from "@/context/refSuggestions";
import type { DisplayItemId } from "@/utils/display-item";
import type { Schema } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

export type PmPluginCtx = {
  getReadonly: () => boolean;
  getEditorView: () => EditorView;
  getHighlightTerms: () => string[];
  getHighlightRefs: () => BlockId[];
  // 下面的属性都可能为空，因为如果一个 ProseMirror 组件
  // 没有在 BlockTree 里，则这些属性都为空
  getBlockTree: () => BlockTree | null;
  getItemId: () => DisplayItemId | null;
  getSchema: () => Schema;
  imagesContext: ReturnType<typeof ImagesContext.useContext>;
  pathsContext: ReturnType<typeof PathsContext.useContext>;
  lastFocusContext: ReturnType<typeof LastFocusContext.useContext>;
  historyContext: ReturnType<typeof HistoryContext.useContext>;
  blockTreeContext: ReturnType<typeof BlockTreeContext.useContext>;
  blocksContext: ReturnType<typeof BlocksContext.useContext>;
  refSuggestionsContext: ReturnType<typeof RefSuggestionsContext.useContext>;
  keymapContext: ReturnType<typeof KeymapContext.useContext>;
  pasteDialogContext: ReturnType<typeof PasteDialogContext.useContext>;
  commandsContext: ReturnType<typeof CommandsContext.useContext>;
};
