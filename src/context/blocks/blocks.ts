import { createContext } from "@/utils/createContext";
import { createSyncLayer } from "./sync-layer/syncLayer";
import { createBlocksManager } from "./view-layer/blocksManager";
import { createBlocksEditor } from "./view-layer/blocksEditor";
import { useRouterParams } from "@/utils/routerParams";
import { computed, watch } from "vue";
import ServerInfoContext from "../serverInfo";
import kbViewRegistry from "../kbViewRegistry";
import type IndexContext from "..";
import MainTreeContext from "../mainTree";

export const BlocksContext = createContext(() => {
  const params = useRouterParams();
  const { token } = ServerInfoContext.useContext()!;
  const { get } = kbViewRegistry.useContext()!;
  const { mainRootBlockId } = MainTreeContext.useContext()!;
  const getIndexContext = () => get<ReturnType<typeof IndexContext.useContext>>("index");

  const syncLayer = createSyncLayer();
  const blocksManager = createBlocksManager(syncLayer);
  const blockEditor = createBlocksEditor(blocksManager, mainRootBlockId, getIndexContext);

  watch(
    params,
    (newParams) => {
      syncLayer.disconnect();
      const { serverUrl, location } = newParams ?? {};
      if (!serverUrl || !location || !token.value) return;
      syncLayer.connect(decodeURIComponent(serverUrl), decodeURIComponent(location), token.value);
    },
    { immediate: true },
  );

  const ctx = {
    blocksManager,
    blockEditor,
    syncLayer,
    synced: blocksManager.synced,
  };
  globalThis.getBlocksContext = () => ctx;
  return ctx;
});

export default BlocksContext;
