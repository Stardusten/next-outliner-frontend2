import { createContext } from "@/utils/createContext";
import { fsGetAttachmentSignedUrl } from "@/common/api-call/fs";
import { ref } from "vue";
import ServerInfoContext from "./serverInfo";
import { getExtname } from "@/utils/fileType";

export type ViewingTextAttachment = {
  type: "text";
  name: string;
  lang: string;
  path: string;
  content: string;
  tempContent: string;
  save: () => void;
};

export type ViewingAttachment = ViewingTextAttachment;

type ViewerStatus = "idle" | "loading" | "viewing" | "error";

const AttachmentViewerContext = createContext(() => {
  const { serverUrl } = ServerInfoContext.useContext()!;
  const viewingAttachment = ref<ViewingAttachment | null>(null);
  const status = ref<ViewerStatus>("idle");
  const errorMessage = ref<string>("");

  const previewTextFile = async (name: string, path: string) => {
    try {
      status.value = "loading";
      errorMessage.value = "";

      // 获取签名 URL
      const resp = await fsGetAttachmentSignedUrl({
        path,
        attachment: false,
        inferMimeType: true,
      });

      if (!resp.success) {
        throw new Error("Failed to get signed URL");
      }

      // 从签名 URL 获取文本内容
      const url = `${serverUrl.value}${resp.data.signedUrl}`;
      const textResp = await fetch(url);
      if (!textResp.ok) {
        throw new Error("Failed to fetch text content");
      }

      const content = await textResp.text();

      viewingAttachment.value = {
        type: "text",
        name,
        lang: getExtname(name),
        path,
        content,
        tempContent: content,
        save: () => {
          // TODO: 实现保存功能
          console.log("Save content");
        },
      };

      status.value = "viewing";
    } catch (error) {
      console.error("Error previewing text attachment", error);
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "Unknown error";
      viewingAttachment.value = null;
    }
  };

  const closeViewer = () => {
    viewingAttachment.value = null;
    status.value = "idle";
    errorMessage.value = "";
  };

  return {
    viewingAttachment,
    status,
    errorMessage,
    previewTextFile,
    closeViewer,
  };
});

export default AttachmentViewerContext;
