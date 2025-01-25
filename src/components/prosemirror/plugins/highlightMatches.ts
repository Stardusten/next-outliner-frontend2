import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { PmPluginCtx } from "./pluginContext";
import { removeDiacritics } from "@/utils/tokenize";

export const mkHighlightMatchesPlugin = (
  ctx: PmPluginCtx,
  highlightClass: string = "highlight-keep",
  ignoreDiacritics?: boolean,
) =>
  new Plugin({
    props: {
      decorations: (state) => {
        const terms = ctx.getHighlightTerms();
        if (!terms || terms.length == 0) return null;
        let index;
        const decorations: Decoration[] = [];
        state.doc.content.descendants((node, pos) => {
          if (!node.isText) return false;
          const str = ignoreDiacritics
            ? removeDiacritics(node.textContent.toLocaleLowerCase())
            : node.textContent.toLowerCase();
          for (const term of terms) {
            index = -1;
            while ((index = str.indexOf(term, index + 1)) != -1) {
              const d = Decoration.inline(pos + index, pos + index + term.length, {
                class: highlightClass,
              });
              decorations.push(d);
            }
          }
        });
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
