import { createContext } from "@/utils/createContext";
import axios from "axios";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { watch } from "vue";
import { useLocalStorage } from "@vueuse/core";

export const ServerInfoContext = createContext(() => {
  // 使用 localStorage 存储 token
  const token = useLocalStorage("token", "");
  const serverUrl = ref<string>("");
  const route = useRoute();

  const tokenPayload = computed(() => {
    if (!token.value) return null;
    const base64Url = token.value.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  });

  // 监听路由参数中的 serverUrl，并更新 serverUrl
  watch(
    () => route.params.serverUrl,
    (newServerUrl) => {
      if (newServerUrl != null) serverUrl.value = newServerUrl as string;
      else serverUrl.value = "";
    },
    { immediate: true },
  );

  const axiosInstance = computed(() => {
    return axios.create({
      baseURL: `http://${serverUrl.value}`,
      timeout: 10000,
      headers: {
        Authorization: token.value,
      },
    });
  });

  const getAxios = () => {
    return axiosInstance.value;
  };

  const ctx = {
    token,
    tokenPayload,
    serverUrl,
    getAxios,
  };

  // 通过 globalThis 暴露给组件外使用
  globalThis.getAxios = getAxios;
  globalThis.getServerInfoContext = () => ctx;

  return ctx;
});

export default ServerInfoContext;
