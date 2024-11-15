import { createContext } from "@/utils/createContext";
import { createYjsLayer } from "./yjsLayer";
import { createBlocksManager } from "./blocksManager";
import { createBlocksEditor } from "./blocksEditor";
import { createFulltextSearch } from "./fulltextsearch";
import { useRouterParams } from "@/utils/routerParams";
import { watch } from "vue";
import TokenContext from "../token";

export const BlocksContext = createContext(() => {
  const params = useRouterParams();
  const { token } = TokenContext.useContext();
  const yjsLayer = createYjsLayer();
  const blocksManager = createBlocksManager(yjsLayer);
  const blockEditor = createBlocksEditor(blocksManager);
  const fulltextSearch = createFulltextSearch(blocksManager);

  watch(
    params,
    (newParams) => {
      yjsLayer.disconnect();
      const { serverUrl, location } = newParams ?? {};
      if (!serverUrl || !location || !token.value) return;
      yjsLayer.connect(decodeURIComponent(serverUrl), decodeURIComponent(location), token.value);
    },
    { immediate: true },
  );

  const ctx = {
    blocksManager,
    blockEditor,
    fulltextSearch,
    yjsLayer,
    synced: yjsLayer.allSyncedRef,
  };
  // 通过 globalThis 暴露给组件外使用
  globalThis.getBlocksContext = () => ctx;
  return ctx;
});

export default BlocksContext;
