import { fsGetAttachmentSignedUrl, fsUpload } from "@/common/api-call/fs";
import { autoRetryGet } from "@/utils/auto-retry";
import { createContext } from "@/utils/createContext";
import { computed, reactive, type ComputedRef } from "vue";
import PathsContext from "./paths";
import ServerInfoContext from "./serverInfo";

export type ImageState =
  | { status: "fetching"; url?: string }
  | { status: "synced"; url: string }
  | { status: "fetchError"; url?: string }
  | { status: "uploading"; url: string }
  | { status: "uploadError"; url: string };

const ImagesContext = createContext(() => {
  const { serverUrl } = ServerInfoContext.useContext()!;
  const images = reactive<Record<string, ImageState>>({});

  // const fixImagePath = (blockId: BlockId) => {
  //   const { blocksManager } = getBlocksContext()!;
  //   const { attachmentsBasePath } = getPathsContext()!;
  //   const taskQueue = useTaskQueue();
  //   const block = blocksManager.getBlock(blockId);
  //   if (!block || block.type !== "normalBlock" || block.content[0] !== BLOCK_CONTENT_TYPES.IMAGE)
  //     return;
  //   const imagePath = block.content[1];
  //   // if (isAbsolutePath(imagePath)) {
  //   //   const relativePath = getRelativePath(attachmentsBasePath.value, imagePath);
  //   //   if (!relativePath) return;
  //   //   taskQueue.addTask(() => {
  //   //     const newContent = [...block.content] as ImageContent;
  //   //     newContent[1] = relativePath;
  //   //     blocksManager.updateBlock({
  //   //       ...block,
  //   //       content: newContent,
  //   //     });
  //   //   });
  //   // }
  //   if (isAbsolutePath(imagePath) && imagePath.search("attachments/") !== -1) {
  //     const newImagePath = imagePath.split("attachments/")[1];
  //     taskQueue.addTask(() => {
  //       const newContent = [...block.content] as ImageContent;
  //       newContent[1] = newImagePath;
  //       blocksManager.updateBlock({
  //         ...block,
  //         content: newContent,
  //       });
  //     });
  //   }
  // };

  const tryFetchImage = (imagePath: string, refetch: boolean = false) => {
    const currStatus = images[imagePath]?.status;
    const currUrl =
      images[imagePath] && "url" in images[imagePath] ? images[imagePath].url : undefined;
    // 如果图片正在获取，则不管 refetch，总是返回
    if (currStatus === "fetching") return;
    if (currStatus !== undefined && !refetch) return;

    // 开始获取图片
    (async () => {
      images[imagePath] = { status: "fetching", url: currUrl };

      // 获取图片
      const [promise, cancel] = autoRetryGet<string>(
        (onSuccess) => {
          fsGetAttachmentSignedUrl({
            path: imagePath,
            inferMimeType: true,
            attachment: false,
          }).then((res) => res.success && onSuccess(res.data.signedUrl));
        },
        { mode: "backoff", base: 500, max: 5000 },
        5,
        true,
      );

      promise
        .then((signedUrl) => {
          console.debug("图片获取成功", imagePath);
          images[imagePath] = {
            status: "synced",
            url: `${serverUrl.value}${signedUrl}`,
          };
        })
        .catch((err) => {
          console.debug("图片获取失败", imagePath, err.message);
          images[imagePath] = {
            status: "fetchError",
            url: currUrl,
          };
        });
    })();
  };

  function useImage(
    getImagePath: () => string | null | undefined,
    refetch?: boolean,
  ): ComputedRef<ImageState | null>;
  function useImage(imagePath: string, refetch?: boolean): ComputedRef<ImageState>;
  function useImage(arg0: Function | string, arg1?: boolean) {
    if (typeof arg0 === "string") {
      return computed(() => {
        tryFetchImage(arg0, arg1);
        return images[arg0];
      });
    } else {
      return computed(() => {
        const imagePath = arg0();
        if (!imagePath) return null;
        tryFetchImage(imagePath, arg1);
        return images[imagePath];
      });
    }
  }

  const uploadImage = (image: File, targetPath_?: string) => {
    const targetPath = targetPath_ ?? image.name;
    const currUrl = URL.createObjectURL(image);
    images[targetPath] = { status: "uploading", url: currUrl };
    queueMicrotask(async () => {
      const res = await fsUpload([[targetPath, image]]);
      if (res.success) {
        console.log("图片上传成功", targetPath);
        tryFetchImage(targetPath, true);
      } else {
        images[targetPath] = { status: "uploadError", url: currUrl };
      }
    });
    return computed(() => images[targetPath]);
  };

  const ctx = { images, useImage, uploadImage };
  return ctx;
});

export default ImagesContext;
