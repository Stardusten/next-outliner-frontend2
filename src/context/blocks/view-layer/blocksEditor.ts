import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { BlockContent } from "@/common/type-and-schemas/block/block-content";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { nanoid } from "nanoid";
import { type BlockTree } from "../../blockTree";
import {
  cloneBlock,
  type Block,
  type BlocksManager,
  type BlockTransaction,
  type MinimalBlock,
  type MinimalMirrorBlock,
  type MinimalVirtualBlock,
  type MirrorBlock,
  type VirtualBlock,
} from "./blocksManager";
import type IndexContext from "@/context";
import type { ShallowRef } from "vue";

export type BlockPos = BlockPosSiblingOffset | NonNormalizedBlockPosParentChild;

export type BlockPosParentChild = {
  parentId: BlockId;
  childIndex: number;
};

export type NonNormalizedBlockPosParentChild = {
  parentId: BlockId;
  childIndex: number | "first" | "last" | "last-space";
};

export type BlockPosSiblingOffset = {
  baseBlockId: BlockId;
  offset: number;
};

export const getActuralSrcBlock = (block: MinimalBlock, tr: BlockTransaction): MinimalBlock => {
  if (block.type === "normalBlock") return block;
  if (block.type === "mirrorBlock" || block.type === "virtualBlock") {
    const srcBlock = tr.getLatestBlock(block.src);
    if (!srcBlock) throw new Error(`Cannot get srcBlock, blockId=${block.id}`);
    return getActuralSrcBlock(srcBlock, tr);
  }
  throw new Error("Invalid block type");
};

export const createBlocksEditor = (
  blocksManager: BlocksManager,
  mainRootBlockId: ShallowRef<BlockId | null>,
  getIndexContext: () => ReturnType<typeof IndexContext.useContext>,
) => {
  const normalizePos = (pos: BlockPos, tr?: BlockTransaction): BlockPosParentChild | null => {
    const getBlock = tr ? tr.getLatestBlock : blocksManager.getBlock;
    if ("parentId" in pos) {
      // BlockPosParentChild or NonNormalizedBlockPosParentChild
      // handle 'first', 'last' and 'last-space'
      if (typeof pos.childIndex == "string") {
        const parentBlock = getBlock(pos.parentId);
        if (!parentBlock) return null;
        return {
          parentId: pos.parentId,
          childIndex:
            pos.childIndex == "first"
              ? 0
              : pos.childIndex == "last"
                ? parentBlock.childrenIds.length - 1
                : parentBlock.childrenIds.length,
        } as BlockPosParentChild;
      } else {
        return pos as BlockPosParentChild;
      }
    } else {
      // BlockPosSiblingOffset
      const baseBlock = getBlock(pos.baseBlockId);
      if (!baseBlock || baseBlock.id == "root") return null;
      const parentBlock = getBlock(baseBlock.parentId);
      if (!parentBlock) return null;
      const index = parentBlock.childrenIds.indexOf(pos.baseBlockId);
      return {
        parentId: parentBlock.id,
        childIndex: Math.min(parentBlock.childrenIds.length, Math.max(0, index + pos.offset)),
      } as BlockPosParentChild;
    }
  };

  const toggleFold = (blockId: BlockId, fold?: boolean) => {
    const block = blocksManager.getBlock(blockId);
    if (!block) return;

    fold ??= !block.fold;
    if (block.fold == fold) return;

    block.fold = fold;
    blocksManager.updateBlock(block, { type: "ui" });
  };

  const changeBlockContent = (params: {
    blockId: BlockId;
    content: BlockContent;
    tr?: BlockTransaction;
    commit?: boolean;
  }) => {
    let { blockId, content, tr, commit } = params;
    tr ??= blocksManager.createBlockTransaction({ type: "ui", changeSources: [blockId] });
    commit ??= true;
    const indexContext = getIndexContext();

    const block = tr.getLatestBlock(blockId)!;
    const actualSrcBlock = getActuralSrcBlock(block, tr);
    const occurs = indexContext!.getOccurs(actualSrcBlock.id);

    const ctext = blocksManager.getCtext(content);
    const olinks =
      content[0] === BLOCK_CONTENT_TYPES.TEXT ? blocksManager.getOlinks(content[1]) : [];
    const boosting = 0; // TODO

    for (const occur of occurs) {
      const occurBlock = tr.getLatestBlock(occur);
      if (!occurBlock) continue;
      occurBlock.content = content;
      occurBlock.ctext = ctext;
      occurBlock.olinks = olinks;
      occurBlock.boosting = boosting;
      tr.updateBlock(occurBlock);
    }

    if (commit) tr.commit();
  };

  const setBlockMetadata = (params: {
    blockId: BlockId;
    metadata: Record<string, any>;
    tr?: BlockTransaction;
    commit?: boolean;
  }) => {
    let { blockId, metadata, tr, commit } = params;
    tr ??= blocksManager.createBlockTransaction({ type: "ui", changeSources: [blockId] });
    commit ??= true;
    const indexContext = getIndexContext();

    const block = tr.getLatestBlock(blockId)!;
    const actualSrcBlock = getActuralSrcBlock(block, tr);

    const occurs = indexContext!.getOccurs(actualSrcBlock.id);

    for (const occur of occurs) {
      const occurBlock = tr.getLatestBlock(occur);
      if (!occurBlock) continue;
      occurBlock.metadata = metadata;
      tr.updateBlock(occurBlock);
    }

    if (commit) tr.commit();
  };

  const insertNormalBlock = (params: {
    pos: BlockPos;
    id?: BlockId;
    content: BlockContent;
    meta?: Record<string, any>;
    childrenIds?: BlockId[];
    tr?: BlockTransaction;
    commit?: boolean;
    expandParentIfFolded?: boolean;
  }) => {
    let { pos, id, content, meta, childrenIds, tr, commit, expandParentIfFolded } = params;
    childrenIds ??= [];
    tr ??= blocksManager.createBlockTransaction({ type: "ui" });
    commit ??= true;
    const indexContext = getIndexContext();

    const { parentId, childIndex } = normalizePos(pos, tr)!;
    const parentBlock = tr.getLatestBlock(parentId)!;
    const parentActuralSrcBlock = getActuralSrcBlock(parentBlock, tr);
    if (!parentActuralSrcBlock) return;

    // 要插入的新块
    id = id ?? nanoid();
    tr.addBlock({
      id,
      type: "normalBlock",
      parentId,
      childrenIds,
      fold: true,
      content,
      metadata: meta ?? {},
    });

    parentActuralSrcBlock.childrenIds.splice(childIndex, 0, id);
    tr.updateBlock(parentActuralSrcBlock);

    // parentActuralSrcBlock 的所有镜像和虚拟块下面创建对应的虚拟块
    const parentOccues = indexContext!.getOccurs(parentActuralSrcBlock.id, false);
    for (const occur of parentOccues) {
      const occurBlock = tr.getLatestBlock(occur);
      if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
        continue;
      const newId = nanoid();

      tr.addBlock({
        id: newId,
        type: "virtualBlock",
        childrenIds: [],
        fold: true,
        parentId: occurBlock.id,
        src: id,
        childrenCreated: false,
      });

      occurBlock.childrenIds.splice(childIndex, 0, newId);
      tr.updateBlock(occurBlock);
    }

    // 如果 parent block 是折叠的，则展开它，让我们能看到插入的块
    if (parentBlock.fold && expandParentIfFolded) {
      parentBlock.fold = false;
      tr.updateBlock(parentBlock);
    }

    if (commit) tr.commit();
    return { newNormalBlockId: id };
  };

  const insertNormalBlocks = (params: {
    pos: BlockPos;
    blocks: {
      // 普通块的 id，如果为空，则自动生成
      id?: BlockId;
      content: BlockContent;
      // 如果为空，则默认没有孩子
      childrenIds?: BlockId[];
      meta?: Record<string, any>;
    }[];
    tr?: BlockTransaction;
    commit?: boolean;
  }) => {
    let { pos, blocks, tr, commit } = params;
    if (blocks.length === 0) return;
    tr ??= blocksManager.createBlockTransaction({ type: "ui" });
    commit ??= true;
    const indexContext = getIndexContext();

    const { parentId, childIndex } = normalizePos(pos, tr)!;
    const parentBlock = tr.getLatestBlock(parentId)!;
    const parentActuralSrcBlock = getActuralSrcBlock(parentBlock, tr);

    // 创建所有新块的ID
    const newBlockIds = blocks.map((b) => b.id ?? nanoid());

    // 批量添加普通块
    blocks.forEach(({ content, meta, childrenIds }, index) => {
      const id = newBlockIds[index];
      tr!.addBlock({
        id,
        type: "normalBlock",
        parentId,
        childrenIds: childrenIds ?? [],
        fold: false, // 新插入的普通块默认不折叠
        content,
        metadata: meta ?? {},
      });
    });

    // 更新父块的子块列表
    parentActuralSrcBlock.childrenIds.splice(childIndex, 0, ...newBlockIds);
    if (parentActuralSrcBlock.fold) {
      parentActuralSrcBlock.fold = false;
    }
    tr.updateBlock(parentActuralSrcBlock);

    // 为父块的所有镜像和虚拟块创建对应的虚拟块
    const parentOccurs = indexContext!.getOccurs(parentActuralSrcBlock.id, false);
    for (const occur of parentOccurs) {
      const occurBlock = tr.getLatestBlock(occur);
      if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
        continue;

      // 为每个新块创建对应的虚拟块
      const newVirtualIds = newBlockIds.map((srcId) => {
        const newId = nanoid();
        tr!.addBlock({
          id: newId,
          type: "virtualBlock",
          // 虚拟块都先不创建孩子，这不会造成问题
          // 因为我们这里创建的虚拟块都是折叠的，并且标记了 childrenCreated = false
          childrenIds: [],
          fold: true,
          parentId: occurBlock.id,
          src: srcId,
          childrenCreated: false,
        });
        return newId;
      });

      // 批量更新镜像/虚拟块的子块列表
      occurBlock.childrenIds.splice(childIndex, 0, ...newVirtualIds);
      tr.updateBlock(occurBlock);
    }

    // 如果 parent block 是折叠的，则展开它，让我们能看到插入的块
    if (parentBlock.fold) {
      parentBlock.fold = false;
      tr.updateBlock(parentBlock);
    }

    if (commit) tr.commit();
    return { newNormalBlockIds: newBlockIds };
  };

  const insertMirrorBlock = (params: {
    pos: BlockPos;
    srcBlockId: BlockId;
    tr?: BlockTransaction;
    commit?: boolean;
  }) => {
    let { pos, srcBlockId, tr, commit } = params;
    tr ??= blocksManager.createBlockTransaction({ type: "ui" });
    commit ??= true;
    const indexContext = getIndexContext();

    const { parentId, childIndex } = normalizePos(pos, tr)!;
    const parentBlock = tr.getLatestBlock(parentId)!;
    const parentActuralSrcBlock = getActuralSrcBlock(parentBlock, tr);

    const srcBlock = tr.getLatestBlock(srcBlockId)!;
    const srcActuralSrcBlock = getActuralSrcBlock(srcBlock, tr);

    // 创建新的镜像块，镜像块的孩子都是虚拟块，需要一起生成
    const newMirrorBlockId = nanoid();
    const vChildBlockIds: BlockId[] = [];
    for (const childId of srcActuralSrcBlock.childrenIds) {
      const childBlock = tr.getLatestBlock(childId);
      if (!childBlock) continue;
      const vChildBlock: MinimalVirtualBlock = {
        ...childBlock,
        id: nanoid(),
        parentId: newMirrorBlockId,
        type: "virtualBlock",
        fold: true,
        src: childId,
        acturalSrc: "src" in childBlock ? childBlock.src : childBlock.id,
        childrenCreated: false,
      };
      tr.addBlock(vChildBlock);
      vChildBlockIds.push(vChildBlock.id);
    }

    const newMirrorBlock: MinimalMirrorBlock = {
      ...srcBlock,
      id: newMirrorBlockId,
      parentId,
      type: "mirrorBlock",
      childrenIds: vChildBlockIds,
      fold: true,
      src: srcBlockId,
    };
    tr.addBlock(newMirrorBlock);

    parentActuralSrcBlock.childrenIds.splice(childIndex, 0, newMirrorBlock.id);
    tr.updateBlock(parentActuralSrcBlock);

    const parentOccurs = indexContext!.getOccurs(parentActuralSrcBlock.id, false);
    for (const occurId of parentOccurs) {
      const occurBlock = tr.getLatestBlock(occurId);
      if (!occurBlock) continue;
      const newBlock: MinimalVirtualBlock = {
        ...newMirrorBlock,
        id: nanoid(),
        parentId: occurId,
        type: "virtualBlock",
        childrenIds: [],
        fold: true,
        src: newMirrorBlock.id,
        childrenCreated: false,
      };
      if (occurBlock.type === "virtualBlock" && !occurBlock.childrenCreated) continue;
      occurBlock.childrenIds.splice(childIndex, 0, newBlock.id);
      tr.updateBlock(occurBlock);
    }

    // 如果 parent block 是折叠的，则展开它，让我们能看到插入的块
    if (parentBlock.fold) {
      parentBlock.fold = false;
      tr.updateBlock(parentBlock);
    }

    if (commit) tr.commit();
    return {};
  };

  const moveBlock = (params: {
    blockId: BlockId;
    pos: BlockPos;
    tr?: BlockTransaction;
    commit?: boolean;
  }) => {
    let { blockId, pos, tr, commit } = params;
    commit ??= true;
    tr ??= blocksManager.createBlockTransaction({ type: "ui" });
    const indexContext = getIndexContext();

    const { parentId: targetParentId, childIndex: targetChildIndex } = normalizePos(pos, tr)!;

    const block = tr.getLatestBlock(blockId)!;
    const acturalSrcBlock = getActuralSrcBlock(block, tr);
    const acturalSrcParentBlock = tr.getLatestBlock(acturalSrcBlock.parentId)!;

    const targetParentBlock = tr.getLatestBlock(targetParentId)!;
    const targetParentActuralSrcBlock = getActuralSrcBlock(targetParentBlock, tr);

    const index = acturalSrcParentBlock.childrenIds.indexOf(acturalSrcBlock.id);
    if (index == -1) return null;

    let insertIndex;
    if (acturalSrcParentBlock.id === targetParentActuralSrcBlock.id)
      insertIndex = index < targetChildIndex ? targetChildIndex - 1 : targetChildIndex;
    else insertIndex = targetChildIndex;

    if (insertIndex < 0 || insertIndex > targetParentActuralSrcBlock.childrenIds.length) {
      return null;
    }

    // 同级之间移动
    if (acturalSrcParentBlock.id == targetParentActuralSrcBlock.id) {
      // 位置没变，不用管
      if (index == targetChildIndex || index + 1 == targetChildIndex) {
        return null;
      }
      acturalSrcParentBlock.childrenIds.splice(index, 1);
      acturalSrcParentBlock.childrenIds.splice(insertIndex, 0, acturalSrcBlock.id);
      tr.updateBlock(acturalSrcParentBlock);
    } else {
      // 从原来的 parent srcBlock 中删除 srcBlock
      acturalSrcParentBlock.childrenIds.splice(index, 1);
      tr.updateBlock(acturalSrcParentBlock);
      // 将 srcBlock 添加到新的 parent srcBlock 中
      targetParentActuralSrcBlock.childrenIds.splice(insertIndex, 0, acturalSrcBlock.id);
      tr.updateBlock(targetParentActuralSrcBlock);
      // 更新 srcBlock 的 parent
      acturalSrcBlock.parentId = targetParentActuralSrcBlock.id;
      tr.updateBlock(acturalSrcBlock);
    }

    // 同步到所有镜像和虚拟块
    const oldParentOccurs = indexContext!.getOccurs(acturalSrcParentBlock.id, false);
    for (const occurId of oldParentOccurs) {
      const occurBlock = tr.getLatestBlock(occurId);
      if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
        continue;
      const deletedId = occurBlock.childrenIds.splice(index, 1)[0];
      tr.updateBlock(occurBlock);
      tr.deleteBlock(deletedId);
    }

    const newParentOccurs = indexContext!.getOccurs(targetParentActuralSrcBlock.id, false);
    for (const occurId of newParentOccurs) {
      const occurBlock = tr.getLatestBlock(occurId);
      if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
        continue;
      const newVirtualBlock: MinimalVirtualBlock = {
        ...structuredClone(acturalSrcBlock),
        id: nanoid(),
        parentId: occurBlock.id,
        type: "virtualBlock",
        childrenIds: [],
        fold: true,
        src: acturalSrcBlock.id,
        childrenCreated: false,
      };
      occurBlock.childrenIds.splice(insertIndex, 0, newVirtualBlock.id);
      tr.updateBlock(occurBlock);
      tr.addBlock(newVirtualBlock);
    }

    if (commit) tr.commit();

    return {};
  };

  const moveBlocks = (params: {
    blockIds: BlockId[];
    pos: BlockPos;
    tr?: BlockTransaction;
    commit?: boolean;
  }) => {
    let { blockIds, pos, tr, commit } = params;
    commit ??= true;
    tr ??= blocksManager.createBlockTransaction({ type: "ui" });
    const indexContext = getIndexContext();

    const { parentId: targetParentId, childIndex: targetChildIndex } = normalizePos(pos, tr)!;

    // 预检查，blockIds 中要移动的块应该是同一个父块的若干连续子块
    // 下面计算 fromIndex 和 toIndex
    // fromIndex - 要移动的块的第一个块在父块中的位置，inclusive
    // toIndex - 要移动的块的最后一个块在父块中的位置，inclusive
    const blockId0 = blockIds[0];
    const block0 = tr.getLatestBlock(blockId0)!;
    const block0Parent = tr.getLatestBlock(block0.parentId)!;
    const fromIndex = block0Parent.childrenIds.indexOf(blockId0);
    if (fromIndex == -1) return null;
    for (let i = 1; i < blockIds.length; i++) {
      const blockId = blockIds[i];
      const expectedBlockId = block0Parent.childrenIds[fromIndex + i];
      if (blockId !== expectedBlockId) return null;
    }
    const toIndex = fromIndex + blockIds.length - 1; // [fromIndex, toIndex]

    const currParentActuralSrcBlock = getActuralSrcBlock(block0Parent, tr);
    const targetParentBlock = tr.getLatestBlock(targetParentId)!;
    const targetParentActuralSrcBlock = getActuralSrcBlock(targetParentBlock, tr);

    // 同级之间移动
    // 1 (2 3 4) 5 6 | 7 8 9
    // 将 () 中的部分移到 | 的位置时，需要会先删除 () 中的部分
    // 如果 () 在 |左侧，那么再插入时 | 的下标要减去删除部分的长度
    let srcBlockIdsToMove: BlockId[];
    if (currParentActuralSrcBlock.id === targetParentActuralSrcBlock.id) {
      // 先修改 currParentSrcBlock 的 childrenIds
      if (targetChildIndex >= fromIndex && targetChildIndex <= toIndex + 1) return null;
      srcBlockIdsToMove = currParentActuralSrcBlock.childrenIds.splice(fromIndex, blockIds.length);
      const insertIndex =
        targetChildIndex < fromIndex ? targetChildIndex : targetChildIndex - blockIds.length;
      currParentActuralSrcBlock.childrenIds.splice(insertIndex, 0, ...srcBlockIdsToMove);
      tr.updateBlock(currParentActuralSrcBlock);

      // 然后同步到 currParentBlock 的镜像和虚拟块
      const currParentOccurs = indexContext!.getOccurs(currParentActuralSrcBlock.id, false);
      for (const occurId of currParentOccurs) {
        const occurBlock = tr.getLatestBlock(occurId);
        if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
          continue;
        const spliced = occurBlock.childrenIds.splice(fromIndex, blockIds.length);
        occurBlock.childrenIds.splice(insertIndex, 0, ...spliced);
        tr.updateBlock(occurBlock);
      }
    } else {
      // 从原来 parentSrcBlock 中删除 blockIds 中的块
      srcBlockIdsToMove = currParentActuralSrcBlock.childrenIds.splice(fromIndex, blockIds.length);
      tr.updateBlock(currParentActuralSrcBlock);
      // 将删除的块添加到 targetParentActuralSrcBlock 的目标位置
      targetParentActuralSrcBlock.childrenIds.splice(targetChildIndex, 0, ...srcBlockIdsToMove);
      tr.updateBlock(targetParentActuralSrcBlock);
      // 所有被移动块的 parentId 都要改为 targetParentActuralSrcBlock.id
      for (const blockId of srcBlockIdsToMove) {
        const splicedBlock = tr.getLatestBlock(blockId);
        if (!splicedBlock) continue;
        splicedBlock.parentId = targetParentActuralSrcBlock.id;
        tr.updateBlock(splicedBlock);
      }

      // 然后同步更改到所有镜像和虚拟块
      const currParentOccurs = indexContext!.getOccurs(currParentActuralSrcBlock.id, false);
      for (const occurId of currParentOccurs) {
        const occurBlock = tr.getLatestBlock(occurId);
        if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
          continue;
        occurBlock.childrenIds.splice(fromIndex, blockIds.length);
        tr.updateBlock(occurBlock);
      }

      const targetParentOccurs = indexContext!.getOccurs(targetParentActuralSrcBlock.id, false);
      for (const occurId of targetParentOccurs) {
        const occurBlock = tr.getLatestBlock(occurId);
        if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
          continue;
        const newVirtualBlockIds: BlockId[] = [];
        for (const blockId of srcBlockIdsToMove) {
          const block = tr.getLatestBlock(blockId);
          if (!block) continue;
          const newVirtualBlock: MinimalVirtualBlock = {
            ...block,
            id: nanoid(),
            parentId: occurBlock.id,
            type: "virtualBlock",
            childrenIds: [],
            fold: true,
            src: block.id,
            childrenCreated: false,
          };
          newVirtualBlockIds.push(newVirtualBlock.id);
          tr.addBlock(newVirtualBlock);
        }
        occurBlock.childrenIds.splice(targetChildIndex, 0, ...newVirtualBlockIds);
        tr.updateBlock(occurBlock);
      }
    }

    if (commit) tr.commit();

    return {};
  };

  const deleteBlock = (params: { blockId: BlockId; tr?: BlockTransaction; commit?: boolean }) => {
    let { blockId, tr, commit } = params;
    commit ??= true;
    const indexContext = getIndexContext();
    tr ??= blocksManager.createBlockTransaction({ type: "ui" });

    const block = tr.getLatestBlock(blockId);

    // 如果无法获得 block，说明这是一个 missing block
    // missing block 需要特殊处理
    if (!block) {
      const parentId = blocksManager.missingBlockParents.get(blockId);
      if (!parentId) return;
      const parentBlock = tr.getLatestBlock(parentId);
      if (!parentBlock) return;
      const index = parentBlock.childrenIds.indexOf(blockId);
      if (index < 0) return;
      const parentActualSrc = getActuralSrcBlock(parentBlock, tr);
      const parentOccurs = indexContext!.getOccurs(parentActualSrc.id, true);
      for (const occur of parentOccurs) {
        const occurBlock = tr.getLatestBlock(occur);
        if (!occurBlock) continue;
        occurBlock.childrenIds.splice(index, 1);
        tr.updateBlock(occurBlock);
      }
      tr.commit();
      return;
    }

    const blocksToDelete: MinimalBlock[] = [];

    const _deleteBlock = (block: MinimalBlock) => {
      // 1. 删除一个普通块，其所有后代及其镜像块和虚拟块都会删除
      // 2. 删除一个虚拟块，其来源块的所有后代及其镜像块和虚拟块都会删除
      if (block.type == "normalBlock" || block.type == "virtualBlock") {
        const srcActualSrc = getActuralSrcBlock(block, tr);
        const occurs = indexContext!.getOccurs(srcActualSrc.id, true);
        const occurBlocks = occurs
          .map((id) => tr.getLatestBlock(id))
          .filter((b) => b != null) as Block[];
        blocksToDelete.push(...occurBlocks);
        for (const occurBlock of occurBlocks) {
          for (const child of occurBlock.childrenIds) {
            const childBlock = tr.getLatestBlock(child);
            if (!childBlock) continue;
            _deleteBlock(childBlock); // 递归删除
          }
        }
      } else if (block.type == "mirrorBlock") {
        // 3. 删除一个镜像块，其所有后代都会删除，但不会影响其来源块
        blocksToDelete.push(block);
        for (const child of block.childrenIds) {
          const childBlock = tr.getLatestBlock(child);
          if (!childBlock) continue;
          _deleteBlock(childBlock); // 递归删除
        }
      }
    };

    _deleteBlock(block);
    for (const block of blocksToDelete) tr.deleteBlock(block.id);

    // 此外，还需将 blockId 从其父块的孩子中删除
    if (block.type == "normalBlock" || block.type == "virtualBlock") {
      const parentBlock = tr.getLatestBlock(block.parentId);
      if (!parentBlock) return;
      const parentActualSrc = getActuralSrcBlock(parentBlock, tr);
      const index = parentBlock.childrenIds.indexOf(block.id);
      if (index < 0) return;
      const parentOccurs = indexContext!.getOccurs(parentActualSrc.id, true);
      for (const occur of parentOccurs) {
        const occurBlock = tr.getLatestBlock(occur);
        if (!occurBlock) continue;
        occurBlock.childrenIds.splice(index, 1);
        tr.updateBlock(occurBlock);
      }
    } else {
      const parentBlock = tr.getLatestBlock(block.parentId);
      if (!parentBlock) return;
      const index = parentBlock.childrenIds.indexOf(block.id);
      if (index < 0) return;
      parentBlock.childrenIds.splice(index, 1);
      tr.updateBlock(parentBlock);
    }

    if (commit) tr.commit();
  };

  const promoteBlock = (params: { blockId: BlockId; tr?: BlockTransaction; commit?: boolean }) => {
    let { blockId, tr, commit } = params;
    tr ??= blocksManager.createBlockTransaction({ type: "ui" });
    commit ??= true;
    const indexContext = getIndexContext();

    const block = tr.getLatestBlock(blockId)!;
    if (block.id == "root") return { success: false }; // 不能缩进根块
    const srcBlock = getActuralSrcBlock(block, tr);
    const parentBlock = tr.getLatestBlock(block.parentId)!;
    // 注意，srcBlock 的 parent 必须是 normal block
    const parentActuralSrcBlock = getActuralSrcBlock(parentBlock, tr);

    // 找到要缩进的块在父块中的位置
    const index = parentBlock.childrenIds.indexOf(block.id);
    if (index <= 0) return { success: false };

    // 找到要缩进的块的前一个块，找不到的话就无法缩进
    const prevBlock = tr.getLatestBlock(parentBlock.childrenIds[index - 1]);
    if (!prevBlock) return { success: false };
    const prevActuralSrcBlock = getActuralSrcBlock(prevBlock, tr);

    // 将 index-th 块从 parentActuralSrcBlock 中删除，并添加到 prevActuralSrcBlock 中
    const deleted = parentActuralSrcBlock.childrenIds.splice(index, 1)[0];
    const deletedBlock = tr.getLatestBlock(deleted);
    if (!deletedBlock) return { success: false };
    tr.updateBlock(parentActuralSrcBlock);
    prevActuralSrcBlock.childrenIds.push(deleted);
    tr.updateBlock(prevActuralSrcBlock);
    deletedBlock.parentId = prevActuralSrcBlock.id; // 更新 deletedBlock 的 parent
    tr.updateBlock(deletedBlock);

    // 同步到 parentActuralSrcBlock 的所有镜像和虚拟块
    const parentOccurs = indexContext!.getOccurs(parentActuralSrcBlock.id, false);
    for (const occurId of parentOccurs) {
      const occurBlock = tr.getLatestBlock(occurId);
      if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
        continue;
      const deletedId = occurBlock.childrenIds.splice(index, 1)[0];
      tr.updateBlock(occurBlock);
      tr.deleteBlock(deletedId);
    }

    // 同步到 prevActuralSrcBlock 的所有镜像和虚拟块
    const prevOccurs = indexContext!.getOccurs(prevActuralSrcBlock.id, false);
    for (const occurId of prevOccurs) {
      const occurBlock = tr.getLatestBlock(occurId);
      if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
        continue;
      const newVirtualBlock = {
        ...srcBlock,
        id: nanoid(),
        parentId: occurBlock.id,
        type: "virtualBlock",
        fold: true,
        src: srcBlock.id,
        childrenCreated: false,
      } as const;
      occurBlock.childrenIds.push(newVirtualBlock.id);
      if (occurId == prevBlock.id) {
        occurBlock.fold = false;
      }
      tr.updateBlock(occurBlock);
      tr.addBlock(newVirtualBlock);
    }

    if (prevBlock.fold) {
      prevBlock.fold = false;
      tr.updateBlock(prevBlock);
    }

    if (commit) tr.commit();

    return { success: true };
  };

  const demoteBlock = (params: { blockId: BlockId; tr?: BlockTransaction; commit?: boolean }) => {
    let { blockId, tr, commit } = params;
    tr ??= blocksManager.createBlockTransaction({ type: "ui" });
    commit ??= true;
    const indexContext = getIndexContext();

    const block = tr.getLatestBlock(blockId)!;
    if (block.parentId == "root") return { success: false };
    const acturalSrcBlock = getActuralSrcBlock(block, tr);

    const parentBlock = tr.getLatestBlock(block.parentId)!;
    if (parentBlock.id == "root") return { success: false };
    const parentActuralSrcBlock = getActuralSrcBlock(parentBlock, tr);

    const parentParentBlock = tr.getLatestBlock(parentBlock.parentId)!;
    const parentParentActuralSrcBlock = getActuralSrcBlock(parentParentBlock, tr);

    // Example 1.
    // - block1                              Desirable:  - block1
    //   - block2                                        - block3
    // - block3                                            - block1 [mirror]
    //   - block1 [mirror]                                 - block2
    //     - block2 [virtual] <-- demote this
    //
    // Example2.
    // - block2                              Desirable:  - block2
    // - block1                                          - block1
    //   - block2 [mirror]                               - block3
    // - block3                                            - block1 [mirror]
    //   - block1 [mirror]                                 - block2 [mirror]
    //     - block2 [virtual] <-- demote this

    // delete srcBlock from its parent
    const index1 = parentActuralSrcBlock.childrenIds.indexOf(acturalSrcBlock.id);
    const deleted = parentActuralSrcBlock.childrenIds.splice(index1, 1)[0];
    const deletedBlock = tr.getLatestBlock(deleted);
    if (!deletedBlock) return { success: false };
    tr.updateBlock(parentActuralSrcBlock);

    let index2;
    if (parentBlock.type == "mirrorBlock" && parentParentBlock.type == "normalBlock") {
      // actually, parentParentBlock must be NormalBlock
      // append block to new parent, right after parentBlock
      index2 = parentParentBlock.childrenIds.indexOf(parentBlock.id);
      parentParentBlock.childrenIds.splice(index2 + 1, 0, deleted);
      tr.updateBlock(parentParentBlock);

      // change parent of srcBlock
      deletedBlock.parentId = parentParentBlock.id;
      tr.updateBlock(deletedBlock);
    } else {
      // append srcBlock to new parent, right after parentSrcBlock
      index2 = parentParentActuralSrcBlock.childrenIds.indexOf(parentActuralSrcBlock.id);
      parentParentActuralSrcBlock.childrenIds.splice(index2 + 1, 0, deleted);
      tr.updateBlock(parentParentActuralSrcBlock);

      // change parent of srcBlock
      deletedBlock.parentId = parentParentActuralSrcBlock.id;
      tr.updateBlock(deletedBlock);
    }

    // sync to all the mirrors and virtuals
    const parentOccurs = indexContext!.getOccurs(parentActuralSrcBlock.id, false);
    for (const occurId of parentOccurs) {
      const occurBlock = tr.getLatestBlock(occurId);
      if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
        continue;
      const deletedId = occurBlock.childrenIds.splice(index1, 1)[0];
      tr.updateBlock(occurBlock);
      tr.deleteBlock(deletedId);
      // state.deleteVirtual(srcBlock.id, deletedId);
    }

    const parentParentOccurs = indexContext!.getOccurs(parentParentActuralSrcBlock.id, false);
    for (const occurId of parentParentOccurs) {
      const occurBlock = tr.getLatestBlock(occurId);
      if (!occurBlock || (occurBlock.type == "virtualBlock" && !occurBlock.childrenCreated))
        continue;
      const newVirtualBlock = {
        ...acturalSrcBlock,
        id: nanoid(),
        parentId: occurBlock.id,
        type: "virtualBlock",
        fold: true,
        src: acturalSrcBlock.id,
        childrenCreated: false,
      } as const;
      occurBlock.childrenIds.splice(index2 + 1, 0, newVirtualBlock.id);
      tr.updateBlock(occurBlock);
      tr.addBlock(newVirtualBlock);
    }

    if (commit) tr.commit();

    return { success: true };
  };

  const locateBlock = async (blockId: BlockId, blockTree?: BlockTree) => {
    const rootBlockIds = [mainRootBlockId.value!];
    const targetPath = blocksManager.getBlockPath(blockId);
    if (targetPath == null) return;

    // 找到合适的 rootBlockId
    let rootBlockId, index;
    for (const id of rootBlockIds) {
      index = targetPath.findIndex((block) => block.id === id);
      if (index != -1) {
        rootBlockId = id;
        break;
      }
    }

    // 找到了合适的 rootBlockId？
    // 则从根块开始，一路展开即可看到目标块
    if (rootBlockId && index != null && index > 0) {
      let changed = false;
      for (let i = index; i > 0; i--) {
        const block = targetPath[i];
        if (block.fold) {
          changed = true;
          await toggleFold(block.id, false);
        }
      }
    } else {
      // 计算合适的 blockId，仅用于 main tree
      if (blockTree?.getId() !== "main") return;
      const rootPath = blocksManager.getBlockPath(rootBlockIds[0]);
      if (!rootPath) return;
      // targetPath 和 rootPath 的最近公共祖先就是最合适的 mainRootBlockId
      let i = rootPath.length - 1,
        j = targetPath.length - 1;
      while (i >= 0 && j >= 0) {
        if (rootPath[i].id != targetPath[j].id) break;
        i--;
        j--;
      }
      const newRoot = i < 0 ? rootPath[0] : j < 0 ? targetPath[0] : rootPath[i + 1];
      const blocksToExpand =
        i < 0 ? targetPath.slice(0, j + 1) : j < 0 ? rootPath.slice(0, i + 1) : targetPath.slice(j);
      mainRootBlockId.value = newRoot.id;
      for (const block of blocksToExpand) {
        if (block.fold) {
          await toggleFold(block.id, false);
        }
      }
    }
  };

  return {
    normalizePos,
    changeBlockContent,
    setBlockMetadata,
    insertNormalBlock,
    insertNormalBlocks,
    insertMirrorBlock,
    deleteBlock,
    promoteBlock,
    demoteBlock,
    toggleFold,
    moveBlock,
    moveBlocks,
    locateBlock,
  };
};

export type BlocksEditor = ReturnType<typeof createBlocksEditor>;
