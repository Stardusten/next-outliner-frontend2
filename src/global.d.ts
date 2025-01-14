import type ServerInfoContext from "./context/serverInfo";
import type BlocksContext from "./context/blocks/blocks";

export declare global {
  var getAxios: () => AxiosInstance | undefined;
  var getServerInfoContext: () => ReturnType<typeof ServerInfoContext.useContext> | undefined;

  // debug only
  var getBlocksContext: () => ReturnType<typeof BlocksContext.useContext> | undefined;
}
