import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { useEventBus } from "@/plugins/eventbus";
import { createContext } from "@/utils/createContext";
import { ref, shallowReactive } from "vue";
import BlocksContext from "./blocks/blocks";
// @ts-ignore
import Document from "@/../node_modules/flexsearch/dist/module/document";
import { calcMatchScore, hybridTokenize } from "@/utils/tokenize";
import kbViewRegistry from "./kbViewRegistry";
import SearchSettingsContext from "./searchSettings";

const IndexContext = createContext(() => {
  const eventBus = useEventBus();
  const { blocksManager } = BlocksContext.useContext()!;
  const { register } = kbViewRegistry.useContext()!;
  const { ignoreDiacritics } = SearchSettingsContext.useContext()!;

  //////// Mirrors, Virtuals, Occurs ////////
  const mirrors = shallowReactive(new Map<BlockId, Set<BlockId>>());
  const virtuals = shallowReactive(new Map<BlockId, Set<BlockId>>());

  const _addMirror = (
    srcBlockId: BlockId,
    mirrorBlockId: BlockId,
    _mirrors?: Map<BlockId, Set<BlockId>>,
  ) => {
    _mirrors = _mirrors || mirrors;
    const set = _mirrors.get(srcBlockId);
    if (set) set.add(mirrorBlockId);
    else _mirrors.set(srcBlockId, new Set([mirrorBlockId]));
  };

  const _addVirtual = (
    srcBlockId: BlockId,
    virtualBlockId: BlockId,
    _virtuals?: Map<BlockId, Set<BlockId>>,
  ) => {
    _virtuals = _virtuals || virtuals;
    const set = _virtuals.get(srcBlockId);
    if (set) set.add(virtualBlockId);
    else _virtuals.set(srcBlockId, new Set([virtualBlockId]));
  };

  const _deleteMirror = (
    srcBlockId: BlockId,
    mirrorBlockId: BlockId,
    _mirrors?: Map<BlockId, Set<BlockId>>,
  ) => {
    _mirrors = _mirrors || mirrors;
    const set = _mirrors.get(srcBlockId);
    if (set) {
      set.delete(mirrorBlockId);
      if (set.size == 0) _mirrors.delete(srcBlockId);
    }
  };

  const _deleteVirtual = (
    srcBlockId: BlockId,
    virtualBlockId: BlockId,
    _virtuals?: Map<BlockId, Set<BlockId>>,
  ) => {
    _virtuals = _virtuals || virtuals;
    const set = _virtuals.get(srcBlockId);
    if (set) {
      set.delete(virtualBlockId);
      if (set.size == 0) _virtuals.delete(srcBlockId);
    }
  };

  const getMirrors = (blockId: BlockId): Set<BlockId> => {
    return mirrors.get(blockId) ?? new Set();
  };

  const getVirtuals = (blockId: BlockId): Set<BlockId> => {
    return virtuals.get(blockId) ?? new Set();
  };

  const getOccurs = (blockId: BlockId, includeSelf: boolean = true) => {
    const ret = [];
    ret.push(...getMirrors(blockId));
    ret.push(...getVirtuals(blockId));
    if (includeSelf) ret.push(blockId);
    return ret;
  };

  eventBus.on("afterBlocksTrCommit", ([tr]) => {
    for (let i = 0; i < tr.patches.length; i++) {
      const patch = tr.patches[i];
      const reversePatch = tr.reversePatches[i];
      if (patch.op === "add") {
        const b = patch.block;
        if (b.type === "mirrorBlock") _addMirror(b.src, b.id);
        else if (b.type === "virtualBlock") _addVirtual(b.src, b.id);
      } else if (patch.op === "delete" && reversePatch.op === "add") {
        const b = reversePatch.block;
        if (b.type === "mirrorBlock") _deleteMirror(b.src, b.id);
        else if (b.type === "virtualBlock") _deleteVirtual(b.src, b.id);
      }
    }
  });

  eventBus.on("blocksDestroy", () => {
    mirrors.clear();
    virtuals.clear();
  });

  /////////// Backlinks ///////////
  const blockRefsIndex = ref<Record<BlockId, Set<BlockId>>>({});
  const tagIndex = ref<Record<string, Set<BlockId>>>({});

  eventBus.on("afterBlocksTrCommit", ([tr]) => {
    for (let i = 0; i < tr.patches.length; i++) {
      const patch = tr.patches[i];
      const reversePatch = tr.reversePatches[i];
      if (patch.op === "delete") {
        delete blockRefsIndex.value[patch.blockId];
        delete tagIndex.value[patch.blockId];
        if (reversePatch.op !== "add") continue;
        const block = reversePatch.block;
        if (block.type !== "normalBlock" || block.content[0] !== BLOCK_CONTENT_TYPES.TEXT) continue;
        const olinks = blocksManager.getOlinks(block.content[1]);
        for (const olink of olinks) {
          blockRefsIndex.value[olink]?.delete(block.id);
          tagIndex.value[olink]?.delete(block.id);
        }
      } else if (patch.op === "add" || patch.op === "update") {
        const block = patch.block;
        if (block.type !== "normalBlock" || block.content[0] !== BLOCK_CONTENT_TYPES.TEXT) continue;

        const oldBlockRefs =
          reversePatch.op === "delete"
            ? []
            : reversePatch.block.type !== "normalBlock" ||
                reversePatch.block.content[0] !== BLOCK_CONTENT_TYPES.TEXT
              ? []
              : blocksManager.getOlinks(reversePatch.block.content[1], "blockRef");
        const oldTags =
          reversePatch.op === "delete"
            ? []
            : reversePatch.block.type !== "normalBlock" ||
                reversePatch.block.content[0] !== BLOCK_CONTENT_TYPES.TEXT
              ? []
              : blocksManager.getOlinks(reversePatch.block.content[1], "tag");
        const newBlockRefs = blocksManager.getOlinks(block.content[1], "blockRef");
        const newTags = blocksManager.getOlinks(block.content[1], "tag");

        // 更新 blockRefsIndex
        const addedBlockRefs = newBlockRefs.filter((olink) => !oldBlockRefs.includes(olink));
        const removedBlockRefs = oldBlockRefs.filter((olink) => !newBlockRefs.includes(olink));
        for (const olink of addedBlockRefs) {
          blockRefsIndex.value[olink] = (blockRefsIndex.value[olink] ?? new Set()).add(block.id);
        }
        for (const olink of removedBlockRefs) {
          blockRefsIndex.value[olink]?.delete(block.id);
        }

        // 更新 tagIndex
        const addedTags = newTags.filter((olink) => !oldTags.includes(olink));
        const removedTags = oldTags.filter((olink) => !newTags.includes(olink));
        for (const olink of addedTags) {
          tagIndex.value[olink] = (tagIndex.value[olink] ?? new Set()).add(block.id);
        }
        for (const olink of removedTags) {
          tagIndex.value[olink]?.delete(block.id);
        }
      }
    }
  });

  eventBus.on("blocksDestroy", () => {
    blockRefsIndex.value = {};
    tagIndex.value = {};
  });

  const getBacklinks = (blockId: BlockId, type: "blockRef" | "tag" | "both" = "both") => {
    if (type === "blockRef") return blockRefsIndex.value[blockId] ?? new Set();
    else if (type === "tag") return tagIndex.value[blockId] ?? new Set();
    else {
      const blockRefs = blockRefsIndex.value[blockId] ?? new Set();
      const tags = tagIndex.value[blockId] ?? new Set();
      return new Set([...blockRefs, ...tags]);
    }
  };

  /////////// Fulltext Search ///////////

  const fulltextIndex = new Document({
    document: {
      id: "id",
      index: "text",
      store: ["text"],
    },
    encode: (str: string) => {
      const tokens = hybridTokenize(str, { removeDiacritics: ignoreDiacritics.value });
      return tokens;
    },
  });
  const dirtySet = new Set<BlockId>();

  // 手工标记为脏块
  const markAsDirty = (blockId: BlockId) => {
    dirtySet.add(blockId);
  };

  eventBus.on("afterBlocksTrCommit", ([tr]) => {
    for (const patch of tr.patches) {
      if (patch.op === "delete") {
        dirtySet.add(patch.blockId);
      } else {
        dirtySet.add(patch.block.id);
      }
    }
  });

  eventBus.on("blocksDestroy", () => {
    dirtySet.clear();
    fulltextIndex; // 清空 todo
  });

  const _updateIndex = () => {
    if (dirtySet.size === 0) return;
    for (const blockId of dirtySet) {
      const block = blocksManager.getBlock(blockId);
      // 这个块被删除了
      if (block == null && fulltextIndex.contain(blockId)) {
        fulltextIndex.remove(blockId);
      } else if (block && block.type === "normalBlock") {
        if (fulltextIndex.contain(blockId)) fulltextIndex.remove(blockId);
        const ctextAndMtext = block.ctext + " " + block.mtext;
        fulltextIndex.add(blockId, { id: blockId, text: ctextAndMtext });
      }
    }
    dirtySet.clear();
  };

  const search = (query: string, limit: number = 200): BlockId[] => {
    _updateIndex();

    const results = fulltextIndex.search(query, { limit, enrich: true })?.[0]?.result;
    if (!results) return [];
    const queryTokens = hybridTokenize(query, {
      caseSensitive: false,
      cjkNGram: 1,
      includePrefix: false,
      removeDiacritics: ignoreDiacritics.value,
    });
    const idAndScores = results.map((result: any) => {
      const score = calcMatchScore(queryTokens, result.doc.text);
      return { id: result.id, score };
    });
    idAndScores.sort((a: any, b: any) => b.score - a.score);
    return idAndScores.map((item: any) => item.id);
  };

  const searchWithScore = (
    query: string,
    limit: number = 200,
  ): { id: BlockId; score: number }[] => {
    _updateIndex();

    const results = fulltextIndex.search(query, { limit, enrich: true })?.[0]?.result;
    if (!results) return [];
    const queryTokens = hybridTokenize(query, {
      caseSensitive: false,
      cjkNGram: 1,
      includePrefix: false,
      removeDiacritics: ignoreDiacritics.value,
    });
    const idAndScores = results.map((result: any) => {
      const score = calcMatchScore(queryTokens, result.doc.text);
      return { id: result.id, score };
    });
    idAndScores.sort((a: any, b: any) => b.score - a.score);
    return idAndScores;
  };

  const ctx = {
    fulltextIndex,
    blockRefsIndex,
    tagIndex,
    search,
    searchWithScore,
    getMirrors,
    getVirtuals,
    getOccurs,
    getBacklinks,
    markAsDirty,
  };
  register("index", ctx);
  return ctx;
});

export default IndexContext;
