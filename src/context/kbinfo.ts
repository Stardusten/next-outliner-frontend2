import { getAllKbInfo } from "@/common/api-call/kb";
import type { Resp } from "@/common/type-and-schemas/resp";
import { createContext } from "@/utils/createContext";
import { useRouterParams } from "@/utils/routerParams";
import { computed, ref, watch } from "vue";

type KbInfo = {
  name: string;
  location: string;
};

export const KbInfoContext = createContext(() => {
  const kbs = ref<Record<string, KbInfo>>({});
  const params = useRouterParams();

  const currKbInfo = computed(() => {
    const location = params.value?.location;
    if (location == null) return null;
    return kbs.value[location] ?? null;
  });
  const location = computed(() => params.value?.location);

  const refreshKbList = async (
    url: string,
    onSuccess?: (resp: Resp<KbInfo[]> & { success: true }) => void,
    onError?: (resp: Resp<KbInfo[]> & { success: false }) => void,
  ) => {
    const resp = await getAllKbInfo({});
    if (!resp.success) {
      onError?.(resp);
      return;
    }
    kbs.value = resp.data.reduce(
      (acc, kb) => {
        acc[kb.location] = { name: kb.name, location: kb.location };
        return acc;
      },
      {} as Record<string, KbInfo>,
    );
    onSuccess?.(resp);
  };

  // 监听路由参数中的 serverUrl，并更新知识库列表
  watch(
    () => params.value?.serverUrl,
    () => {
      const serverUrl = params.value?.serverUrl;
      if (serverUrl == null) return;
      refreshKbList(serverUrl);
    },
    { immediate: true },
  );

  return {
    kbs,
    refreshKbList,
    currKbInfo,
    location,
  };
});
