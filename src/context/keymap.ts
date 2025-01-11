import { createContext } from "@/utils/createContext";
import { EditorView, EditorView as PmEditorView } from "prosemirror-view";
import { base, keyName } from "w3c-keyname";
import type { KeyBinding as CmKeyBinding } from "@codemirror/view";
import { AllSelection, EditorState, NodeSelection, TextSelection } from "prosemirror-state";
import { plainTextToTextContent } from "@/utils/pm";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { Node } from "prosemirror-model";
import { getPmSchema } from "@/components/prosemirror/pmSchema";
import { toggleMark } from "prosemirror-commands";
import { useTaskQueue } from "@/plugins/taskQueue";
import LastFocusContext from "./lastFocus";
import BlocksContext from "./blocks/blocks";
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
import { watch, ref } from "vue";
import SettingsContext from "./settings";
import { DI_FILTERS } from "./blockTree";
import { EditorView as CmEditorView } from "@codemirror/view";
import FusionCommandContext from "./fusionCommand";
import SidebarContext from "./sidebar";
import BlockSelectDragContext from "./blockSelect";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type { BlocksManager } from "./blocks/view-layer/blocksManager";

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

// const canPromote = (blockId: BlockId, blocksManager: BlocksManager) => {
//   const block = blocksManager.getBlock(blockId);
//   if (!block) return false;
//   const parentBlock = block.parentRef.value;
//   if (!parentBlock) return false;
//   const index = parentBlock.childrenIds.indexOf(blockId);
//   return index > 0;
// }

// const canDemote = (blockId: BlockId, blocksManager: BlocksManager) => {
//   return true; // TODO
// }

const KeymapContext = createContext(() => {
  const taskQueue = useTaskQueue();
  const { lastFocusedBlockTree, lastFocusedDiId } = LastFocusContext.useContext()!;
  const { blockEditor, blocksManager } = BlocksContext.useContext()!;
  const { registerSettingGroup } = SettingsContext.useContext()!;
  const openKeybindings = ref(false);
  const { openFusionCommand } = FusionCommandContext.useContext()!;
  const { addToSidePane } = SidebarContext.useContext()!;
  const { selectedBlockIds } = BlockSelectDragContext.useContext()!;

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
      run: () => {
        taskQueue.addTask(async () => {
          const tree = lastFocusedBlockTree.value;
          const diId = lastFocusedDiId.value;
          if (!tree || !diId) return;

          const view = tree.getEditorView(diId);
          const di = tree.getDi(diId);
          if (!(view instanceof PmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return;

          const sel = view.state.selection;
          const schema = view.state.schema;
          const docEnd = AllSelection.atEnd(view.state.doc);
          const onRoot = tree.getRootBlockIds().includes(di.block.id);

          // 1. 在块末尾按 Enter，则在下方创建空块
          if (sel.eq(docEnd)) {
            const pos = onRoot
              ? blockEditor.normalizePos({
                  parentId: di.block.id,
                  childIndex: "last-space",
                })
              : blockEditor.normalizePos({
                  baseBlockId: di.block.id,
                  offset: 1,
                });
            if (!pos) return;
            // (document.activeElement as HTMLElement).blur(); // 操作前先失去焦点，防止闪烁
            const { newNormalBlockId } =
              blockEditor.insertNormalBlock({
                pos,
                content: plainTextToTextContent("", schema),
              }) ?? {};
            if (tree && newNormalBlockId) {
              await tree.nextUpdate();
              const nextDi = tree.getDiBelow(
                diId,
                (di) => DI_FILTERS.isBlockDi(di) && di.block.id === newNormalBlockId,
              );
              nextDi && (await tree.focusDi(nextDi[0].itemId));
            }
          } else if (sel.head == 0) {
            // 2. 在块开头按 Enter，则在上方创建空块
            if (onRoot) return; // 不处理根块的情况
            const pos = blockEditor.normalizePos({
              baseBlockId: di.block.id,
              offset: 0,
            });
            if (!pos) return;
            (document.activeElement as HTMLElement).blur(); // 操作前先失去焦点，防止闪烁
            const { newNormalBlockId } =
              blockEditor.insertNormalBlock({
                pos,
                content: plainTextToTextContent("", schema),
              }) ?? {};
            if (tree && newNormalBlockId) {
              await tree.nextUpdate();
              const nextDi = tree.getDiAbove(
                diId,
                (di) => DI_FILTERS.isBlockDi(di) && di.block.id === newNormalBlockId,
              );
              nextDi && (await tree.focusDi(nextDi[0].itemId));
            }
          } else {
            // 3. 中间按 Enter，上面创建一个新块，将光标左边的内容挪到新块中
            if (onRoot) return; // 不处理根块的情况
            const curSel = view.state.selection;
            const docAbove = view.state.doc.cut(0, curSel.anchor);
            const newThisDoc = view.state.doc.cut(curSel.anchor);
            // 删去挪移到新块中的内容
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            blockEditor.changeBlockContent({
              blockId: di.block.id,
              content: [BLOCK_CONTENT_TYPES.TEXT, newThisDoc.toJSON()],
              tr,
              commit: false,
            });
            // 上方插入块
            const pos = blockEditor.normalizePos({
              baseBlockId: di.block.id,
              offset: 0,
            });
            if (!pos) return;
            blockEditor.insertNormalBlock({
              pos,
              content: [BLOCK_CONTENT_TYPES.TEXT, docAbove.toJSON()],
              tr,
              commit: false,
            });
            (document.activeElement as HTMLElement).blur(); // 操作前先失去焦点，防止闪烁
            tr.commit();

            if (tree) {
              await tree.nextUpdate();
              await tree.focusDi(di.itemId);
              tree.moveCursorToBegin(di.itemId); // 将光标移至开头
            }
          }
        });
        return true;
      },
      stopPropagation: true,
    },
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

        taskQueue.addTask(async () => {
          const tree = lastFocusedBlockTree.value;
          const diId = lastFocusedDiId.value;
          if (!tree || !diId) return;

          const view = tree.getEditorView(diId);
          const di = tree.getDi(diId);
          if (!(view instanceof PmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return;

          // 选中了多个块，则删除选中的所有块
          // TODO：如果上一个 di 也被删了怎么办？这是可能的，比如上一个块是被删除的块的镜像块
          if (selectedBlockIds.value.topLevelOnly.length > 1) {
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            for (const blockId of selectedBlockIds.value.topLevelOnly) {
              blockEditor.deleteBlock({ blockId, tr, commit: false });
            }
            tr.commit();
            return;
          }

          const diAbove = tree.getDiAbove(diId, DI_FILTERS.isBlockDi);
          const diBelow = tree.getDiBelow(diId, DI_FILTERS.isBlockDi);
          const focusNext = diAbove?.[0].itemId || diBelow?.[0].itemId;

          const sel = view.state.selection;
          const schema = view.state.schema;
          // 1. 如果选中了东西，则执行默认逻辑（删除选区）
          if (!sel.empty) return;

          // 2. 当前块为空，直接删掉这个块
          if (view.state.doc.content.size == 0) {
            (document.activeElement as HTMLElement).blur(); // 操作前先失去焦点，防止闪烁
            blockEditor.deleteBlock({ blockId: di.block.id });
            if (focusNext && tree) {
              await tree.nextUpdate();
              await tree.focusDi(focusNext);
              tree.moveCursorToTheEnd(focusNext); // 删掉这个块后，将光标移至 focusNext 末尾
            }
            return;
          } else if (sel.from == 0 && diAbove) {
            // 3. 尝试将这个块与上一个块合并
            // 仅当上一个块也是文本块，与自己同级，并且没有孩子时允许合并
            if (DI_FILTERS.isBlockDi(diAbove[0])) {
              const blockAbove = diAbove[0].block;
              if (
                blockAbove.content[0] != BLOCK_CONTENT_TYPES.TEXT ||
                blockAbove.childrenIds.length > 0 ||
                di.block.parentId != blockAbove.parentId
              )
                return;
              if (blockAbove.content[0] != BLOCK_CONTENT_TYPES.TEXT) return;

              (document.activeElement as HTMLElement).blur(); // 操作前先失去焦点，防止闪烁
              const aboveDoc = Node.fromJSON(schema, blockAbove.content[1]);
              const thisDoc = view.state.doc;
              const newThisContent = aboveDoc.content.append(thisDoc.content);
              const newThisDoc = schema.nodes.doc.create(null, newThisContent);
              const tr = blocksManager.createBlockTransaction({ type: "ui" });
              blockEditor.changeBlockContent({
                blockId: di.block.id,
                content: [BLOCK_CONTENT_TYPES.TEXT, newThisDoc.toJSON()],
                tr,
                commit: false,
              });
              blockEditor.deleteBlock({ blockId: blockAbove.id, tr, commit: false });
              tr.commit();
              if (tree) {
                await tree.nextUpdate();
                // 将光标移至正确位置
                const view = tree.getEditorView(di.itemId);
                if (view instanceof PmEditorView) {
                  const sel = TextSelection.create(view.state.doc, aboveDoc.content.size);
                  const tr = view.state.tr.setSelection(sel);
                  view.dispatch(tr);
                  view.focus();
                }
              }
            }
            return;
          }
        });
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Delete: {
      run: (state, dispatch) => {
        deleteUfeffAfterCursor(state, dispatch!);

        const tree = lastFocusedBlockTree.value;
        const diId = lastFocusedDiId.value;
        if (!tree || !diId) return false;

        const view = tree.getEditorView(diId);
        const di = tree.getDi(diId);
        if (!(view instanceof PmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;

        const schema = view.state.schema;

        // 选中了多个块，则删除选中的所有块
        // 然后聚焦到上一个 di
        // TODO：如果上一个 di 也被删了怎么办？这是可能的，比如上一个块是被删除的块的镜像块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            for (const blockId of selectedBlockIds.value.topLevelOnly) {
              blockEditor.deleteBlock({ blockId, tr, commit: false });
            }
            tr.commit();
          });
          return true;
        }

        const diAbove = tree.getDiAbove(diId, DI_FILTERS.isBlockDi);
        const diBelow = tree.getDiBelow(diId, DI_FILTERS.isBlockDi);
        const focusNext = diBelow?.[0].itemId || diAbove?.[0].itemId;

        const sel = view.state.selection;
        const docEnd = AllSelection.atEnd(view.state.doc);
        // 1. 如果选中了东西，则执行默认逻辑（删除选区）
        if (!sel.empty) return false;

        // 2. 当前块为空，直接删掉这个块
        if (view.state.doc.content.size == 0) {
          taskQueue.addTask(async () => {
            blockEditor.deleteBlock({ blockId: di.block.id });
            if (focusNext && tree) {
              await tree.nextUpdate();
              await tree.focusDi(focusNext);
            }
          });
          return true;
        } else if (sel.eq(docEnd) && diBelow && DI_FILTERS.isBlockDi(diBelow[0])) {
          // 3. 如果下一个块是空块，则直接删除下一个块
          const blockBelow = diBelow[0].block;
          if (blockBelow.content[0] === BLOCK_CONTENT_TYPES.TEXT) {
            const belowDoc = Node.fromJSON(schema, blockBelow.content[1]);
            if (belowDoc.content.size === 0) {
              taskQueue.addTask(async () => {
                blockEditor.deleteBlock({ blockId: blockBelow.id });
              });
              return true;
            }
          }
          // 4. 尝试将这个块与下一个块合并
          // 当下一个块也是文本块，与自己同级，并且自己没有孩子时允许合并
          if (
            blockBelow.content[0] !== BLOCK_CONTENT_TYPES.TEXT ||
            di.block.childrenIds.length > 0 ||
            di.block.parentId !== blockBelow.parentId
          )
            return false;
          taskQueue.addTask(async () => {
            if (blockBelow.content[0] !== BLOCK_CONTENT_TYPES.TEXT) return;
            const belowDoc = Node.fromJSON(schema, blockBelow.content[1]);
            const thisDoc = view.state.doc;
            const newBelowContent = thisDoc.content.append(belowDoc.content);
            const newBelowDoc = schema.nodes.doc.create(null, newBelowContent);
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            blockEditor.changeBlockContent({
              blockId: blockBelow.id,
              content: [BLOCK_CONTENT_TYPES.TEXT, newBelowDoc.toJSON()],
              tr,
              commit: false,
            });
            blockEditor.deleteBlock({ blockId: di.block.id, tr, commit: false });
            tr.commit();
            if (tree) {
              await tree.nextUpdate();
              await tree.focusDi(diBelow[0].itemId);
              // 将光标移至正确位置
              const view = tree.getEditorView(diBelow[0].itemId);
              if (view instanceof PmEditorView) {
                const sel = TextSelection.create(view.state.doc, thisDoc.content.size);
                const tr = view.state.tr.setSelection(sel);
                view.dispatch(tr);
              }
            }
          });
          return true;
        }
        return false;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-ArrowUp": {
      run: () => {
        taskQueue.addTask(async () => {
          const diId = lastFocusedDiId.value;
          const tree = lastFocusedBlockTree.value;
          if (!diId || !tree) return;

          const di = tree.getDi(diId);
          if (di?.type === "basic-block") {
            await blockEditor.toggleFold(di.block.id, true);
          } // what about other types?
        });
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-ArrowDown": {
      run: () => {
        taskQueue.addTask(async () => {
          const diId = lastFocusedDiId.value;
          const tree = lastFocusedBlockTree.value;
          if (!diId || !tree) return;

          const di = tree.getDi(diId);
          if (di?.type === "basic-block") {
            await blockEditor.toggleFold(di.block.id, false);
          } // what about other types?
        });
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Alt-ArrowUp": {
      run: () => {
        // 1. 如果选中了多个块，则上移所有选中的所有块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const pos = {
              baseBlockId: selectedBlockIds.value.topLevelOnly[0],
              offset: -1,
            };
            blockEditor.moveBlocks({
              blockIds: selectedBlockIds.value.topLevelOnly,
              pos,
            });
          });
          return true;
        }

        // 2. 上移聚焦的块
        taskQueue.addTask(async () => {
          const diId = lastFocusedDiId.value;
          const tree = lastFocusedBlockTree.value;
          if (!diId || !tree) return;

          const di = tree.getDi(diId);
          if (!di || !DI_FILTERS.isBlockDi(di)) return;

          const pos = {
            baseBlockId: di.block.id,
            offset: -1,
          };
          blockEditor.moveBlock({ blockId: di.block.id, pos });

          await tree.nextUpdate();
          await tree.focusDi(diId);
        });
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Alt-ArrowDown": {
      run: () => {
        // 1. 如果选中了多个块，则下移所有选中的所有块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const selected = selectedBlockIds.value.topLevelOnly;
            const pos = {
              baseBlockId: selected[selected.length - 1],
              offset: 2,
            };
            blockEditor.moveBlocks({
              blockIds: selected,
              pos,
            });
          });
          return true;
        }

        // 2. 下移聚焦的块
        taskQueue.addTask(async () => {
          const diId = lastFocusedDiId.value;
          const tree = lastFocusedBlockTree.value;
          if (!diId || !tree) return;

          const di = tree.getDi(diId);
          if (!di || !DI_FILTERS.isBlockDi(di)) return;

          const pos = blockEditor.normalizePos({
            baseBlockId: di.block.id,
            offset: 2,
          });
          if (!pos) return;
          blockEditor.moveBlock({ blockId: di.block.id, pos });

          await tree.nextUpdate();
          await tree.focusDi(diId);
        });
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Tab: {
      run: () => {
        // 1. 如果选中了多个块，则缩进所有选中的所有块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            for (const blockId of selectedBlockIds.value.topLevelOnly) {
              const res = blockEditor.promoteBlock({ blockId, tr, commit: false });
              if (!res.success) return;
            }
            tr.commit();
          });
          return true;
        }

        // 2. 缩进聚焦的块
        taskQueue.addTask(async () => {
          const diId = lastFocusedDiId.value;
          const tree = lastFocusedBlockTree.value;
          if (!diId || !tree) return;

          const di = tree.getDi(diId);
          if (!di || !DI_FILTERS.isBlockDi(di)) return;

          const res = blockEditor.promoteBlock({ blockId: di.block.id });
          if (!res.success) return;

          await tree.nextUpdate();
          await tree.focusDi(diId);
        });
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Shift-Tab": {
      run: () => {
        // 1. 如果选中了多个块，则反缩进所有选中的所有块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            for (const blockId of selectedBlockIds.value.topLevelOnly) {
              const res = blockEditor.demoteBlock({ blockId, tr, commit: false });
              if (!res.success) return;
            }
            tr.commit();
          });
          return true;
        }

        // 2. 反缩进聚焦的块
        taskQueue.addTask(async () => {
          const diId = lastFocusedDiId.value;
          const tree = lastFocusedBlockTree.value;
          if (!diId || !tree) return;

          const di = tree.getDi(diId);
          if (!di || !DI_FILTERS.isBlockDi(di)) return;

          const res = blockEditor.demoteBlock({ blockId: di.block.id });
          if (!res.success) return;

          await tree.nextUpdate();
          await tree.focusDi(diId);
        });
        return true;
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
    Tab: {
      key: "Tab",
      run: (view) => {
        return indentMore(view);
      },
      stopPropagation: true,
    },
    "Shift-Tab": {
      key: "Shift-Tab",
      run: (view) => {
        return indentLess(view);
      },
      stopPropagation: true,
    },
    Enter: {
      key: "Enter",
      run: (view) => {
        return insertNewlineAndIndent(view);
      },
      stopPropagation: true,
    },
  });

  const globalKeymap = ref<{ [p: string]: SimpleKeyBinding }>({
    "Mod-p": {
      run: () => {
        const tree = lastFocusedBlockTree.value;
        const diId = lastFocusedDiId.value;
        if (tree && diId) {
          const view = tree.getEditorView(diId);
          if (view instanceof PmEditorView) {
            const sel = view.state.selection.content();
            const text = sel.content.textBetween(0, sel.content.size);
            openFusionCommand(text);
            return true;
          }
        }
        openFusionCommand("");
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    "Mod-k": {
      run: () => {
        const tree = lastFocusedBlockTree.value;
        const diId = lastFocusedDiId.value;
        if (!tree || !diId) return false;

        const di = tree.getDi(diId);
        if (!di || !DI_FILTERS.isBlockDi(di)) return false;

        addToSidePane(di.block.id);
        return true;
      },
      preventDefault: true,
      stopPropagation: true,
    },
    Delete: {
      run: () => {
        // 选中了多个块，则删除选中的所有块
        // 然后聚焦到上一个 di
        // TODO：如果上一个 di 也被删了怎么办？这是可能的，比如上一个块是被删除的块的镜像块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            for (const blockId of selectedBlockIds.value.topLevelOnly) {
              blockEditor.deleteBlock({ blockId, tr, commit: false });
            }
            tr.commit();
          });
          return true;
        }
        return false;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    Backspace: {
      run: () => {
        // 选中了多个块，则删除选中的所有块
        // 然后聚焦到上一个 di
        // TODO：如果上一个 di 也被删了怎么办？这是可能的，比如上一个块是被删除的块的镜像块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            for (const blockId of selectedBlockIds.value.topLevelOnly) {
              blockEditor.deleteBlock({ blockId, tr, commit: false });
            }
            tr.commit();
          });
          return true;
        }
        return false;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    Tab: {
      run: () => {
        // 1. 如果选中了多个块，则反缩进所有选中的所有块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            for (const blockId of selectedBlockIds.value.topLevelOnly) {
              const res = blockEditor.promoteBlock({ blockId, tr, commit: false });
              if (!res.success) return;
            }
            tr.commit();
          });
          return true;
        }
        return false;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    "Shift-Tab": {
      run: () => {
        // 1. 如果选中了多个块，则反缩进所有选中的所有块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const tr = blocksManager.createBlockTransaction({ type: "ui" });
            for (const blockId of selectedBlockIds.value.topLevelOnly) {
              const res = blockEditor.demoteBlock({ blockId, tr, commit: false });
              if (!res.success) return;
            }
            tr.commit();
          });
          return true;
        }
        return false;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    "Alt-ArrowUp": {
      run: () => {
        // 1. 如果选中了多个块，则上移所有选中的所有块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const pos = {
              baseBlockId: selectedBlockIds.value.topLevelOnly[0],
              offset: -1,
            };
            blockEditor.moveBlocks({
              blockIds: selectedBlockIds.value.topLevelOnly,
              pos,
            });
          });
          return true;
        }
        return false;
      },
      stopPropagation: true,
      preventDefault: true,
    },
    "Alt-ArrowDown": {
      run: () => {
        // 1. 如果选中了多个块，则下移所有选中的所有块
        if (selectedBlockIds.value.topLevelOnly.length > 1) {
          taskQueue.addTask(async () => {
            const selected = selectedBlockIds.value.topLevelOnly;
            const pos = {
              baseBlockId: selected[selected.length - 1],
              offset: 2,
            };
            blockEditor.moveBlocks({
              blockIds: selected,
              pos,
            });
          });
          return true;
        }
        return false;
      },
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
