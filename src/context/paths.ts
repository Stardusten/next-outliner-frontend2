import { createContext } from "@/utils/createContext";
import AxiosContext from "./axios";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { joinPathSegments } from "@/common/path";

const PathsContext = createContext(() => {
  const { serverUrl } = AxiosContext.useContext();
  const route = useRoute();

  const dbBasePath = computed(() => route.params.location as string);
  const attachmentsFolderName = ref("attachments");
  const attachmentsBasePath = computed(() => joinPathSegments([dbBasePath.value, attachmentsFolderName.value]));

  const ctx = {
    dbBasePath,
    attachmentsFolderName,
    attachmentsBasePath,
  }
  globalThis.getPathsContext = () => ctx;
  return ctx;
});

export default PathsContext;