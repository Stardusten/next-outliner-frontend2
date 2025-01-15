import { createContext } from "@/utils/createContext";
import { fsGetAttachmentSignedUrl } from "@/common/api-call/fs";
import { ref } from "vue";
import ServerInfoContext from "./serverInfo";
import {
  getExtname,
  isAnimateImage,
  isAudio,
  isStaticImage,
  isText,
  isVideo,
} from "@/utils/fileType";

export type AttachmentInfo =
  | {
      type: "text";
      name: string;
      path: string;
      content: string;
      lang: string;
    }
  | {
      type: "image" | "animateImage" | "audio" | "video";
      name: string;
      path: string;
      url: string;
    };

export type ViewingTextState = {
  type: "text";
  name: string;
  lang: string;
  path: string;
  content: string;
  tempContent: string;
  save: () => void;
};

export type ViewingImageState = {
  type: "image";
  name: string;
  path: string;
  url: string;
};

export type ViewingAnimateImageState = {
  type: "animateImage";
  name: string;
  path: string;
  url: string;
};

export type ViewingAudioState = {
  type: "audio";
  name: string;
  path: string;
  url: string;
};

export type ViewingVideoState = {
  type: "video";
  name: string;
  path: string;
  url: string;
};

export type ViewingState =
  | ViewingTextState
  | ViewingImageState
  | ViewingAnimateImageState
  | ViewingAudioState
  | ViewingVideoState;

type ViewerStatus = "idle" | "loading" | "viewing" | "error";

// 获取预览信息
const getPreviewInfo = async (path: string, serverUrl: string): Promise<AttachmentInfo> => {
  const resp = await fsGetAttachmentSignedUrl({
    path,
    attachment: false,
    inferMimeType: true,
  });

  if (!resp.success) {
    throw new Error("Failed to get signed URL");
  }

  const url = `${serverUrl}${resp.data.signedUrl}`;

  if (isText(path)) {
    const textResp = await fetch(url);
    if (!textResp.ok) {
      throw new Error("Failed to fetch text content");
    }
    const content = await textResp.text();

    return {
      type: "text",
      name: path,
      path,
      content,
      lang: getExtname(path),
    };
  } else if (isStaticImage(path)) {
    return {
      type: "image",
      name: path,
      path,
      url,
    };
  } else if (isAnimateImage(path)) {
    return {
      type: "animateImage",
      name: path,
      path,
      url,
    };
  } else if (isAudio(path)) {
    return {
      type: "audio",
      name: path,
      path,
      url,
    };
  } else if (isVideo(path)) {
    return {
      type: "video",
      name: path,
      path,
      url,
    };
  }

  throw new Error("Unsupported file type");
};

export const createViewingState = (info: AttachmentInfo): ViewingState => {
  if (info.type === "text") {
    return {
      ...info,
      tempContent: info.content,
      save: () => {
        // 实现保存逻辑
        console.log("Save content");
      },
    };
  }
  return info;
};

const AttachmentViewerContext = createContext(() => {
  const { serverUrl } = ServerInfoContext.useContext()!;
  const viewingAttachment = ref<ViewingState | null>(null);
  const status = ref<ViewerStatus>("idle");
  const errorMessage = ref<string>("");

  // 修改预览方法
  const previewTextFile = async (name: string, path: string) => {
    try {
      status.value = "loading";
      errorMessage.value = "";
      const info = await getPreviewInfo(path, serverUrl.value);
      viewingAttachment.value = createViewingState(info);
      status.value = "viewing";
    } catch (error) {
      console.error("Error previewing text attachment", error);
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "Unknown error";
      viewingAttachment.value = null;
    }
  };

  const previewStaticImageFile = async (name: string, path: string) => {
    try {
      status.value = "loading";
      errorMessage.value = "";
      const info = await getPreviewInfo(path, serverUrl.value);
      viewingAttachment.value = createViewingState(info);
      status.value = "viewing";
    } catch (error) {
      console.error("Error previewing image attachment", error);
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "Unknown error";
      viewingAttachment.value = null;
    }
  };

  const previewAnimateImageFile = async (name: string, path: string) => {
    try {
      status.value = "loading";
      errorMessage.value = "";
      const info = await getPreviewInfo(path, serverUrl.value);
      viewingAttachment.value = createViewingState(info);
      status.value = "viewing";
    } catch (error) {
      console.error("Error previewing image attachment", error);
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "Unknown error";
      viewingAttachment.value = null;
    }
  };

  const previewAudioFile = async (name: string, path: string) => {
    try {
      status.value = "loading";
      errorMessage.value = "";
      const info = await getPreviewInfo(path, serverUrl.value);
      viewingAttachment.value = createViewingState(info);
      status.value = "viewing";
    } catch (error) {
      console.error("Error previewing audio attachment", error);
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "Unknown error";
      viewingAttachment.value = null;
    }
  };

  const previewVideoFile = async (name: string, path: string) => {
    try {
      status.value = "loading";
      errorMessage.value = "";
      const info = await getPreviewInfo(path, serverUrl.value);
      viewingAttachment.value = createViewingState(info);
      status.value = "viewing";
    } catch (error) {
      console.error("Error previewing video attachment", error);
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

  const handlePreview = async (path: string, name: string) => {
    if (isText(name)) {
      await previewTextFile(name, path);
    } else if (isStaticImage(name)) {
      await previewStaticImageFile(name, path);
    } else if (isAnimateImage(name)) {
      await previewAnimateImageFile(name, path);
    } else if (isAudio(name)) {
      await previewAudioFile(name, path);
    } else if (isVideo(name)) {
      await previewVideoFile(name, path);
    }
  };

  return {
    viewingAttachment,
    status,
    errorMessage,
    previewTextFile,
    previewStaticImageFile,
    previewAnimateImageFile,
    previewAudioFile,
    previewVideoFile,
    handlePreview,
    closeViewer,
    getPreviewInfo,
    createViewingState,
  };
});

export default AttachmentViewerContext;
