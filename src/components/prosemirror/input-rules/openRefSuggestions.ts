import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { InputRule } from "prosemirror-inputrules";
import type { EditorView } from "prosemirror-view";
import { pmSchema } from "../pmSchema";
export const openRefSuggestions = (getEditorView: () => EditorView | null) =>
  new InputRule(/([#@])$/, (state, match) => {
    const view = getEditorView();
    if (!view) return null;

    const cursorPos = view.state.selection.from;
    const coord = view.coordsAtPos(cursorPos);
    if (!coord) return null;
    const showPos = {
      x: coord.left,
      y: coord.top,
    };

    const callback = (blockId: BlockId | null) => {
      if (blockId) {
        const tag = match[1] == "#";
        const node = pmSchema.nodes.blockRef_v2.create({
          toBlockId: blockId,
          tag,
        });
        const cursorPos = view.state.selection.anchor;
        const tr = view.state.tr.replaceRangeWith(cursorPos - match[1].length, cursorPos, node);
        view.dispatch(tr);
      }
      setTimeout(() => view.focus(), 50); // 重新聚焦
    };

    const { openRefSuggestions } = globalThis.getRefSuggestionsContext() ?? {};
    openRefSuggestions?.(showPos, callback);

    return null;
  });
