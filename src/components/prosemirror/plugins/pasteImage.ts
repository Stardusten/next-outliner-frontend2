import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Slice } from "prosemirror-model";
import { joinPathSegments } from "@/common/path";
import { nanoid } from "nanoid";
import type { BlockId, ImageContent } from "@/common/types";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { useTaskQueue } from "@/plugins/taskQueue";

export const mkPasteImagePlugin = () => {
  const { uploadImage } = globalThis.getImagesContext()!;
  const taskQueue = useTaskQueue();
  const { lastFocusedBlockId } = globalThis.getLastFocusContext()!;
  const { attachmentsBasePath } = globalThis.getPathsContext()!;
  const { blockEditor } = globalThis.getBlocksContext()!;

  return new Plugin({
    props: {
      handlePaste(view: EditorView, event: ClipboardEvent, slice: Slice) {
        const blockId = lastFocusedBlockId.value;
        if (blockId == null) return;

        // find image
        let imageExt: string | null = null;
        let imageFile: File | null = null;
        const items = event.clipboardData?.items;
        if (!items || items.length == 0) return;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const match = item.type.match(/image\/([a-z]+)/);
          if (match) {
            imageExt = match[1];
            imageFile = item.getAsFile();
          }
        }

        // save image
        if (imageExt && imageFile) {
          const imagePath = joinPathSegments([
            attachmentsBasePath.value,
            `${imageFile.name}__${nanoid()}.${imageExt}`,
          ]);
          const imageContent: ImageContent = [
            BLOCK_CONTENT_TYPES.IMAGE,
            imagePath,
            "left",
            null,
            null,
            [],
          ];
          let imageBlockId: BlockId | null = null;
          if (view.state.doc.content.size == 0) {
            // 当前块为空, 直接将当前块变成图片块
            imageBlockId = blockId;
            taskQueue.addTask(() => {
              blockEditor.changeBlockContent(blockId, imageContent);
            });
          } else {
            // 当前块不为空, 在下方插入图片块
            taskQueue.addTask(() => {
              const { newNormalBlockId } =
                blockEditor.insertNormalBlock(
                  {
                    baseBlockId: blockId,
                    offset: 1,
                  },
                  imageContent,
                ) ?? {};
              imageBlockId = newNormalBlockId ?? null;
            });
          }

          if (imageBlockId) {
            uploadImage(imageFile, imagePath);
          }
        }
      },
    },
  });
};
