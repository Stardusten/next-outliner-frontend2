import { createContext } from "@/utils/createContext";
import BlockSelectDragContext from "../blockSelect";
import BlocksContext from "../blocks/blocks";
import LastFocusContext from "../lastFocus";
import { DI_FILTERS, type BlockTree } from "../blockTree";
import { EditorView as PmEditorView } from "prosemirror-view";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import FusionCommandContext from "../fusionCommand";
import type { BlockPos, NonNormalizedBlockPosParentChild } from "../blocks/view-layer/blocksEditor";
import { plainTextToTextContent } from "@/utils/pm";
import { getPmSchema } from "@/components/prosemirror/pmSchema";
import type {
  AudioContent,
  ImageContent,
  TextContent,
  VideoContent,
} from "@/common/type-and-schemas/block/block-content";
import SidebarContext from "../sidebar";
import { Node } from "prosemirror-model";
import { AllSelection, TextSelection } from "prosemirror-state";
import { useTaskQueue } from "@/plugins/taskQueue";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { EditorView as CmEditorView } from "@codemirror/view";
import type { DisplayItem, DisplayItemId } from "@/utils/display-item";

const isRootBlock = (di: DisplayItem | undefined | null, tree: BlockTree) => {
  return (
    di?.type === "root-block" ||
    (!tree.getProps().enlargeRootBlock && di && "level" in di && di.level === 0)
  );
};

const CommandsContext = createContext(() => {
  const { selectedBlockIds } = BlockSelectDragContext.useContext()!;
  const { blockEditor, blocksManager } = BlocksContext.useContext()!;
  const { lastFocusedBlockTree, lastFocusedDiId } = LastFocusContext.useContext()!;
  const { openFusionCommand } = FusionCommandContext.useContext()!;
  const { addToSidePane } = SidebarContext.useContext()!;

  // Predicates
  const isCursorAtStart = (view: PmEditorView | CmEditorView) => {
    if (view instanceof PmEditorView) {
      const sel = view.state.selection;
      return AllSelection.atStart(view.state.doc).eq(sel);
    } else if (view instanceof CmEditorView) {
      const sel = view.state.selection;
      return sel.ranges.length === 1 && sel.ranges[0].empty && sel.ranges[0].from === 0;
    }
  };

  const isCursorAtEnd = (view: PmEditorView | CmEditorView) => {
    if (view instanceof PmEditorView) {
      const sel = view.state.selection;
      return AllSelection.atEnd(view.state.doc).eq(sel);
    } else if (view instanceof CmEditorView) {
      const sel = view.state.selection;
      return (
        sel.ranges.length === 1 &&
        sel.ranges[0].empty &&
        sel.ranges[0].from === view.state.doc.length
      );
    }
  };

  // Commands

  const swapUpSelected = () => {
    if (!selectedBlockIds.value) return false;
    if (selectedBlockIds.value.topLevelOnly.length > 0) {
      const taskQueue = useTaskQueue();
      taskQueue.addTask(async () => {
        const pos = {
          baseBlockId: selectedBlockIds.value!.topLevelOnly[0],
          offset: -1,
        };
        blockEditor.moveBlocks({
          blockIds: selectedBlockIds.value!.topLevelOnly,
          pos,
        });
      });
      return true;
    }
    return false;
  };

  const swapUpFocusedBlock = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const di = tree.getDi(diId);
    if (!di || !DI_FILTERS.isBlockDi(di)) return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      const pos = {
        baseBlockId: di.block.id,
        offset: -1,
      };
      blockEditor.moveBlock({ blockId: di.block.id, pos });
      await tree.nextUpdate();
      await tree.focusDi(diId);
    });
    return true;
  };

  const swapDownFocusedBlock = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const di = tree.getDi(diId);
    if (!di || !DI_FILTERS.isBlockDi(di)) return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      const pos = {
        baseBlockId: di.block.id,
        offset: 2,
      };
      blockEditor.moveBlock({ blockId: di.block.id, pos });
      await tree.nextUpdate();
      await tree.focusDi(diId);
    });
    return true;
  };

  const swapDownSelected = () => {
    if (!selectedBlockIds.value) return false;
    if (selectedBlockIds.value.topLevelOnly.length > 0) {
      const taskQueue = useTaskQueue();
      taskQueue.addTask(async () => {
        const selected = selectedBlockIds.value!.topLevelOnly;
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
  };

  const splitBlockBelow = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const view = tree.getEditorView(diId);
    const di = tree.getDi(diId);
    if (!(view instanceof PmEditorView) || !di) return false;

    if (
      // 不处理 backlink-block 和 potential-links-block
      // 因为反链面板中 split 很可能一个块就看不见了
      di.type === "backlink-block" ||
      di.type === "potential-links-block" ||
      !("block" in di)
    )
      return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      const curSel = view.state.selection;
      const docBelow = view.state.doc.cut(curSel.anchor);
      const newThisDoc = view.state.doc.cut(0, curSel.anchor);

      // 删去挪移到新块中的内容
      const tr = blocksManager.createBlockTransaction({ type: "ui" });
      blockEditor.changeBlockContent({
        blockId: di.block.id,
        content: [BLOCK_CONTENT_TYPES.TEXT, newThisDoc.toJSON()],
        tr,
        commit: false,
      });

      // 下方插入块
      const pos = {
        baseBlockId: di.block.id,
        offset: 1,
      };
      const { newNormalBlockId } =
        blockEditor.insertNormalBlock({
          pos,
          content: [BLOCK_CONTENT_TYPES.TEXT, docBelow.toJSON()],
          tr,
          commit: false,
        }) ?? {};

      (document.activeElement as HTMLElement).blur();
      tr.commit();

      await tree.nextUpdate();

      const newDi = tree.getDiBelow(
        di.itemId,
        (di) => DI_FILTERS.isBlockDi(di) && di.block.id === newNormalBlockId,
      );
      if (newDi) {
        await tree.focusDi(newDi[0].itemId);
        tree.moveCursorToBegin(newDi[0].itemId); // 将光标移至开头
      }
    });

    return true;
  };

  const splitBlockAbove = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const view = tree.getEditorView(diId);
    const di = tree.getDi(diId);
    if (!(view instanceof PmEditorView) || !di) return false;

    if (
      // 不处理 backlink-block 和 potential-links-block
      // 因为反链面板中 split 很可能一个块就看不见了
      di.type === "backlink-block" ||
      di.type === "potential-links-block" ||
      // 不处理当前的根块，因为根块显然没办法往上 split
      di.type === "root-block" ||
      !("block" in di)
    )
      return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
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
      const pos = {
        baseBlockId: di.block.id,
        offset: 0,
      };
      blockEditor.insertNormalBlock({
        pos,
        content: [BLOCK_CONTENT_TYPES.TEXT, docAbove.toJSON()],
        tr,
        commit: false,
      });

      (document.activeElement as HTMLElement).blur();
      tr.commit();

      await tree.nextUpdate();
      await tree.focusDi(di.itemId);
      tree.moveCursorToBegin(di.itemId); // 将光标移至开头
    });

    return true;
  };

  const promoteSelected = () => {
    if (!selectedBlockIds.value) return false;
    if (selectedBlockIds.value.topLevelOnly.length > 0) {
      const taskQueue = useTaskQueue();
      taskQueue.addTask(async () => {
        const tr = blocksManager.createBlockTransaction({ type: "ui" });
        for (const blockId of selectedBlockIds.value!.topLevelOnly) {
          const res = blockEditor.promoteBlock({ blockId, tr, commit: false });
          if (!res.success) return; // 任何一个块无法 promote，直接取消整个事务
        }
        tr.commit();
      });
      return true;
    }
    return false;
  };

  const openFusionCommandWithCurrentSelection = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      if (tree && diId) {
        const view = tree.getEditorView(diId);
        if (view instanceof PmEditorView) {
          const sel = view.state.selection.content();
          const text = sel.content.textBetween(0, sel.content.size);
          openFusionCommand(text);
          return;
        }
      }
      openFusionCommand("");
    });

    return true;
  };

  const demoteSelected = () => {
    if (!selectedBlockIds.value) return false;
    if (selectedBlockIds.value.topLevelOnly.length > 0) {
      const taskQueue = useTaskQueue();
      taskQueue.addTask(async () => {
        const tr = blocksManager.createBlockTransaction({ type: "ui" });
        for (let i = selectedBlockIds.value!.topLevelOnly.length - 1; i >= 0; i--) {
          const id = selectedBlockIds.value!.topLevelOnly[i];
          const res = blockEditor.demoteBlock({ blockId: id, tr, commit: false });
          if (!res.success) return; // 任何一个块无法 demote，直接取消整个事务
        }
        tr.commit();
      });
      return true;
    }
    return false;
  };

  const deleteSelected = () => {
    if (!selectedBlockIds.value) return false;
    if (selectedBlockIds.value.topLevelOnly.length > 0) {
      const taskQueue = useTaskQueue();
      taskQueue.addTask(async () => {
        const tr = blocksManager.createBlockTransaction({ type: "ui" });
        for (const blockId of selectedBlockIds.value!.topLevelOnly) {
          blockEditor.deleteBlock({ blockId, tr, commit: false });
        }
        tr.commit();
      });
      return true;
    }
    return false;
  };

  const deleteFocusedBlock = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const di = tree.getDi(diId);
    if (!di || !DI_FILTERS.isBlockDi(di)) return false;

    const diAbove = tree.getDiAbove(diId, DI_FILTERS.isBlockDi);

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      blockEditor.deleteBlock({ blockId: di.block.id });
      await tree.nextUpdate();
      if (diAbove && DI_FILTERS.isBlockDi(diAbove[0])) {
        await tree.focusDi(diAbove[0].itemId);
        tree.moveCursorToTheEnd(diAbove[0].itemId);
      }
    });

    return true;
  };

  const deleteFocusedBlockIfEmpty = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const view = tree.getEditorView(diId);
    const di = tree.getDi(diId);
    if (!view || !di || !DI_FILTERS.isBlockDi(di)) return false;

    let isEmpty = false;
    if (view instanceof PmEditorView) {
      isEmpty = view.state.doc.content.size === 0;
    } else if (view instanceof CmEditorView) {
      isEmpty = view.state.doc.length === 0;
    }
    if (!isEmpty) return false;

    const diAbove = tree.getDiAbove(diId, DI_FILTERS.isBlockDi);

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      blockEditor.deleteBlock({ blockId: di.block.id });
      await tree.nextUpdate();
      if (diAbove && DI_FILTERS.isBlockDi(diAbove[0])) {
        await tree.focusDi(diAbove[0].itemId);
        tree.moveCursorToTheEnd(diAbove[0].itemId);
      }
    });

    return true;
  };

  const createEmptyTextBlockUnder =
    (
      childIndex: NonNormalizedBlockPosParentChild["childIndex"] = "last-space",
      textContent?: TextContent,
    ) =>
    () => {
      const tree = lastFocusedBlockTree.value;
      const diId = lastFocusedDiId.value;
      if (!tree || !diId) return false;

      const di = tree.getDi(diId);
      if (!di || !DI_FILTERS.isBlockDi(di)) return false;

      const taskQueue = useTaskQueue();
      taskQueue.addTask(async () => {
        const pos: BlockPos = {
          parentId: di.block.id,
          childIndex: childIndex,
        };
        const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
        const { newNormalBlockId } =
          blockEditor.insertNormalBlock({
            pos,
            content: textContent ?? plainTextToTextContent("", schema),
          }) ?? {};

        await tree.nextUpdate();
        const newDi = tree.getDiBelow(
          di.itemId,
          (di) => DI_FILTERS.isBlockDi(di) && di.block.id === newNormalBlockId,
        );
        if (newDi) {
          await tree.focusDi(newDi[0].itemId);
        }
      });

      return true;
    };

  const createEmptyTextBlockBelow = (textContent?: TextContent) => () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const di = tree.getDi(diId);
    if (
      !di ||
      // 不处理 backlink-block 和 potential-links-block
      // 因为反链面板中一个块下面创建的块是看不见的
      di.type === "backlink-block" ||
      di.type === "potential-links-block" ||
      // 不处理根块的情况
      // 因为根块显然没办法往下创建空块
      isRootBlock(di, tree) ||
      !("block" in di)
    )
      return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      const pos: BlockPos = {
        baseBlockId: di.block.id,
        offset: 1,
      };
      const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
      const { newNormalBlockId } =
        blockEditor.insertNormalBlock({
          pos,
          content: textContent ?? plainTextToTextContent("", schema),
        }) ?? {};

      await tree.nextUpdate();
      const newDi = tree.getDiBelow(
        di.itemId,
        (di) => DI_FILTERS.isBlockDi(di) && di.block.id === newNormalBlockId,
      );
      if (newDi) {
        await tree.focusDi(newDi[0].itemId);
      }
    });

    return true;
  };

  const createEmptyTextBlockAbove = (textContent?: TextContent) => () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const di = tree.getDi(diId);
    if (
      !di ||
      // 不处理 backlink-block 和 potential-links-block
      // 因为反链面板中一个块下面创建的块是看不见的
      di.type === "backlink-block" ||
      di.type === "potential-links-block" ||
      // 不处理根块的情况
      // 因为根块显然没办法往上创建空块
      di.type === "root-block" ||
      !("block" in di)
    )
      return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      const pos: BlockPos = {
        baseBlockId: di.block.id,
        offset: 0,
      };
      const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
      const { newNormalBlockId } =
        blockEditor.insertNormalBlock({
          pos,
          content: textContent ?? plainTextToTextContent("", schema),
        }) ?? {};

      await tree.nextUpdate();

      const newDi = tree.getDiBelow(
        di.itemId,
        (di) => DI_FILTERS.isBlockDi(di) && di.block.id === newNormalBlockId,
      );
      if (newDi) {
        await tree.focusDi(newDi[0].itemId);
      }
    });

    return true;
  };

  const addFocusedToSidePane = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const di = tree.getDi(diId);
    if (!di || !DI_FILTERS.isBlockDi(di)) return false;

    addToSidePane(di.block.id);
    return true;
  };

  // 将上一个块合并到当前块
  // 比如：
  // - aaabbb
  // - |ccc
  // 合并后：
  // - aaaabbbccc
  // 合并后上一个块会被删除，内容会合并到当前块
  const mergeAboveIntoCurrent = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const view = tree.getEditorView(diId);
    const di = tree.getDi(diId);

    // 仅允许 basic-block 与 basic-block 合并
    if (!(view instanceof PmEditorView) || !di || di.type !== "basic-block") return false;

    // 仅当光标在当前块块首时，才允许合并
    if (!isCursorAtStart(view)) return false;

    const currBlock = di.block;

    const diAbove = tree.getDiAbove(diId, DI_FILTERS.isBlockDi);
    if (!diAbove || diAbove[0].type !== "basic-block") return false;
    const blockAbove = diAbove[0].block;
    // 如果上一个块有孩子，或者与自己不同级，则不允许合并
    if (blockAbove.childrenIds.length > 0 || blockAbove.parentId !== di.block.parentId)
      return false;

    // TODO: 仅允许文本块和文本块合并
    if (currBlock.content[0] !== BLOCK_CONTENT_TYPES.TEXT) return false;
    if (blockAbove.content[0] !== BLOCK_CONTENT_TYPES.TEXT) return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
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

      (document.activeElement as HTMLElement).blur();
      tr.commit();

      await tree.nextUpdate();
      await tree.focusDi(di.itemId);
      {
        // 将光标移至正确位置
        const view = tree.getEditorView(di.itemId);
        if (view instanceof PmEditorView) {
          const sel = TextSelection.create(view.state.doc, aboveDoc.content.size);
          const tr = view.state.tr.setSelection(sel);
          view.dispatch(tr);
          view.focus();
        }
      }
    });

    return true;
  };

  // 将当前块合并到下一个块
  // 比如：
  // - aaabbb|
  // - bbbccc
  // 合并后：
  // - aaaabbbccc
  // 合并后当前块会被删除，内容会合并到下一个块
  const mergeCurrentIntoBelow = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const view = tree.getEditorView(diId);
    const di = tree.getDi(diId);

    // 仅允许 basic-block 与 basic-block 合并
    if (!(view instanceof PmEditorView) || !di || di.type !== "basic-block") return false;

    // 仅当光标在当前块块末尾时，才允许合并
    if (!isCursorAtEnd(view)) return false;

    const currBlock = di.block;
    // 如果当前块有孩子，则不允许合并
    if (currBlock.childrenIds.length > 0) return false;

    const diBelow = tree.getDiBelow(diId, DI_FILTERS.isBlockDi);
    if (!diBelow || diBelow[0].type !== "basic-block") return false;
    const belowBlock = diBelow[0].block;
    // 如果下一个块与自己不同级，则不允许合并
    if (belowBlock.parentId !== currBlock.parentId) return false;

    // TODO: 仅允许文本块和文本块合并
    if (currBlock.content[0] !== BLOCK_CONTENT_TYPES.TEXT) return false;
    if (belowBlock.content[0] !== BLOCK_CONTENT_TYPES.TEXT) return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(async () => {
      const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
      const belowDoc = Node.fromJSON(schema, belowBlock.content[1]);
      const thisDoc = view.state.doc;
      const newBelowContent = thisDoc.content.append(belowDoc.content);
      const newBelowDoc = schema.nodes.doc.create(null, newBelowContent);

      const tr = blocksManager.createBlockTransaction({ type: "ui" });
      blockEditor.changeBlockContent({
        blockId: belowBlock.id,
        content: [BLOCK_CONTENT_TYPES.TEXT, newBelowDoc.toJSON()],
        tr,
        commit: false,
      });
      blockEditor.deleteBlock({ blockId: currBlock.id, tr, commit: false });
      tr.commit();

      await tree.nextUpdate();
      await tree.focusDi(diBelow[0].itemId);
      {
        // 将光标移至正确位置
        const view = tree.getEditorView(diBelow[0].itemId);
        if (view instanceof PmEditorView) {
          const sel = TextSelection.create(view.state.doc, thisDoc.content.size);
          const tr = view.state.tr.setSelection(sel);
          view.dispatch(tr);
          view.focus();
        }
      }
    });

    return true;
  };

  const deleteEmptyBlockBelow = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;
    const diBelow = tree.getDiBelow(diId, DI_FILTERS.isBlockDi);

    if (!diBelow || !DI_FILTERS.isBlockDi(diBelow[0])) return false;
    const belowBlock = diBelow[0].block;

    if (belowBlock.content[0] === BLOCK_CONTENT_TYPES.TEXT) {
      const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
      const belowDoc = Node.fromJSON(schema, belowBlock.content[1]);
      if (belowDoc.content.size == 0) {
        const taskQueue = useTaskQueue();
        taskQueue.addTask(async () => {
          blockEditor.deleteBlock({ blockId: belowBlock.id });
        });
        return true;
      }
    }

    if (belowBlock.content[0] === BLOCK_CONTENT_TYPES.CODE) {
      if (belowBlock.content[1].length == 0) {
        const taskQueue = useTaskQueue();
        taskQueue.addTask(async () => {
          blockEditor.deleteBlock({ blockId: belowBlock.id });
        });
        return true;
      }
    }

    return false;
  };

  /**
   * 如果光标在当前块开头，且上一个块为空，则删除上一个块
   */
  const deleteEmptyBlockAboveIfAtStart = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const view = tree.getEditorView(diId);
    if (!view || !isCursorAtStart(view)) return false;

    const diAbove = tree.getDiAbove(diId, DI_FILTERS.isBlockDi);

    if (!diAbove || !DI_FILTERS.isBlockDi(diAbove[0])) return false;
    const aboveBlock = diAbove[0].block;

    if (aboveBlock.content[0] === BLOCK_CONTENT_TYPES.TEXT) {
      const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
      const aboveDoc = Node.fromJSON(schema, aboveBlock.content[1]);
      if (aboveDoc.content.size == 0) {
        const taskQueue = useTaskQueue();
        taskQueue.addTask(async () => {
          blockEditor.deleteBlock({ blockId: aboveBlock.id });
        });
        return true;
      }
    }

    if (aboveBlock.content[0] === BLOCK_CONTENT_TYPES.CODE) {
      if (aboveBlock.content[1].length == 0) {
        const taskQueue = useTaskQueue();
        taskQueue.addTask(async () => {
          blockEditor.deleteBlock({ blockId: aboveBlock.id });
        });
        return true;
      }
    }

    return false;
  };

  const promoteFocusedBlock = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;

    const di = tree.getDi(diId);
    if (!di || !DI_FILTERS.isBlockDi(di)) return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(() => {
      blockEditor.promoteBlock({ blockId: di.block.id });
    });

    return true;
  };

  const demoteFocusedBlock = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    if (!tree || !diId) return false;
    const di = tree.getDi(diId);
    if (!di || !DI_FILTERS.isBlockDi(di)) return false;
    if (di.block.parentId == "root") return false;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(() => {
      blockEditor.demoteBlock({ blockId: di.block.id });
    });
  };

  const foldFocusedBlock = () => {
    const diId = lastFocusedDiId.value;
    const tree = lastFocusedBlockTree.value;
    if (!diId || !tree) return false;

    const di = tree.getDi(diId);
    if (di) {
      if (di.type === "basic-block") {
        if (!di.block.fold) {
          const taskQueue = useTaskQueue();
          taskQueue.addTask(() => {
            blockEditor.toggleFold(di.block.id, true);
          });
          return true;
        }
      } // TODO 其他类型呢？
    }
    return false;
  };

  const expandFocusedBlock = () => {
    const diId = lastFocusedDiId.value;
    const tree = lastFocusedBlockTree.value;
    if (!diId || !tree) return false;

    const di = tree.getDi(diId);
    if (di) {
      if (di.type === "basic-block") {
        if (di.block.fold) {
          const taskQueue = useTaskQueue();
          taskQueue.addTask(() => {
            blockEditor.toggleFold(di.block.id, false);
          });
          return true;
        }
      } // TODO 其他类型呢？
    }
    return false;
  };

  const toggleFoldOfFocusedBlock = () => {
    throw new Error("Not implemented");
  };

  const addBlockAboveToSelection = () => {
    if (!selectedBlockIds.value) {
      const tree = lastFocusedBlockTree.value;
      const diId = lastFocusedDiId.value;
      if (!tree || !diId) return false;

      const view = tree.getEditorView(diId);
      const di = tree.getDi(diId);
      if (!(view instanceof PmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;
      // TODO 其他类型的块呢？
      const sel = view.state.selection;
      if (sel.from !== 0) return false;
      else {
        const newSelected = {
          baseBlockId: di.block.id,
          topLevelOnly: [di.block.id],
          allNonFolded: [] as BlockId[],
        };
        blocksManager.forDescendants({
          rootBlockId: di.block.id,
          rootBlockLevel: 0,
          nonFoldOnly: true,
          includeSelf: true,
          onEachBlock: (b) => {
            newSelected.allNonFolded.push(b.id);
          },
        });
        selectedBlockIds.value = newSelected;
        return true;
      }
    }
    const selected = selectedBlockIds.value.topLevelOnly;
    const fstBlock = blocksManager.getBlock(selected[0]);
    if (!fstBlock) return false;
    const parentBlock = blocksManager.getBlock(fstBlock.parentId);
    if (!parentBlock) return false;
    const fstIndex = parentBlock.childrenIds.indexOf(fstBlock.id);
    const lstIndex = parentBlock.childrenIds.indexOf(selected[selected.length - 1]);
    const baseIndex = parentBlock.childrenIds.indexOf(selectedBlockIds.value.baseBlockId);
    let newSelected = {
      baseBlockId: selectedBlockIds.value.baseBlockId,
      topLevelOnly: [] as BlockId[],
      allNonFolded: [] as BlockId[],
    };
    if (lstIndex > baseIndex) {
      // 收缩下边界
      newSelected.topLevelOnly = [...selected.slice(0, -1)];
    } else if (fstIndex === 0) {
      // 选中父块
      newSelected.baseBlockId = parentBlock.id;
      newSelected.topLevelOnly = [parentBlock.id];
    } else {
      // 扩展上边界
      const blockIdAbove = parentBlock.childrenIds[fstIndex - 1];
      newSelected.topLevelOnly = [blockIdAbove, ...selected];
    }
    // 计算 allNonFolded
    for (const blockId of newSelected.topLevelOnly) {
      blocksManager.forDescendants({
        rootBlockId: blockId,
        rootBlockLevel: 0,
        nonFoldOnly: true,
        includeSelf: true,
        onEachBlock: (b) => {
          newSelected.allNonFolded.push(b.id);
        },
      });
    }
    selectedBlockIds.value = newSelected;
    return true;
  };

  const addBlockBelowToSelection = () => {
    if (!selectedBlockIds.value) {
      const tree = lastFocusedBlockTree.value;
      const diId = lastFocusedDiId.value;
      if (!tree || !diId) return false;

      const view = tree.getEditorView(diId);
      const di = tree.getDi(diId);
      if (!(view instanceof PmEditorView) || !di || !DI_FILTERS.isBlockDi(di)) return false;
      // TODO 其他类型的块呢？
      const sel = view.state.selection;
      if (sel.to !== view.state.doc.content.size) return false;
      else {
        const newSelected = {
          baseBlockId: di.block.id,
          topLevelOnly: [di.block.id],
          allNonFolded: [] as BlockId[],
        };
        blocksManager.forDescendants({
          rootBlockId: di.block.id,
          rootBlockLevel: 0,
          nonFoldOnly: true,
          includeSelf: true,
          onEachBlock: (b) => {
            newSelected.allNonFolded.push(b.id);
          },
        });
        selectedBlockIds.value = newSelected;
        return true;
      }
    }
    const selected = selectedBlockIds.value.topLevelOnly;
    const lstBlock = blocksManager.getBlock(selected[selected.length - 1]);
    if (!lstBlock) return false;
    const parentBlock = blocksManager.getBlock(lstBlock.parentId);
    if (!parentBlock) return false;
    const fstIndex = parentBlock.childrenIds.indexOf(selected[0]);
    const lstIndex = parentBlock.childrenIds.indexOf(lstBlock.id);
    const baseIndex = parentBlock.childrenIds.indexOf(selectedBlockIds.value.baseBlockId);
    let newSelected = {
      baseBlockId: selectedBlockIds.value.baseBlockId,
      topLevelOnly: [] as BlockId[],
      allNonFolded: [] as BlockId[],
    };
    if (fstIndex < baseIndex) {
      // 收缩上边界
      newSelected.topLevelOnly = [...selected.slice(1)];
    } else if (lstIndex === parentBlock.childrenIds.length - 1) {
      // 选中父块
      newSelected.baseBlockId = parentBlock.id;
      newSelected.topLevelOnly = [parentBlock.id];
    } else {
      // 扩展下边界
      const blockIdBelow = parentBlock.childrenIds[lstIndex + 1];
      newSelected.topLevelOnly = [...selected, blockIdBelow];
    }
    // 计算 allNonFolded
    for (const blockId of newSelected.topLevelOnly) {
      blocksManager.forDescendants({
        rootBlockId: blockId,
        rootBlockLevel: 0,
        nonFoldOnly: true,
        includeSelf: true,
        onEachBlock: (b) => {
          newSelected.allNonFolded.push(b.id);
        },
      });
    }
    selectedBlockIds.value = newSelected;
    return true;
  };

  const blurAndSelectCurrentBlock = () => {
    const diId = lastFocusedDiId.value;
    const tree = lastFocusedBlockTree.value;
    if (!diId || !tree) return false;
    const di = tree.getDi(diId);
    const view = tree.getEditorView(diId);
    if (!di || !DI_FILTERS.isBlockDi(di)) return false;

    let emptySelection = false;
    if (view instanceof PmEditorView) {
      const sel = view.state.selection;
      if (sel.empty) {
        emptySelection = true;
        view.dom.blur();
      }
    }
    if (view instanceof CmEditorView) {
      const sel = view.state.selection;
      if (sel.ranges.length === 1 && sel.ranges[0].empty) {
        emptySelection = true;
        view.contentDOM.blur();
      }
    }

    if (emptySelection) {
      const newSelected = {
        baseBlockId: di.block.id,
        topLevelOnly: [di.block.id],
        allNonFolded: [] as BlockId[],
      };
      blocksManager.forDescendants({
        rootBlockId: di.block.id,
        nonFoldOnly: true,
        includeSelf: true,
        onEachBlock: (block) => {
          newSelected.allNonFolded.push(block.id);
        },
      });
      selectedBlockIds.value = newSelected;
      return true;
    }
    return false;
  };

  const insertImage = (imageContent: ImageContent) => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    const di = diId ? tree?.getDi(diId) : null;
    if (!tree || !diId || !di || !DI_FILTERS.isBlockDi(di)) return false;

    const blockId = di.block.id;
    const view = tree.getEditorView(diId);

    let isEmpty = false;
    if (view instanceof PmEditorView) {
      isEmpty = view.state.doc.content.size == 0;
    } else if (view instanceof CmEditorView) {
      isEmpty = view.state.doc.length === 0;
    }

    const taskQueue = useTaskQueue();
    let imageBlockId: BlockId | null = null;
    if (isEmpty) {
      // 当前块为空, 直接将当前块变成图片块
      imageBlockId = blockId;
      taskQueue.addTask(() => {
        blockEditor.changeBlockContent({ blockId, content: imageContent });
      });
    } else {
      // 当前块不为空, 在下方插入图片块
      taskQueue.addTask(() => {
        const { newNormalBlockId } =
          blockEditor.insertNormalBlock({
            pos: {
              baseBlockId: blockId,
              offset: 1,
            },
            content: imageContent,
          }) ?? {};
        imageBlockId = newNormalBlockId ?? null;
      });
    }
  };

  const insertAudio = (audioContent: AudioContent) => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    const di = diId ? tree?.getDi(diId) : null;
    if (!tree || !diId || !di || !DI_FILTERS.isBlockDi(di)) return false;

    const blockId = di.block.id;
    const view = tree.getEditorView(diId);

    let isEmpty = false;
    if (view instanceof PmEditorView) {
      isEmpty = view.state.doc.content.size == 0;
    } else if (view instanceof CmEditorView) {
      isEmpty = view.state.doc.length === 0;
    }

    const taskQueue = useTaskQueue();
    let imageBlockId: BlockId | null = null;
    if (isEmpty) {
      // 当前块为空, 直接将当前块变成图片块
      imageBlockId = blockId;
      taskQueue.addTask(() => {
        blockEditor.changeBlockContent({ blockId, content: audioContent });
      });
    } else {
      // 当前块不为空, 在下方插入图片块
      taskQueue.addTask(() => {
        const { newNormalBlockId } =
          blockEditor.insertNormalBlock({
            pos: {
              baseBlockId: blockId,
              offset: 1,
            },
            content: audioContent,
          }) ?? {};
        imageBlockId = newNormalBlockId ?? null;
      });
    }
  };

  const insertVideo = (videoContent: VideoContent) => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    const di = diId ? tree?.getDi(diId) : null;
    if (!tree || !diId || !di || !DI_FILTERS.isBlockDi(di)) return false;

    const blockId = di.block.id;
    const view = tree.getEditorView(diId);

    let isEmpty = false;
    if (view instanceof PmEditorView) {
      isEmpty = view.state.doc.content.size == 0;
    } else if (view instanceof CmEditorView) {
      isEmpty = view.state.doc.length === 0;
    }

    const taskQueue = useTaskQueue();
    let imageBlockId: BlockId | null = null;
    if (isEmpty) {
      // 当前块为空, 直接将当前块变成图片块
      imageBlockId = blockId;
      taskQueue.addTask(() => {
        blockEditor.changeBlockContent({ blockId, content: videoContent });
      });
    } else {
      // 当前块不为空, 在下方插入图片块
      taskQueue.addTask(() => {
        const { newNormalBlockId } =
          blockEditor.insertNormalBlock({
            pos: {
              baseBlockId: blockId,
              offset: 1,
            },
            content: videoContent,
          }) ?? {};
        imageBlockId = newNormalBlockId ?? null;
      });
    }
  };

  const foldAll = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    const di = diId ? tree?.getDi(diId) : null;
    if (!tree || !diId || !di || !DI_FILTERS.isBlockDi(di)) return false;

    const blockId = di.block.id;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(() => {
      const tr = blocksManager.createBlockTransaction({ type: "ui" });
      blocksManager.forDescendants({
        rootBlockId: blockId,
        rootBlockLevel: 0,
        nonFoldOnly: true,
        includeSelf: true,
        onEachBlock: (block) => {
          !block.fold && tr.updateBlock({ ...block, fold: true });
        },
      });
      tr.commit();
    });
    return true;
  };

  const expandAll = () => {
    const tree = lastFocusedBlockTree.value;
    const diId = lastFocusedDiId.value;
    const di = diId ? tree?.getDi(diId) : null;
    if (!tree || !diId || !di || !DI_FILTERS.isBlockDi(di)) return false;

    const blockId = di.block.id;

    const taskQueue = useTaskQueue();
    taskQueue.addTask(() => {
      const tr = blocksManager.createBlockTransaction({ type: "ui" });
      blocksManager.forDescendants({
        rootBlockId: blockId,
        rootBlockLevel: 0,
        nonFoldOnly: false,
        includeSelf: true,
        onEachBlock: (block) => {
          block.fold && tr.updateBlock({ ...block, fold: false });
        },
      });
      tr.commit();
    });
    return true;
  };

  return {
    swapUpSelected,
    swapDownSelected,
    swapUpFocusedBlock,
    swapDownFocusedBlock,
    splitBlockBelow,
    splitBlockAbove,
    promoteSelected,
    addFocusedToSidePane,
    openFusionCommandWithCurrentSelection,
    demoteSelected,
    deleteSelected,
    deleteFocusedBlock,
    createEmptyTextBlockUnder,
    createEmptyTextBlockBelow,
    createEmptyTextBlockAbove,
    mergeAboveIntoCurrent,
    mergeCurrentIntoBelow,
    deleteEmptyBlockBelow,
    deleteEmptyBlockAboveIfAtStart,
    promoteFocusedBlock,
    demoteFocusedBlock,
    deleteFocusedBlockIfEmpty,
    foldFocusedBlock,
    expandFocusedBlock,
    toggleFoldOfFocusedBlock,
    addBlockAboveToSelection,
    addBlockBelowToSelection,
    blurAndSelectCurrentBlock,
    insertImage,
    insertAudio,
    insertVideo,
    foldAll,
    expandAll,
  };
});

export default CommandsContext;
