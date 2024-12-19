import { shallowRef, type ShallowRef } from "vue";
import {
  BLOCK_DATA_MAP_NAME,
  BlockOriginSchema,
  type AddBlockParams,
  type Block,
  type BlockOrigin,
  type BlockPatch,
  type BlockTransaction,
  type BlockTransactionMeta,
  type MirrorBlock,
  type NormalBlock,
  type TransactionEnvInfo,
  type VirtualBlock,
} from "./blocksManager";
import type { BlockContent, BlockData, BlockId, BlockInfo } from "@/common/types";
import type { YjsLayer, YjsLayerTransaction } from "../sync-layer/yjsLayer";
import { useEventBus } from "@/plugins/eventbus";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { calcBlockStatus } from "@/common/block";
import * as Y from "yjs";

type BlockTransactionContext = {
  blocks: Map<BlockId, ShallowRef<Block | null>>;
  yjsLayer: YjsLayer;
  getBlockRef: (blockId: BlockId) => ShallowRef<Block | null>;
  getCtext: (content: BlockContent, includeTags?: boolean) => string;
  getMtext: (metadata: any) => string;
  getOlinks: (docContent: any) => string[];
};

function useBlockTransaction(context: BlockTransactionContext) {
  const { blocks, yjsLayer, getBlockRef, getCtext, getMtext, getOlinks } = context;
  const eventBus = useEventBus();

  const createBlockTransaction = (origin: BlockOrigin) => {
    const tr: BlockTransaction = {
      origin,
      patches: [],
      reversePatches: [],
      meta: {
        isUndoRedo: false,
        autoAddUndoPoint: true,
        canUndo: true,
        envUndoStrategy: "beforeCommit",
      },
      envInfo: {
        onCreate: captureEnvInfo(), // 创建事务时，捕获环境信息
        beforeCommit: null,
        afterCommit: null,
      },
      addBlock: <T extends AddBlockParams>(block: T) => {
        tr.patches.push({ op: "add", block });
        tr.reversePatches.push({ op: "delete", blockId: block.id });
        return tr;
      },
      updateBlock: <T extends AddBlockParams>(block: T) => {
        const oldBlock = blocks.get(block.id)?.value;
        if (!oldBlock) {
          throw new Error(`Cannot find old block ${block.id}, maybe you should add it first?`);
        }
        tr.patches.push({ op: "update", block });
        tr.reversePatches.push({
          op: "update",
          block: _toBlockParams(oldBlock),
        });
        return tr;
      },
      deleteBlock: (blockId: BlockId) => {
        const oldBlock = blocks.get(blockId)?.value;
        if (!oldBlock) {
          throw new Error(`Cannot find old block ${blockId}, maybe you should add it first?`);
        }
        tr.patches.push({ op: "delete", blockId });
        tr.reversePatches.push({ op: "add", block: _toBlockParams(oldBlock) });
        return tr;
      },
      commit: () => {
        tr.envInfo.beforeCommit = captureEnvInfo(); // 提交事务前，捕获环境信息
        commitBlockTransaction(tr);
        tr.envInfo.afterCommit = captureEnvInfo(); // 提交事务后，捕获环境信息
      },
      setMeta: (key: string, value: any) => {
        tr.meta[key] = value;
        return tr;
      },
      addTransaction: (tr2: BlockTransaction) => {
        tr.patches.push(...tr2.patches);
        tr.reversePatches.push(...tr2.reversePatches);
        return tr;
      },
      addReverseTransaction: (tr2: BlockTransaction) => {
        tr.patches.push(...tr2.reversePatches);
        tr.reversePatches.push(...tr2.patches);
        return tr;
      },
    };
    return tr;
  };

  const captureEnvInfo = () => {
    const rootBlockId = getMainTreeContext()!.mainRootBlockId.value;
    const lastFocusContext = getLastFocusContext()!;
    const focusedBlockId = lastFocusContext.lastFocusedBlockId.value ?? null;
    const view = lastFocusContext.lastFocusedEditorView.value;
    const sel = view?.state.selection.toJSON();
    const undoPointInfo: TransactionEnvInfo = {
      focusedBlockId,
      selection: sel,
      rootBlockId,
    };
    return undoPointInfo;
  };

  const commitBlockTransaction = (transaction: BlockTransaction) => {
    const { origin, patches } = transaction;
    console.debug("Committing transaction with origin:", origin, "and patches:", patches);

    // 所有对 yjs 层的操作通过 yjs 事务进行
    const yjsTr = yjsLayer.createYjsLayerTransaction(transaction.origin);

    if (!yjsLayer.blockInfoMap.value) return;
    for (const patch of patches) {
      const { op } = patch;

      // 1. 新增块
      // 2. 更新块
      if (op == "add" || op == "update") {
        const blockParams = patch.block;
        const block = Object.assign({ origin }, _fromBlockParams(blockParams)) as Block;
        if (block) _upsertBlock(block.id, block, yjsTr);
      }

      // 3. 删除块
      else if (op == "delete") {
        const { blockId } = patch;
        _deleteBlock(blockId, yjsTr);
      }
    }

    // 提交 yjs 层事务
    yjsTr.commit();

    eventBus.emit("afterBlocksTrCommit", [transaction]);
  };

  const _toBlockParams = <T extends AddBlockParams>(block: T): AddBlockParams => {
    if (block.type == "normalBlock") {
      return {
        type: "normalBlock",
        id: block.id,
        fold: block.fold,
        parentId: block.parentId,
        childrenIds: block.childrenIds,
        content: block.content,
        metadata: block.metadata,
      };
    } else if (block.type == "mirrorBlock") {
      return {
        type: block.type,
        id: block.id,
        fold: block.fold,
        parentId: block.parentId,
        childrenIds: block.childrenIds,
        src: block.src,
      };
    } else if (block.type == "virtualBlock") {
      return {
        type: block.type,
        id: block.id,
        fold: block.fold,
        parentId: block.parentId,
        childrenIds: block.childrenIds,
        src: block.src,
        childrenCreated: block.childrenCreated,
      };
    }
    throw new Error("Invalid block type");
  };

  // origin 在块事务中根据块事务的 origin 设定
  const _fromBlockParams = (blockParams: AddBlockParams): Omit<Block, "origin"> | null => {
    if (blockParams.type == "normalBlock") {
      const ret: Omit<NormalBlock, "origin"> = {
        type: "normalBlock",
        id: blockParams.id,
        parentId: blockParams.parentId,
        parentRef: getBlockRef(blockParams.parentId),
        childrenIds: blockParams.childrenIds,
        childrenRefs: blockParams.childrenIds.map((id) => getBlockRef(id)),
        fold: blockParams.fold,
        deleted: false,
        content: blockParams.content,
        ctext: getCtext(blockParams.content),
        metadata: blockParams.metadata,
        mtext: getMtext(blockParams.metadata),
        olinks:
          blockParams.content[0] === BLOCK_CONTENT_TYPES.TEXT
            ? getOlinks(blockParams.content[1])
            : [],
        boosting: 0,
        acturalSrc: blockParams.id,
        docId: 0, // TODO decide which docId to use
      } as const;
      return ret;
    } else if (blockParams.type == "mirrorBlock") {
      const srcBlock = getBlockRef(blockParams.src).value;
      if (!srcBlock) {
        // XXX maybe move to autoRetryGet?
        console.error(`mirror block ${blockParams.id} 的源块 ${blockParams.src} 不存在`);
        return null;
      }
      const ret: Omit<MirrorBlock, "origin"> = {
        type: "mirrorBlock",
        id: blockParams.id,
        parentId: blockParams.parentId,
        parentRef: getBlockRef(blockParams.parentId),
        childrenIds: blockParams.childrenIds,
        childrenRefs: blockParams.childrenIds.map((id) => getBlockRef(id)),
        fold: blockParams.fold,
        deleted: false,
        content: blockParams.content ?? srcBlock.content,
        ctext: getCtext(blockParams.content),
        metadata: blockParams.metadata ?? srcBlock.metadata,
        mtext: getMtext(blockParams.metadata),
        olinks:
          blockParams.content[0] === BLOCK_CONTENT_TYPES.TEXT
            ? getOlinks(blockParams.content[1])
            : [],
        boosting: blockParams.boosting ?? srcBlock.boosting,
        acturalSrc: blockParams.acturalSrc ?? srcBlock.acturalSrc,
        src: blockParams.src,
      } as const;
      return ret;
    } else if (blockParams.type == "virtualBlock") {
      const srcBlock = getBlockRef(blockParams.src).value;
      if (!srcBlock) {
        // XXX maybe move to autoRetryGet?
        console.error(`virtual block ${blockParams.id} 的源块 ${blockParams.src} 不存在`);
        return null;
      }
      const ret: Omit<VirtualBlock, "origin"> = {
        type: "virtualBlock",
        id: blockParams.id,
        parentId: blockParams.parentId,
        parentRef: getBlockRef(blockParams.parentId),
        childrenIds: blockParams.childrenIds,
        childrenRefs: blockParams.childrenIds.map((id) => getBlockRef(id)),
        fold: blockParams.fold,
        deleted: false,
        content: blockParams.content ?? srcBlock.content,
        ctext: getCtext(blockParams.content),
        metadata: blockParams.metadata ?? srcBlock.metadata,
        mtext: getMtext(blockParams.metadata),
        olinks:
          blockParams.content[0] === BLOCK_CONTENT_TYPES.TEXT
            ? getOlinks(blockParams.content[1])
            : [],
        boosting: blockParams.boosting ?? srcBlock.boosting,
        acturalSrc: blockParams.acturalSrc ?? srcBlock.acturalSrc,
        src: blockParams.src,
        childrenCreated: blockParams.childrenCreated,
      } as const;
      return ret;
    }
    throw new Error("Invalid block type");
  };

  // Executors
  const _upsertBlock = (blockId: BlockId, block: Block | null, yjsTr: YjsLayerTransaction) => {
    if (!yjsLayer.blockInfoMap.value) return;

    ///// 1. 更新 blocks
    const oldBlock = blocks.get(blockId)?.value;
    if (blocks.has(blockId)) {
      blocks.get(blockId)!.value = block;
    } else {
      const blockRef = shallowRef(block) as ShallowRef<Block | null>;
      blocks.set(blockId, blockRef);
    }

    ///// 2. 推送更新到 yjs 层
    if (block) {
      const oldBlockInfo = yjsLayer.blockInfoMap.value.get(blockId);
      const newBlockInfo: BlockInfo = [
        calcBlockStatus(block.type, block.fold),
        block.parentId,
        block.childrenIds,
        "docId" in block ? block.docId : null,
        "src" in block ? block.src : null,
      ] as const;
      // 如果旧信息不存在，或者新旧信息不同，则更新
      if (!oldBlockInfo || JSON.stringify(oldBlockInfo) != JSON.stringify(newBlockInfo)) {
        yjsTr.upsertBlockInfo(blockId, newBlockInfo);
      }

      // 如果是 normal block，还需要更新块数据
      if (block.type == "normalBlock") {
        const blockDataDoc = yjsLayer.getDataDoc(block.docId);
        const blockDataMap = blockDataDoc?.getMap<BlockData>(BLOCK_DATA_MAP_NAME);
        if (blockDataDoc && blockDataMap) {
          const oldBlockData = blockDataMap.get(blockId);
          const newBlockData: BlockData = [block.content, block.metadata] as const;
          // 如果旧数据不存在，或者新旧数据不同，则更新
          if (!oldBlockData || JSON.stringify(oldBlockData) != JSON.stringify(newBlockData)) {
            yjsTr.upsertBlockData(block.docId, blockId, newBlockData);
          }
        }
      }

      // 如果旧块是普通块，而新块不是普通块，则删除旧块数据
      if (oldBlock?.type == "normalBlock" && block.type != "normalBlock") {
        const blockDataDoc = yjsLayer.getDataDoc(oldBlock.docId);
        const blockDataMap = blockDataDoc?.getMap<BlockData>(BLOCK_DATA_MAP_NAME);
        if (blockDataDoc && blockDataMap) {
          yjsTr.deleteBlockData(oldBlock.docId, blockId);
        }
      }
    }
  };

  const _deleteBlock = (blockId: BlockId, yjsTr: YjsLayerTransaction) => {
    if (!yjsLayer.blockInfoMap.value) return;
    const oldBlock = blocks.get(blockId)?.value;

    if (oldBlock) {
      ///// 1. 更新 blocks
      oldBlock.deleted = true;
      blocks.delete(blockId);

      ///// 2. 推送更新到 yjs 层
      // 从 blockInfoMap 中删除块信息
      yjsTr.deleteBlockInfo(blockId);
      // 如果有关联的块数据，也一并删除
      if (oldBlock.type == "normalBlock") {
        const blockDataDoc = yjsLayer.getDataDoc(oldBlock.docId);
        const blockDataMap = blockDataDoc?.getMap<BlockData>(BLOCK_DATA_MAP_NAME);
        if (blockDataMap) {
          yjsTr.deleteBlockData(oldBlock.docId, blockId);
        }
      }
    }
  };

  // helper functions for creating and executing block transaction
  const addBlock = (block: AddBlockParams, origin: BlockOrigin) => {
    return createBlockTransaction(origin).addBlock(block).commit();
  };

  const updateBlock = (block: AddBlockParams, origin: BlockOrigin) => {
    return createBlockTransaction(origin).updateBlock(block).commit();
  };

  const deleteBlock = (blockId: BlockId, origin: BlockOrigin) => {
    return createBlockTransaction(origin).deleteBlock(blockId).commit();
  };

  return { createBlockTransaction, addBlock, updateBlock, deleteBlock };
}

export default useBlockTransaction;
