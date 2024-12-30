import type { BlockData } from "@/common/type-and-schemas/block/block-data";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type { BlockInfo } from "@/common/type-and-schemas/block/block-info";
import { timeout } from "@/utils/time";
import { LoroDoc, type LoroMap } from "loro-crdt";
import { type BlockOrigin } from "../view-layer/blocksManager";
import { WebsocketClientNetwork } from "./wsClientNetwork";
import { LoroWebsocketSynchronizer, type SyncStatus_Internal } from "./wsSynchronizer";
import {
  BLOCK_DATA_DOC_NAME_PREFIX,
  BLOCK_DATA_MAP_NAME,
  BLOCK_INFO_DOC_NAME,
  BLOCK_INFO_MAP_NAME,
} from "@/common/constants";

///////////////////////////////////////////////////////////////////
// syncWorker 是同步层的实现，负责与服务端通信
// 它独立运行在 worker 中，可以防止阻塞主线程
///////////////////////////////////////////////////////////////////

export type SyncLayerPatch =
  | { op: "upsertBlockInfo"; blockId: BlockId; blockInfo: BlockInfo }
  | { op: "deleteBlockInfo"; blockId: BlockId }
  | { op: "upsertBlockData"; docId: number; blockId: BlockId; blockData: BlockData }
  | { op: "deleteBlockData"; docId: number; blockId: BlockId };

// 同步层事务，外界如果希望将客户端状态同步到服务端
// 则需要将更改表示为事务，事务包含多个 patch
// 然后通过 postYjsLayerTransaction 发进来
export type SyncLayerTransaction = {
  patches: SyncLayerPatch[];
  origin: BlockOrigin;
};

// 所有外界发进来的消息类型
export type SyncWorkerInMsg =
  | { type: "connect"; serverUrl: string; location: string; token: string }
  | { type: "disconnect" }
  | { type: "loadDataDoc"; docId: number }
  | { type: "unloadDataDoc"; docId: number }
  | { type: "postYjsLayerTransaction"; transaction: SyncLayerTransaction };

export type MapChange = { op: "upsert"; key: string; value: any } | { op: "delete"; key: string };

// 所有发出去的消息类型
export type SyncWorkerOutMsg =
  // syncWorker 初始化完成，在此之间不应该向 syncWorker 发送消息，发了也不会处理
  | { type: "init" }
  // 通知一个文档的同步状态
  | ({ type: "syncStatus" } & (
      | { syncStatus: "disconnected" }
      | { syncStatus: "synced"; docId: string }
    ))
  | { type: "dataDocCreated"; docId: number }
  | { type: "blockInfoMapChange"; origin: BlockOrigin; changes: MapChange[] }
  | { type: "blockDataMapChange"; docId: number; origin: BlockOrigin; changes: MapChange[] };

// 用于向外界发送消息，就是包装了 postMessage 加上类型检查
const postTypedMessage = (msg: SyncWorkerOutMsg) => {
  postMessage(msg);
};

let serverUrl: string | undefined;
let location: string | undefined;
let token: string | undefined;
let wsSynchronizer: LoroWebsocketSynchronizer | undefined;
let baseDoc: LoroDoc | undefined;
let blockInfoMap: LoroMap<Record<string, BlockInfo>> | undefined;
let blockDataDocs: Map<number, LoroDoc> | undefined;

// 响应外界的 message，派发到各个处理函数
addEventListener("message", (message) => {
  const msg = message.data as SyncWorkerInMsg;
  switch (msg.type) {
    case "connect":
      connect(msg.serverUrl, msg.location, msg.token);
      break;
    case "disconnect":
      disconnect();
      break;
    case "loadDataDoc":
      loadDataDoc(msg.docId);
      break;
    case "unloadDataDoc":
      unloadDataDoc(msg.docId);
      break;
    case "postYjsLayerTransaction":
      postSyncLayerTransaction(msg.transaction);
      break;
  }
});

const disconnect = () => {
  wsSynchronizer?.disconnect();
  wsSynchronizer?.destroy();
  baseDoc = undefined;
  blockInfoMap = undefined;
  blockDataDocs = undefined;
  wsSynchronizer = undefined;
};

const connect = (serverUrl_: string, location_: string, token_: string) => {
  disconnect();
  console.log("[syncWorker] connect", serverUrl_, location_, token_);

  serverUrl = serverUrl_;
  location = location_;
  token = token_;

  baseDoc = new LoroDoc();
  blockInfoMap = baseDoc.getMap(BLOCK_INFO_MAP_NAME) as LoroMap<Record<string, BlockInfo>>;
  blockDataDocs = new Map();

  blockInfoMap.subscribe((eb) => {
    const origin = { type: eb.by === "local" ? "ui" : "remote" } as const; // TODO

    const changes: MapChange[] = [];
    for (const e of eb.events) {
      if (e.diff.type !== "map") continue;
      for (const [key, value] of Object.entries(e.diff.updated)) {
        if (value === undefined) changes.push({ op: "delete", key });
        else changes.push({ op: "upsert", key, value });
      }
    }

    postTypedMessage({
      type: "blockInfoMapChange",
      origin,
      changes,
    });
  });

  (async () => {
    // XXX: refactor, 将 url params 放一起
    const wsNetwork = new WebsocketClientNetwork({ location, authorization: token });
    wsSynchronizer = new LoroWebsocketSynchronizer(`ws://${serverUrl}`, wsNetwork);
    wsSynchronizer.connect();
    wsSynchronizer.addLoroDoc(BLOCK_INFO_DOC_NAME, baseDoc);
    wsSynchronizer.on("status", (status) => {
      console.log("[syncWorker] wsSynchronizer status", status);
      postTypedMessage({ type: "syncStatus", ...status });
    });
  })();
};

const loadDataDoc = (docId: number) => {
  if (!blockDataDocs) {
    console.error("[syncWorker] 数据文档未初始化，先 connect 以初始化");
    return;
  }
  if (blockDataDocs.has(docId)) return blockDataDocs.get(docId);
  const dataDoc = new LoroDoc();
  const blockDataMap = dataDoc.getMap(BLOCK_DATA_MAP_NAME);
  blockDataDocs.set(docId, dataDoc);
  postTypedMessage({ type: "dataDocCreated", docId });

  blockDataMap.subscribe((eb) => {
    const origin = { type: eb.by === "local" ? "ui" : "remote" } as const; // TODO

    const changes: MapChange[] = [];
    for (const e of eb.events) {
      if (e.diff.type !== "map") continue;
      for (const [key, value] of Object.entries(e.diff.updated)) {
        if (value === undefined) changes.push({ op: "delete", key });
        else changes.push({ op: "upsert", key, value });
      }
    }

    postTypedMessage({
      type: "blockDataMapChange",
      docId,
      origin,
      changes,
    });
  });

  (async () => {
    // 使用 wsSynchronizer 同步
    console.log("[syncWorker] dataDoc 加入 wsSynchronizer，开始同步");
    await timeout(1000);
    wsSynchronizer?.addLoroDoc(BLOCK_DATA_DOC_NAME_PREFIX + docId, dataDoc);
  })();

  return dataDoc;
};

const unloadDataDoc = (docId: number) => {
  console.error("[syncWorker] Not implemented");
};

const postSyncLayerTransaction = (tr: SyncLayerTransaction) => {
  if (!baseDoc || !blockInfoMap) {
    console.error("[syncWorker] baseDoc or blockInfoMap is null, cannot commit");
    return;
  }
  // 先处理 blockInfoMap 的变更
  if (!blockInfoMap) return;
  for (const p of tr.patches) {
    if (p.op === "upsertBlockInfo") {
      blockInfoMap.set(p.blockId, p.blockInfo);
    } else if (p.op === "deleteBlockInfo") {
      blockInfoMap.delete(p.blockId);
    }
  }
  console.log("[syncWorker] Commit blockInfoMap transaction");
  baseDoc.commit();
  // 再处理 blockData 的变更
  // 将所有对同一个文档的变更合到一起
  const doc2patches = new Map<number, SyncLayerPatch[]>();
  for (const p of tr.patches) {
    if (p.op === "upsertBlockData" || p.op === "deleteBlockData") {
      const patches = doc2patches.get(p.docId);
      if (!patches) {
        doc2patches.set(p.docId, [p]);
      } else {
        patches.push(p);
      }
    }
  }
  for (const [docId, patches] of doc2patches.entries()) {
    const dataDoc = loadDataDoc(docId);
    if (!dataDoc) continue;
    // 每个文档分别事务
    const blockDataMap = dataDoc.getMap(BLOCK_DATA_MAP_NAME);
    for (const p of patches) {
      if (p.op === "upsertBlockData") {
        blockDataMap.set(p.blockId, p.blockData);
      } else if (p.op === "deleteBlockData") {
        blockDataMap.delete(p.blockId);
      }
    }
    console.log("[syncWorker] Commit blockDataMap transaction, docId:", docId);
    dataDoc.commit();
  }
};

// 同步层初始化完成，在此之后可以向 syncWorker 发送消息
postTypedMessage({ type: "init" });
