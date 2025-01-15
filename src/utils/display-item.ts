import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type IndexContext from "@/context";
import type BacklinksContext from "@/context/backlinks";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type {
  BlocksManager,
  ForDescendantsOptions,
} from "@/context/blocks/view-layer/blocksManager";
import { nanoid } from "nanoid";

export type DisplayItemId = DisplayItem["itemId"];

// - block-item
//   - basic-block
//   - backlink-block
//   - backlink-descendant
//   - potential-links-block
//   - potential-links-descendant
// - non-block-item
//   - backlink-header
//   - potential-links-header
export type DisplayItem = { itemId: string } & (
  | { type: "basic-block"; level: number; block: Block }
  | { type: "root-block"; block: Block }
  | { type: "backlink-block"; block: Block; refBlockId: BlockId }
  | { type: "backlink-header"; blockId: BlockId; backlinks: BlockId[] }
  | { type: "backlink-descendant"; block: Block; level: number }
  | { type: "potential-links-header"; blockId: BlockId; potentialLinks: BlockId[] }
  | { type: "potential-links-block"; block: Block; refBlockId: BlockId }
  | { type: "potential-links-descendant"; block: Block; level: number }
  | { type: "missing-block"; blockId: BlockId; parentId: BlockId; level: number }
  | { type: "side-pane-header"; blockId: BlockId }
);

export type DisplayBlockItem =
  | (DisplayItem & { type: "basic-block" })
  | (DisplayItem & { type: "backlink-block" })
  | (DisplayItem & { type: "backlink-descendant" })
  | (DisplayItem & { type: "potential-links-block" })
  | (DisplayItem & { type: "potential-links-descendant" });

export type DisplayGeneratorContext = {
  rootBlockIds: BlockId[];
  rootBlockLevel: number;
  enlargeRootBlock: boolean;
  // 是否显示反链面板
  showBacklinks?: boolean;
  // 是否显示潜在链接面板
  showPotentialLinks?: boolean;
  // 是否为每个 root block 添加一个 side pane header
  addSidePaneHeader?: boolean;
  blocksManager: BlocksManager;
  expandedBP: Record<BlockId, boolean>;
  // required context
  getBacklinksContext: () => ReturnType<typeof BacklinksContext.useContext>;
  getIndexContext: () => ReturnType<typeof IndexContext.useContext>;
};

export const isBlockDi = (item: DisplayItem) => {
  const result =
    item.type === "basic-block" ||
    item.type === "backlink-block" ||
    item.type === "backlink-descendant" ||
    item.type === "potential-links-block" ||
    item.type === "potential-links-descendant";
  return result ? item.block : undefined;
};

export const generateDisplayItems = (ctx: DisplayGeneratorContext) => {
  const {
    rootBlockIds,
    rootBlockLevel,
    enlargeRootBlock,
    showBacklinks,
    showPotentialLinks,
    blocksManager,
    expandedBP,
    addSidePaneHeader,
    getBacklinksContext,
    getIndexContext,
  } = ctx;

  const resultCollector: DisplayItem[] = [];

  if (rootBlockIds.length === 1) {
    const rootBlockId = rootBlockIds[0];
    const rootBlock = blocksManager.getBlock(rootBlockId);
    if (!rootBlock) return resultCollector;

    if (addSidePaneHeader && enlargeRootBlock)
      throw new Error("addSidePaneHeader and enlargeRootBlock cannot be true at the same time");

    if (enlargeRootBlock) {
      resultCollector.push({
        type: "root-block",
        itemId: `root-block-${rootBlockId}`,
        block: rootBlock,
      });
    }

    if (addSidePaneHeader) {
      resultCollector.push({
        type: "side-pane-header",
        itemId: `side-pane-header-${rootBlockId}`,
        blockId: rootBlockId,
      });
    }

    const rootDisplayLevel = enlargeRootBlock ? -1 : rootBlockLevel;

    blocksManager.forDescendantsWithMissingBlock({
      rootBlockId,
      rootBlockLevel: enlargeRootBlock ? -1 : rootBlockLevel,
      nonFoldOnly: true,
      includeSelf: enlargeRootBlock ? false : true,
      // 如果根块是折叠的，则仍然显示其所有孩子
      ignore: rootBlock.fold
        ? (block: Block, level: number) => {
            if (level === rootDisplayLevel) return "keep-self-and-descendants";
            return undefined;
          }
        : undefined,
      onEachBlock: (block, level) => {
        resultCollector.push({
          type: "basic-block",
          itemId: `block-${block.id}`,
          block,
          level,
        });
      },
      onMissingBlock: (blockId, parentId, level) => {
        resultCollector.push({
          type: "missing-block",
          itemId: `missing-block-${blockId}-${level}`,
          blockId,
          parentId,
          level,
        });
      },
    });

    // 如果要显示反链
    let backlinks: [Set<BlockId> | undefined] = [undefined];
    if (showBacklinks)
      addBacklinkItems(
        rootBlockId,
        resultCollector,
        blocksManager,
        backlinks,
        expandedBP,
        getBacklinksContext,
      );

    // 如果要显示潜在链接
    if (showPotentialLinks)
      addPotentialLinksItems(
        rootBlockId,
        resultCollector,
        blocksManager,
        backlinks,
        expandedBP,
        getBacklinksContext,
        getIndexContext,
      );
  } else if (rootBlockIds.length > 1) {
    if (enlargeRootBlock)
      throw new Error("enlargeRootBlock is not supported when rootBlockIds.length > 1");

    for (const rootBlockId of rootBlockIds) {
      const rootBlock = blocksManager.getBlock(rootBlockId);
      if (!rootBlock) continue;

      if (addSidePaneHeader) {
        resultCollector.push({
          type: "side-pane-header",
          itemId: `side-pane-header-${rootBlockId}`,
          blockId: rootBlockId,
        });
      }

      blocksManager.forDescendantsWithMissingBlock({
        rootBlockId,
        rootBlockLevel,
        nonFoldOnly: true,
        includeSelf: true,
        onEachBlock: (block, level) => {
          resultCollector.push({
            type: "basic-block",
            itemId: `block-${block.id}`,
            block,
            level,
          });
        },
        onMissingBlock: (blockId, parentId, level) => {
          resultCollector.push({
            type: "missing-block",
            itemId: `missing-block-${blockId}-${level}`,
            blockId,
            parentId,
            level,
          });
        },
      });

      // 如果要显示反链
      let backlinks: [Set<BlockId> | undefined] = [undefined];
      if (showBacklinks)
        addBacklinkItems(
          rootBlockId,
          resultCollector,
          blocksManager,
          backlinks,
          expandedBP,
          getBacklinksContext,
        );

      // 如果要显示潜在链接
      if (showPotentialLinks)
        addPotentialLinksItems(
          rootBlockId,
          resultCollector,
          blocksManager,
          backlinks,
          expandedBP,
          getBacklinksContext,
          getIndexContext,
        );
    }
  }

  return resultCollector;
};

const addBacklinkItems = (
  rootBlockId: BlockId,
  resultCollector: DisplayItem[],
  blocksManager: BlocksManager,
  backlinksCollector: [Set<BlockId> | undefined],
  expandedBP: Record<BlockId, boolean>,
  getBacklinksContext: () => ReturnType<typeof BacklinksContext.useContext>,
) => {
  const { getBacklinksConsideringAliases } = getBacklinksContext() ?? {};
  if (!getBacklinksConsideringAliases) return;

  const backlinks = getBacklinksConsideringAliases(rootBlockId);
  if (backlinks.size <= 0) return;

  // 只保留顶层反链
  // 比如：
  // - root [[test]]
  //   - block1 [[test]]
  //     - block2 [[test]]
  //       - block3 [[test]]
  // 在 test 的反链面板中，只会显示 root [[test]] 这个块
  const topLevelBacklinks = new Set<BlockId>(backlinks);
  const deleted = new Set<BlockId>();

  let prevSize: number;
  do {
    prevSize = topLevelBacklinks.size;

    for (const backlink of topLevelBacklinks) {
      if (deleted.has(backlink)) continue;

      const path = blocksManager.getBlockPath(backlink);
      // 检查除自身外的祖先是否在 topLevelBacklinks 中且未被标记删除
      const hasAncestorBacklink = path
        .slice(1)
        .some((ancestor) => topLevelBacklinks.has(ancestor.id) && !deleted.has(ancestor.id));

      if (hasAncestorBacklink) {
        deleted.add(backlink);
      }
    }

    // 一次性删除所有标记的块
    for (const blockId of deleted) {
      topLevelBacklinks.delete(blockId);
    }
  } while (topLevelBacklinks.size !== prevSize);

  // 添加 backlink header
  resultCollector.push({
    type: "backlink-header",
    itemId: `backlink-header-${rootBlockId}`,
    blockId: rootBlockId,
    backlinks: [...backlinks],
  });

  // 添加 backlink blocks
  // 说明：生成时 itemId 的指定非常关键，必须保证：
  //   1. 和 block tree 中的其他 item 的 itemId 不冲突
  //   2. 多次生成时，itemId 是稳定的
  for (const backlink of topLevelBacklinks) {
    const block = blocksManager.getBlock(backlink);
    if (!block) continue;
    // 对一个反链根块，其 itemId 格式为 `backlink-block-${backlink}`
    resultCollector.push({
      type: "backlink-block",
      itemId: `backlink-block-${backlink}`,
      block,
      refBlockId: rootBlockId,
    });

    blocksManager.forDescendants({
      rootBlockId: backlink,
      rootBlockLevel: 0,
      nonFoldOnly: true,
      includeSelf: false,
      ignore: (b) => {
        if (expandedBP[b.id]) return "keep-self-and-descendants";
        return "ignore-descendants";
      },
      onEachBlock: (block, level) => {
        // 对于反链根块下的一个后代块，其 itemId 格式为 `backlink-descendant-${backlink}-${block.id}`
        resultCollector.push({
          type: "backlink-descendant",
          itemId: `backlink-descendant-${backlink}-${block.id}`,
          block,
          level,
        });
      },
    });
  }

  backlinksCollector[0] = backlinks;
};

const addPotentialLinksItems = (
  rootBlockId: BlockId,
  resultCollector: DisplayItem[],
  blocksManager: BlocksManager,
  backlinksCollector: [Set<BlockId> | undefined],
  expandedBP: Record<BlockId, boolean>,
  getBacklinksContext: () => ReturnType<typeof BacklinksContext.useContext>,
  getIndexContext: () => ReturnType<typeof IndexContext.useContext>,
) => {
  const { getBacklinksConsideringAliases } = getBacklinksContext() ?? {};
  const { search } = getIndexContext() ?? {};
  if (!search || !getBacklinksConsideringAliases) return;

  const backlinks = backlinksCollector[0] ?? getBacklinksConsideringAliases(rootBlockId);
  const rootBlock = blocksManager.getBlock(rootBlockId);

  if (rootBlock && rootBlock.content[0] === BLOCK_CONTENT_TYPES.TEXT) {
    const potentialLinks = search(rootBlock.ctext)
      .map((id) => blocksManager.getBlock(id as string))
      .filter((l): l is Block => l != null)
      .filter((b) => !backlinks.has(b.id) && b.id !== rootBlockId)
      .filter((b) => b.content[0] === BLOCK_CONTENT_TYPES.TEXT);

    if (potentialLinks.length > 0) {
      // 添加 potential-links-header
      resultCollector.push({
        type: "potential-links-header",
        itemId: `potential-links-header-${rootBlockId}`,
        blockId: rootBlockId,
        potentialLinks: potentialLinks.map((b) => b.id),
      });

      // 添加 potential-links-blocks
      for (const potentialLink of potentialLinks) {
        const block = blocksManager.getBlock(potentialLink.id);
        if (!block) continue;
        resultCollector.push({
          type: "potential-links-block",
          itemId: `potential-links-block-${potentialLink.id}`,
          block,
          refBlockId: rootBlockId,
        });

        blocksManager.forDescendants({
          rootBlockId: potentialLink.id,
          rootBlockLevel: 0,
          nonFoldOnly: true,
          includeSelf: false,
          ignore: (b) => {
            if (expandedBP[b.id]) return "keep-self-and-descendants";
            return "ignore-descendants";
          },
          onEachBlock: (block, level) => {
            resultCollector.push({
              type: "potential-links-descendant",
              itemId: `potential-links-descendant-${block.id}`,
              block,
              level,
            });
          },
        });
      }
    }
  }
};
