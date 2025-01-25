import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { getPlatform } from "@/common/helper-functions/platform";
import { useTaskQueue } from "@/plugins/taskQueue";
import { createContext } from "@/utils/createContext";
import {
  cursorCharLeft,
  cursorCharRight,
  cursorLineDown,
  cursorLineUp,
  deleteCharBackward,
  deleteCharForward,
  indentLess,
  indentMore,
  insertNewlineAndIndent,
} from "@codemirror/commands";
import type { KeyBinding as CmKeyBinding } from "@codemirror/view";
import { EditorView as CmEditorView } from "@codemirror/view";
import { toggleMark } from "prosemirror-commands";
import { AllSelection, EditorState, NodeSelection, TextSelection } from "prosemirror-state";
import { EditorView, EditorView as PmEditorView } from "prosemirror-view";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { base, keyName } from "w3c-keyname";
import BlocksContext from "./blocks/blocks";
import BlockSelectDragContext from "./blockSelect";
import { DI_FILTERS } from "./blockTree";
import CommandsContext from "./commands/commands";
import FusionCommandContext from "./fusionCommand";
import LastFocusContext from "./lastFocus";
import SettingsContext from "./settings";
import SidebarContext from "./sidebar";

export type KeyBinding<P extends Array<any> = any[]> = {
  run: (...params: P) => boolean;
  stopPropagation?: boolean;
  preventDefault?: boolean;
};

const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

// 删除超过 10 个块时，弹出确认框要求用户二次确认
const DELETE_WARN_THRESHOLD = 10;

function normalizeKeyName(name: string) {
  // eslint-disable-next-line prefer-const
  let parts = name.split(/-(?!$)/),
    result = parts[parts.length - 1];
  if (result == "Space") result = " ";
  let alt, ctrl, shift, meta;
  for (let i = 0; i < parts.length - 1; i++) {
    const mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod)) meta = true;
    else if (/^a(lt)?$/i.test(mod)) alt = true;
    else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;
    else if (/^s(hift)?$/i.test(mod)) shift = true;
    else if (/^mod$/i.test(mod)) {
      if (mac) meta = true;
      else ctrl = true;
    } else throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt) result = "Alt-" + result;
  if (ctrl) result = "Ctrl-" + result;
  if (meta) result = "Meta-" + result;
  if (shift) result = "Shift-" + result;
  return result;
}

function normalize(map: { [key: string]: KeyBinding }) {
  const copy: { [key: string]: KeyBinding } = Object.create(null);
  for (const prop in map) copy[normalizeKeyName(prop)] = map[prop];
  return copy;
}

function modifiers(name: string, event: KeyboardEvent, shift = true) {
  if (event.altKey) name = "Alt-" + name;
  if (event.ctrlKey) name = "Ctrl-" + name;
  if (event.metaKey) name = "Meta-" + name;
  if (shift && event.shiftKey) name = "Shift-" + name;
  return name;
}

export function generateKeydownHandler<
  HandlerParamsType extends Array<any> = any[],
  KeyBindingParamsType extends Array<any> = any[],
>(
  bindings: { [key: string]: KeyBinding<KeyBindingParamsType> },
  paramsGenerator: (...params: HandlerParamsType) => KeyBindingParamsType,
  keyboardEventGetter: (...params: HandlerParamsType) => KeyboardEvent,
): (...params: HandlerParamsType) => boolean {
  const map = normalize(bindings);
  return function (...params: HandlerParamsType) {
    // 生成 keyBinding 的参数
    const keyBindingParams = paramsGenerator(...params);
    const event = keyboardEventGetter(...params);
    let baseName;
    const name = keyName(event),
      direct = map[modifiers(name, event)];
    if (direct && direct.run(...keyBindingParams)) {
      direct.stopPropagation && event.stopPropagation();
      direct.preventDefault && event.preventDefault();
      return true;
    }
    // A character key
    if (name.length == 1 && name != " ") {
      if (event.shiftKey) {
        // In case the name was already modified by shift, try looking
        // it up without its shift modifier
        const noShift = map[modifiers(name, event, false)];
        if (noShift && noShift.run(...keyBindingParams)) {
          noShift.stopPropagation && event.stopPropagation();
          noShift.preventDefault && event.preventDefault();
          return true;
        }
      }
      if (
        (event.shiftKey || event.altKey || event.metaKey || name.charCodeAt(0) > 127) &&
        (baseName = base[event.keyCode]) &&
        baseName != name
      ) {
        // Try falling back to the keyCode when there's a modifier
        // active or the character produced isn't ASCII, and our table
        // produces a different name from the the keyCode. See #668,
        // #1060
        const fromCode = map[modifiers(baseName, event)];
        if (fromCode && fromCode.run(...keyBindingParams)) {
          fromCode.stopPropagation && event.stopPropagation();
          fromCode.preventDefault && event.preventDefault();
          return true;
        }
      }
    }
    const wildcard = bindings["*"];
    if (wildcard && wildcard.run(...keyBindingParams)) {
      wildcard.stopPropagation && event.stopPropagation();
      wildcard.preventDefault && event.preventDefault();
      return true;
    }
    return false;
  };
}

export type SimpleKeyBinding = KeyBinding<[KeyboardEvent]>;

export function generateKeydownHandlerSimple(bindings: { [key: string]: SimpleKeyBinding }) {
  return generateKeydownHandler<[KeyboardEvent], [KeyboardEvent]>(
    bindings,
    (event) => [event],
    (event) => event,
  );
}

const KeymapContext = createContext(() => {
  const taskQueue = useTaskQueue();
  const openKeybindings = ref(false);

  const { lastFocusedBlockTree, lastFocusedDiId } = LastFocusContext.useContext()!;
  const { blockEditor, blocksManager } = BlocksContext.useContext()!;
  const { selectedBlockIds } = BlockSelectDragContext.useContext()!;
  const commands = CommandsContext.useContext()!;

  ////////////////////// Ctrl/Shift/Meta 状态 //////////////////////
  const ctrlPressed = ref(false);
  const shiftPressed = ref(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    const platform = getPlatform();
    if (platform === "macos" && event.metaKey) ctrlPressed.value = true;
    if (platform !== "macos" && event.ctrlKey) ctrlPressed.value = true;
    if (event.shiftKey) shiftPressed.value = true;
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const platform = getPlatform();
    if (platform === "macos" && !event.metaKey) ctrlPressed.value = false;
    if (platform !== "macos" && !event.ctrlKey) ctrlPressed.value = false;
    if (!event.shiftKey) shiftPressed.value = false;
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  });

  ////////////////////////////////////////////////////////////

  const prosemirrorKeymap = ref<{ [p: string]: KeyBinding }>({
    "Mod-z": {
      run: () => {
        blocksManager.undo();
        return true;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    "Mod-Shift-z": {
      run: () => {
        blocksManager.redo();
        return true;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    Enter: {
      run: (state: EditorState) => {
        const sel = state.selection;
        const docEnd = AllSelection.atEnd(state.doc);
        if (sel.eq(docEnd)) {
          if (commands.createEmptyTextBlockBelow()()) return true;
          if (commands.createEmptyTextBlockUnder(0)()) return true;
        } else if (sel.head == 0) {
          if (commands.createEmptyTextBlockAbove()()) return true;
        } else {
          if (commands.splitBlockAbove()) return true;
        }
        return false;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    // 插入硬换行
    "Shift-Enter": {
      run: (state: EditorState, dispatch: EditorView["dispatch"]) => {
        const brNode = state.schema.nodes.hardBreak.create();
        const tr = state.tr.replaceSelectionWith(brNode);
        dispatch(tr);
        return true;
      },
      stopPropagation: true,
    },
    Backspace: {
      run: (state, dispatch) => {
        deleteUfeffBeforeCursor(state, dispatch!);
        if (commands.deleteSelected()) return true;
        if (commands.deleteFocusedBlockIfEmpty()) return true;
        if (commands.deleteEmptyBlockAboveIfAtStart()) return true;
        if (commands.mergeAboveIntoCurrent()) return true;
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Delete: {
      run: (state, dispatch) => {
        deleteUfeffAfterCursor(state, dispatch!);
        if (commands.deleteSelected()) return true;
        if (commands.deleteFocusedBlockIfEmpty()) return true;
        if (commands.deleteEmptyBlockBelow()) return true;
        if (commands.mergeCurrentIntoBelow()) return true;
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-ArrowUp": {
      run: commands.foldFocusedBlock,
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-ArrowDown": {
      run: commands.expandFocusedBlock,
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-Shift-ArrowUp": {
      run: commands.foldAll,
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-Shift-ArrowDown": {
      run: commands.expandAll,
      preventDefault: true,
      stopPropagation: true,
    },
    "Alt-ArrowUp": {
      run: () => {
        if (commands.swapUpSelected()) return true;
        if (commands.swapUpFocusedBlock()) return true;
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Alt-ArrowDown": {
      run: () => {
        if (commands.swapDownSelected()) return true;
        if (commands.swapDownFocusedBlock()) return true;
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Tab: {
      run: () => {
        taskQueue.addTask(() => {
          if (commands.promoteSelected()) return;
          if (commands.promoteFocusedBlock()) return;
        });
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Shift-Tab": {
      run: () => {
        taskQueue.addTask(() => {
          if (commands.demoteSelected()) return;
          if (commands.demoteFocusedBlock()) return;
        });
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Shift-ArrowUp": {
      run: () => {
        if (commands.addBlockAboveToSelection()) return true;
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Shift-ArrowDown": {
      run: () => {
        if (commands.addBlockBelowToSelection()) return true;
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    ArrowUp: {
      run: () => {
        const tree = lastFocusedBlockTree.value;
        const diId = lastFocusedDiId.value;
        if (!tree || !diId) return false;

        const view = tree.getEditorView(diId);
        const di = tree.getDi(diId);
        if (!(view instanceof PmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        if (tree && view.endOfTextblock("up")) {
          const oldPos = view.state.selection.anchor;
          const coord = view.coordsAtPos(oldPos);
          const diAbove = tree.getDiAbove(diId, DI_FILTERS.isBlockDi);
          if (!diAbove) return false;
          tree.focusDi(diAbove[0].itemId).then(() => {
            // 调整光标位置
            const newEditorView = tree.getEditorView(diAbove[0].itemId);
            if (!(newEditorView instanceof PmEditorView)) return false;
            const newPos =
              newEditorView.posAtCoords({
                left: coord.left,
                top: coord.top - 10,
              })?.pos ?? oldPos;
            const maxPos = newEditorView.state.doc.content.size;
            const sel = TextSelection.create(newEditorView.state.doc, Math.min(newPos, maxPos));
            const tr = newEditorView.state.tr.setSelection(sel);
            newEditorView.dispatch(tr);
          });

          return true;
        }
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    ArrowDown: {
      run: () => {
        const tree = lastFocusedBlockTree.value;
        const diId = lastFocusedDiId.value;
        if (!tree || !diId) return false;

        const view = tree.getEditorView(diId);
        const di = tree.getDi(diId);
        if (!(view instanceof PmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        if (tree && view.endOfTextblock("down")) {
          const oldPos = view.state.selection.anchor;
          const coord = view.coordsAtPos(oldPos);
          const diBelow = tree.getDiBelow(diId, DI_FILTERS.isBlockDi);
          if (!diBelow) return false;
          tree.focusDi(diBelow[0].itemId).then(() => {
            // 调整光标位置
            const newEditorView = tree.getEditorView(diBelow[0].itemId);
            if (!(newEditorView instanceof PmEditorView)) return false;
            const newPos =
              newEditorView.posAtCoords({
                left: coord.left,
                top: coord.top + 30,
              })?.pos ?? oldPos;
            const maxPos = newEditorView.state.doc.content.size;
            const sel = TextSelection.create(newEditorView.state.doc, Math.min(newPos, maxPos));
            const tr = newEditorView.state.tr.setSelection(sel);
            newEditorView.dispatch(tr);
          });

          return true;
        }
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Alt-m": {
      run: (state, dispatch, view) => {
        if (dispatch == null) return false;
        const schema = view.state.schema;
        const node = schema.nodes.mathInline.create({ src: "" });
        const tr = state.tr.replaceSelectionWith(node);
        const pos = tr.doc.resolve(
          tr.selection.anchor - (tr.selection as any).$anchor.nodeBefore.nodeSize,
        );
        tr.setSelection(new NodeSelection(pos));
        dispatch(tr);
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Alt-Shift-m": {
      run: (state, dispatch, view) => {
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        if (!di || !DI_FILTERS.isBlockDi(di)) return false;
        const empty = state.doc.content.size == 0;

        if (empty) {
          // 将这个空块变为公式块
          taskQueue.addTask(async () => {
            blockEditor.changeBlockContent({
              blockId: di.block.id,
              content: [BLOCK_CONTENT_TYPES.MATH, ""],
            });
            // 聚焦块
            await tree.nextUpdate();
            await tree.focusDi(diId, { scrollIntoView: true });
          });
        } else {
          // 下方插入公式块
          taskQueue.addTask(async () => {
            const pos = blockEditor.normalizePos({
              baseBlockId: di.block.id,
              offset: 1,
            });
            if (pos == null) return;
            blockEditor.insertNormalBlock({ pos, content: [BLOCK_CONTENT_TYPES.MATH, ""] });
            // 聚焦到刚插入的块
            const diBelow = tree.getDiBelow(diId, DI_FILTERS.isBlockDi);
            if (diBelow) {
              await tree.nextUpdate();
              await tree.focusDi(diBelow[0].itemId, { scrollIntoView: true });
            }
          });
        }
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    ArrowLeft: {
      run: (state, dispatch, view) => {
        skipOneUfeffBeforeCursor(state, dispatch!);
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        if (!di || !DI_FILTERS.isBlockDi(di)) return false;

        const atBeg = state.selection.empty && state.selection.anchor == 0;
        if (tree && atBeg) {
          const predDi = tree.getPredecessorDi(diId);
          if (!predDi) return false;
          tree.focusDi(predDi[0].itemId).then(() => {
            tree.moveCursorToTheEnd(predDi[0].itemId);
          });
          return true;
        }
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    ArrowRight: {
      run: (state, dispatch, view) => {
        skipOneUfeffAfterCursor(state, dispatch!);
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        if (!di || !DI_FILTERS.isBlockDi(di)) return false;

        const atEnd = state.selection.empty && state.selection.anchor == state.doc.content.size;
        if (tree && atEnd) {
          const nextDi = tree.getSuccessorDi(diId);
          if (!nextDi) return false;
          tree.focusDi(nextDi[0].itemId).then(() => {
            tree.moveCursorToTheEnd(nextDi[0].itemId);
          });
          return true;
        }
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-b": {
      run: (state, dispatch, view) => {
        const schema = view.state.schema;
        return toggleMark(schema.marks.bold)(state, dispatch, view);
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-i": {
      run: (state, dispatch, view) => {
        const schema = view.state.schema;
        return toggleMark(schema.marks.italic)(state, dispatch, view);
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-`": {
      run: (state, dispatch, view) => {
        const schema = view.state.schema;
        return toggleMark(schema.marks.code)(state, dispatch, view);
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-=": {
      run: (state: EditorState, dispatch: EditorView["dispatch"], view: EditorView) => {
        const schema = view.state.schema;
        toggleMark(schema.marks.highlight, { bg: "bg4" })(state, dispatch, view);
        const sel = view.state.selection;
        const newSel = TextSelection.near(sel.$to);
        dispatch(view.state.tr.setSelection(newSel));
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Escape: {
      run: commands.blurAndSelectCurrentBlock,
      preventDefault: true,
      stopPropagation: true,
    },
  });

  const codemirrorKeymap = ref<{ [p: string]: CmKeyBinding }>({
    ArrowLeft: {
      key: "ArrowLeft",
      run: () => {
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        const view = tree.getEditorView(diId);
        if (!(view instanceof CmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        const sel = view.state.selection;
        if (sel.ranges.length == 1) {
          const range0 = sel.ranges[0];
          // 如果光标在块的开始，则按左方向键聚焦到上一个块
          if (range0.from == range0.to && range0.from == 0) {
            const predDi = tree.getPredecessorDi(diId);
            if (!predDi) return false;
            tree.focusDi(predDi[0].itemId).then(() => {
              tree.moveCursorToTheEnd(predDi[0].itemId);
            });
            return true;
          }
        }
        return cursorCharLeft(view);
      },
      stopPropagation: true,
    },
    ArrowRight: {
      key: "ArrowRight",
      run: () => {
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        const view = tree.getEditorView(diId);
        if (!(view instanceof CmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        const sel = view.state.selection;
        const docLength = view.state.doc.length;
        if (sel.ranges.length == 1) {
          const range0 = sel.ranges[0];
          // 如果光标在块的末尾，则按右方向键聚焦到下一个块
          if (range0.from == range0.to && range0.from == docLength) {
            const succDi = tree.getSuccessorDi(diId);
            if (!succDi) return false;
            tree.focusDi(succDi[0].itemId).then(() => {
              tree.moveCursorToTheEnd(succDi[0].itemId);
            });
            return true;
          }
        }
        return cursorCharRight(view);
      },
      stopPropagation: true,
    },
    ArrowUp: {
      key: "ArrowUp",
      run: () => {
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        const view = tree.getEditorView(diId);
        if (!(view instanceof CmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        const sel = view.state.selection;
        if (sel.ranges.length == 1) {
          const range0 = sel.ranges[0];
          // 如果光标在块的开始，则按上方向键聚焦到上一个块
          if (range0.from == range0.to) {
            const selLine = view.state.doc.lineAt(range0.from).number;
            if (selLine == 1) {
              const diAbove = tree.getDiAbove(diId);
              if (!diAbove) return false;
              tree.focusDi(diAbove[0].itemId).then(() => {
                tree.moveCursorToTheEnd(diAbove[0].itemId);
              });
              return true;
            }
          }
        }
        return cursorLineUp(view);
      },
      stopPropagation: true,
    },
    ArrowDown: {
      key: "ArrowDown",
      run: () => {
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        const view = tree.getEditorView(diId);
        if (!(view instanceof CmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        const lineNumber = view.state.doc.lines;
        const sel = view.state.selection;
        if (sel.ranges.length == 1) {
          const range0 = sel.ranges[0];
          // 如果光标在块的末尾，则按下方向键聚焦到下一个块
          if (range0.from == range0.to) {
            const selLine = view.state.doc.lineAt(range0.from).number;
            if (selLine == lineNumber) {
              const diBelow = tree.getDiBelow(diId);
              if (!diBelow) return false;
              tree.focusDi(diBelow[0].itemId).then(() => {
                tree.moveCursorToBegin(diBelow[0].itemId);
              });
              return true;
            }
          }
        }
        return cursorLineDown(view);
      },
      stopPropagation: true,
    },
    Backspace: {
      key: "Backspace",
      run: () => {
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        const view = tree.getEditorView(diId);
        if (!(view instanceof CmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        // 删除空块
        const docLength = view.state.doc.length;
        if (docLength == 0) {
          const diAbove = tree.getDiAbove(diId);
          taskQueue.addTask(async () => {
            blockEditor.deleteBlock({ blockId: di.block.id });
            if (diAbove) {
              await tree.nextUpdate();
              await tree.focusDi(diAbove[0].itemId);
              tree.moveCursorToTheEnd(diAbove[0].itemId);
            }
          });
          return true;
        }
        return deleteCharBackward(view);
      },
      stopPropagation: true,
    },
    Delete: {
      key: "Delete",
      run: () => {
        const diId = lastFocusedDiId.value;
        const tree = lastFocusedBlockTree.value;
        if (!diId || !tree) return false;

        const di = tree.getDi(diId);
        const view = tree.getEditorView(diId);
        if (!(view instanceof CmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        const docLength = view.state.doc.length;
        if (docLength == 0) {
          const diBelow = tree.getDiBelow(diId);
          taskQueue.addTask(async () => {
            blockEditor.deleteBlock({ blockId: di.block.id });
            if (diBelow) {
              await tree.nextUpdate();
              await tree.focusDi(diBelow[0].itemId);
              tree.moveCursorToBegin(diBelow[0].itemId);
            }
          });
          return true;
        }
        return deleteCharForward(view);
      },
      stopPropagation: true,
    },
    // 失焦，但选中当前块
    Escape: {
      key: "Escape",
      run: commands.blurAndSelectCurrentBlock,
    },
    Tab: {
      key: "Tab",
      run: ({ state, dispatch }) => {
        if (state.selection.ranges.some((r) => !r.empty)) return indentMore({ state, dispatch });
        dispatch(
          state.update(state.replaceSelection("  "), { scrollIntoView: true, userEvent: "input" }),
        );
        return true;
      },
      stopPropagation: true,
    },
    "Shift-Tab": {
      key: "Shift-Tab",
      run: indentLess,
      stopPropagation: true,
    },
    Enter: {
      key: "Enter",
      run: insertNewlineAndIndent,
      stopPropagation: true,
    },
  });

  const globalKeymap = ref<{ [p: string]: SimpleKeyBinding }>({
    "Mod-p": {
      run: commands.openFusionCommandWithCurrentSelection,
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-k": {
      run: commands.addFocusedToSidePane,
      preventDefault: true,
      stopPropagation: true,
    },
    Enter: {
      run: () => {
        if (selectedBlockIds.value && selectedBlockIds.value.topLevelOnly.length > 1) {
          commands.createEmptyTextBlockBelow();
          return true;
        }
        return false;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    Delete: {
      run: commands.deleteSelected,
      stopPropagation: true,
      preventDefault: true,
    },
    Backspace: {
      run: commands.deleteSelected,
      stopPropagation: true,
      preventDefault: true,
    },
    Tab: {
      run: commands.promoteSelected,
      stopPropagation: true,
      preventDefault: true,
    },
    "Shift-Tab": {
      run: commands.demoteSelected,
      stopPropagation: true,
      preventDefault: true,
    },
    "Alt-ArrowUp": {
      run: commands.swapUpSelected,
      stopPropagation: true,
      preventDefault: true,
    },
    "Alt-ArrowDown": {
      run: commands.swapDownSelected,
      stopPropagation: true,
      preventDefault: true,
    },
    "Shift-ArrowDown": {
      run: commands.addBlockBelowToSelection,
      stopPropagation: true,
      preventDefault: true,
    },
    "Shift-ArrowUp": {
      run: commands.addBlockAboveToSelection,
      stopPropagation: true,
      preventDefault: true,
    },
  });

  const getProsemirrorKeybinding = (key: string) => {
    return prosemirrorKeymap.value[key];
  };

  const getCodemirrorKeybinding = (key: string) => {
    return codemirrorKeymap.value[key];
  };

  const getGlobalKeybinding = (key: string) => {
    return globalKeymap.value[key];
  };

  const addProsemirrorKeybinding = (key: string, binding: KeyBinding) => {
    const keybinding = prosemirrorKeymap.value[key];
    if (keybinding) {
      throw new Error(`keybinding ${key} already exists`);
    }
    prosemirrorKeymap.value[key] = binding;
  };

  const addCodemirrorKeybinding = (key: string, binding: CmKeyBinding) => {
    const keybinding = codemirrorKeymap.value[key];
    if (keybinding) {
      throw new Error(`keybinding ${key} already exists`);
    }
    codemirrorKeymap.value[key] = binding;
  };

  const addGlobalKeybinding = (key: string, binding: SimpleKeyBinding) => {
    const keybinding = globalKeymap.value[key];
    if (keybinding) {
      throw new Error(`keybinding ${key} already exists`);
    }
    globalKeymap.value[key] = binding;
  };

  const removeProsemirrorKeybinding = (key: string) => {
    delete prosemirrorKeymap.value[key];
  };

  const removeCodemirrorKeybinding = (key: string) => {
    delete codemirrorKeymap.value[key];
  };

  const removeGlobalKeybinding = (key: string) => {
    delete globalKeymap.value[key];
  };

  const moveProsemirrorKeybinding = (to: string, from?: string, binding?: KeyBinding) => {
    const fromBinding = from ? prosemirrorKeymap.value[from] : undefined;
    const toBinding = prosemirrorKeymap.value[to];
    if (toBinding) {
      throw new Error(`keybinding ${to} already exists`);
    }
    const newBinding = fromBinding ?? binding;
    if (!newBinding) return;
    prosemirrorKeymap.value[to] = newBinding;
    if (from && fromBinding) {
      delete prosemirrorKeymap.value[from];
    }
  };

  const moveCodemirrorKeybinding = (to: string, from?: string, binding?: CmKeyBinding) => {
    const fromBinding = from ? codemirrorKeymap.value[from] : undefined;
    const toBinding = codemirrorKeymap.value[to];
    if (toBinding) {
      throw new Error(`keybinding ${to} already exists`);
    }
    const newBinding = fromBinding ?? binding;
    if (!newBinding) return;
    codemirrorKeymap.value[to] = newBinding;
    if (from && fromBinding) {
      delete codemirrorKeymap.value[from];
    }
  };

  const moveGlobalKeybinding = (to: string, from?: string, binding?: SimpleKeyBinding) => {
    const fromBinding = from ? globalKeymap.value[from] : undefined;
    const toBinding = globalKeymap.value[to];
    if (toBinding) {
      throw new Error(`keybinding ${to} already exists`);
    }
    const newBinding = fromBinding ?? binding;
    if (!newBinding) return;
    globalKeymap.value[to] = newBinding;
    if (from && fromBinding) {
      delete globalKeymap.value[from];
    }
  };

  watch(
    globalKeymap,
    (value, _, onCleanup) => {
      const handler = generateKeydownHandlerSimple(value);
      document.addEventListener("keydown", handler);
      onCleanup(() => {
        document.removeEventListener("keydown", handler);
      });
    },
    { immediate: true },
  );

  // 设置面板

  const ctx = {
    openKeybindings,
    prosemirrorKeymap,
    codemirrorKeymap,
    globalKeymap,
    getProsemirrorKeybinding,
    getCodemirrorKeybinding,
    getGlobalKeybinding,
    addProsemirrorKeybinding,
    addCodemirrorKeybinding,
    addGlobalKeybinding,
    removeProsemirrorKeybinding,
    removeCodemirrorKeybinding,
    removeGlobalKeybinding,
    moveProsemirrorKeybinding,
    moveCodemirrorKeybinding,
    moveGlobalKeybinding,
    ctrlPressed,
    shiftPressed,
  };
  return ctx;
});

// helper functions
const skipOneUfeffAfterCursor = (state: EditorState, dispatch: EditorView["dispatch"]) => {
  if (dispatch == null) return false;
  const sel = state.selection;
  try {
    const charAfter = state.doc.textBetween(sel.from, sel.from + 1);
    if (charAfter == "\ufeff") {
      // console.log('skip \\ufeff')
      const tr = state.tr.setSelection(TextSelection.create(state.doc, sel.from + 1));
      dispatch(tr);
      return true;
    }
  } catch (_) {}
  return false;
};

const skipOneUfeffBeforeCursor = (state: EditorState, dispatch: EditorView["dispatch"]) => {
  if (dispatch == null) return false;
  const sel = state.selection;
  const charBefore = state.doc.textBetween(sel.from - 1, sel.from);
  if (charBefore == "\ufeff") {
    const tr = state.tr.setSelection(TextSelection.create(state.doc, sel.from - 1));
    dispatch(tr);
    return true;
  }
  return false;
};

const deleteUfeffAfterCursor = (state: EditorState, dispatch: EditorView["dispatch"]) => {
  const selection = state.selection;
  try {
    const charAfter = state.doc.textBetween(selection.from, selection.from + 1);
    if (charAfter == "\ufeff") {
      // console.log('skip \\ufeff')
      const tr = state.tr.delete(selection.from, selection.from + 1);
      dispatch(tr);
    }
  } catch (_) {
    /* empty */
  }
};

const deleteUfeffBeforeCursor = (state: EditorState, dispatch: EditorView["dispatch"]) => {
  if (dispatch == null) return false;
  const selection = state.selection;
  const charBefore = state.doc.textBetween(selection.from - 1, selection.from);
  if (charBefore == "\ufeff") {
    const tr = state.tr.delete(selection.from - 1, selection.from);
    dispatch(tr);
  }
};

export default KeymapContext;
