import { EditorView } from "@codemirror/view";
import { Decoration, type DecorationSet } from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";
import { removeDiacritics } from "@/utils/tokenize";

const updateHighlightTermsEffect = StateEffect.define<{
  ranges: { from: number; to: number }[];
}>();

const highlightMark = Decoration.mark({ class: "highlight-keep" });

const highlighted = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (value, tr) => {
    for (const e of tr.effects) {
      // cond1. highlightTerms changed
      if (e.is(updateHighlightTermsEffect)) {
        // delete all decorations
        value = value.update({
          filter: () => false,
        });
        // add new decorations
        value = value.update({
          add: e.value.ranges.map(({ from, to }) => highlightMark.range(from, to)),
        });
        break;
      }
    }
    // cond2. highlightTerms doesn't change
    value = value.map(tr.changes);
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const updateHighlightTerms = (
  highlightTerms: string[],
  view: EditorView,
  ignoreDiacritics?: boolean,
) => {
  let ranges: { from: number; to: number }[] = [];
  for (const { from, to } of view.visibleRanges) {
    let index;
    const str = ignoreDiacritics
      ? removeDiacritics(view.state.doc.sliceString(from, to).toLowerCase())
      : view.state.doc.sliceString(from, to).toLowerCase();
    for (const term of highlightTerms) {
      index = -1;
      while ((index = str.indexOf(term, index + 1)) != -1) {
        ranges.push({
          from: from + index,
          to: from + index + term.length,
        });
      }
    }
  }
  ranges = ranges.sort((r1, r2) => r1.from - r2.from);
  const effects: StateEffect<unknown>[] = [];
  if (!view.state.field(highlighted, false)) {
    effects.push(StateEffect.appendConfig.of(highlighted));
  }
  effects.push(updateHighlightTermsEffect.of({ ranges }));
  view.dispatch({ effects });
  return true;
};
