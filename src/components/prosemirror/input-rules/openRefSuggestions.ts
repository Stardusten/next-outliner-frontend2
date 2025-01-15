import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { InputRule } from "prosemirror-inputrules";
import type { PmPluginCtx } from "../plugins/pluginContext";
import { getPmSchema } from "../pmSchema";
import type { Dirents } from "@/common/type-and-schemas/dirents";
import { isAudio, isImage, isVideo } from "@/utils/fileType";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";

export const openRefSuggestions = (ctx: PmPluginCtx) =>
  new InputRule(/([#@])$/, (state, match) => {
    const view = ctx.getEditorView();
    if (!view) return null;

    const cursorPos = view.state.selection.from;
    const coord = view.coordsAtPos(cursorPos);
    if (!coord) return null;
    const showPos = {
      x: coord.left,
      y: coord.top,
    };

    const onSelectBlock = (blockId: BlockId) => {
      const tag = match[1] == "#";
      const node = ctx.getSchema().nodes.blockRef_v2.create({
        toBlockId: blockId,
        tag,
      });
      const cursorPos = view.state.selection.anchor;
      const tr = view.state.tr.replaceRangeWith(cursorPos - match[1].length, cursorPos, node);
      view.dispatch(tr);
      setTimeout(() => view.focus(), 50); // 重新聚焦
    };

    const onSelectFile = (file: Dirents[string], path: string) => {
      const node = ctx.getSchema().nodes.pathRef.create({
        path: path,
      });
      const cursorPos = view.state.selection.anchor;
      const tr = view.state.tr.replaceRangeWith(cursorPos - match[1].length, cursorPos, node);
      view.dispatch(tr);
      setTimeout(() => view.focus(), 50); // 重新聚焦
    };

    const onSelectFileEmbed = (file: Dirents[string], path: string) => {
      // 删除匹配的符号
      const cursorPos = view.state.selection.anchor;
      const tr = view.state.tr.deleteRange(cursorPos - match[1].length, cursorPos);
      view.dispatch(tr);
      // 插入文件
      if (isImage(file.name))
        ctx.commandsContext?.insertImage([BLOCK_CONTENT_TYPES.IMAGE, path, "left", null, null, []]);
      else if (isAudio(file.name))
        ctx.commandsContext?.insertAudio([BLOCK_CONTENT_TYPES.AUDIO, path]);
      else if (isVideo(file.name))
        ctx.commandsContext?.insertVideo([BLOCK_CONTENT_TYPES.VIDEO, path, null]);
      ctx.refSuggestionsContext?.close();
    };

    const onSelectNothing = () => {
      setTimeout(() => view.focus(), 50); // 重新聚焦
    };

    const { openRefSuggestions } = ctx.refSuggestionsContext ?? {};
    openRefSuggestions?.({
      showPos,
      onSelectBlock,
      onSelectFile,
      onSelectFileEmbed,
      onSelectNothing,
      allowCreateNew: true,
      allowFileRef: true,
      allowFileEmbed: true,
    });

    return null;
  });
