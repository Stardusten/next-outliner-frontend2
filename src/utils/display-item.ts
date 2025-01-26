import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { getProperties } from "@/common/helper-functions/block";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import type IndexContext from "@/context";
import type BacklinksContext from "@/context/backlinks";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type {
  BlocksManager,
  ForDescendantsOptions,
} from "@/context/blocks/view-layer/blocksManager";
import { nanoid } from "nanoid";
import { toRaw } from "vue";

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
//   - side-pane-header
//   - block-properties
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
  | { type: "block-properties"; level: number; block: Block }
);

export type DisplayBlockItem =
  | (DisplayItem & { type: "basic-block" })
  | (DisplayItem & { type: "backlink-block" })
  | (DisplayItem & { type: "backlink-descendant" })
  | (DisplayItem & { type: "potential-links-block" })
  | (DisplayItem & { type: "potential-links-descendant" });

export type DisplayGeneratorParams = {
  rootBlockIds: BlockId[];
  rootBlockLevel: number;
  enlargeRootBlock: boolean;
  // 是否显示反链面板
  showBacklinks?: boolean;
  // 是否显示潜在链接面板
  showPotentialLinks?: boolean;
  // 是否为每个 root block 添加一个 side pane header
  addSidePaneHeader?: boolean;
  // 是否显示块属性面板
  showBlockProperties?: boolean;
  blocksManager: BlocksManager;
  expandedBP: Record<DisplayItemId, boolean>;
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

type DisplayGeneratorContext = {
  params: DisplayGeneratorParams;
  displayItems: DisplayItem[];
  backlinks: Set<BlockId>;
};

export const generateDisplayItems = (params: DisplayGeneratorParams) => {
  const ctx = {
    params,
    displayItems: [] as DisplayItem[],
    backlinks: new Set<BlockId>(),
  };

  addRootBlockItem(ctx);

  for (const rootBlockId of params.rootBlockIds) {
    const rootBlock = params.blocksManager.getBlock(rootBlockId);
    if (!rootBlock) continue;

    addSidePaneHeaderItem(ctx, rootBlock);
    addContentItems(ctx, rootBlock);
    addBacklinkItems(ctx, rootBlock);
    addPotentialLinksItems(ctx, rootBlock);
  }

  return ctx.displayItems;
};

const addContentItems = (ctx: DisplayGeneratorContext, rootBlock: Block) => {
  const { params } = ctx;
  const rootDisplayLevel = params.enlargeRootBlock
    ? params.rootBlockLevel - 1
    : params.rootBlockLevel;

  const dfs = (block: Block, currLevel: number) => {
    // 如果根块是折叠的，并且 enlargeRootBlock，则仍然显示其所有孩子
    const forceExpand =
      rootBlock.fold && !params.addSidePaneHeader && currLevel === rootDisplayLevel;
    // 如果 enlargeRootBlock，则不用考虑根块，因为前面根块已经作为 rootBlockItem 添加了
    const includeSelf = params.enlargeRootBlock ? false : true;
    if (includeSelf || block.id != rootBlock.id) {
      ctx.displayItems.push({
        type: "basic-block",
        itemId: `block-${block.id}`,
        block,
        level: currLevel,
      });
    }
    if (!forceExpand && block.fold) return;
    if (typeof block.childrenIds == "string") return;

    if (ctx.params.showBlockProperties) {
      addBlockPropertiesItem(ctx, block, currLevel);
    }

    for (let i = 0; i < block.childrenIds.length; i++) {
      const childId = block.childrenIds[i];
      const childRef = block.childrenRefs[i];
      if (childRef.value) {
        const rawBlock = toRaw(childRef.value);
        dfs(rawBlock, currLevel + 1);
      } else {
        // TODO
      }
    }
  };
  dfs(rootBlock, rootDisplayLevel);
};

const addBacklinkItems = (ctx: DisplayGeneratorContext, rootBlock: Block) => {
  const { blocksManager, expandedBP, getBacklinksContext } = ctx.params;
  const { getBacklinks } = getBacklinksContext() ?? {};
  if (!getBacklinks) return;

  const backlinks = getBacklinks(rootBlock.id);
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
  ctx.displayItems.push({
    type: "backlink-header",
    itemId: `backlink-header-${rootBlock.id}`,
    blockId: rootBlock.id,
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
    ctx.displayItems.push({
      type: "backlink-block",
      itemId: `backlink-block-${backlink}`,
      block,
      refBlockId: rootBlock.id,
    });

    const dfs = (block: Block, currLevel: number) => {
      const itemId =
        block.id === backlink
          ? `backlink-block-${backlink}`
          : `backlink-descendant-${backlink}-${block.id}`;
      const fold = !expandedBP[itemId];

      if (block.id !== backlink) {
        ctx.displayItems.push({
          type: "backlink-descendant",
          itemId,
          block,
          level: currLevel,
        });
      }

      if (typeof block.childrenIds == "string") return;
      if (fold) return;

      for (const childRef of block.childrenRefs) {
        if (childRef.value && !childRef.value.deleted) {
          const rawBlock = toRaw(childRef.value);
          dfs(rawBlock, currLevel + 1);
        }
      }
    };

    dfs(block, 0);
  }

  ctx.backlinks = backlinks;
};

const addBlockPropertiesItem = (ctx: DisplayGeneratorContext, block: Block, level: number) => {
  const { displayItems } = ctx;
  const properties = getProperties(block);
  if (Object.keys(properties).length <= 0) return;
  displayItems.push({
    type: "block-properties",
    itemId: `block-properties-${block.id}`,
    block,
    level,
  });
};

const addRootBlockItem = (ctx: DisplayGeneratorContext) => {
  const { params, displayItems } = ctx;
  if (params.enlargeRootBlock) {
    if (params.addSidePaneHeader) {
      throw new Error("addSidePaneHeader and enlargeRootBlock cannot be true at the same time");
    }

    if (params.rootBlockIds.length > 1) {
      throw new Error("enlargeRootBlock is not supported when rootBlockIds.length > 1");
    }

    const rootBlockId = params.rootBlockIds[0];
    const rootBlock = params.blocksManager.getBlock(rootBlockId);
    if (!rootBlock) return;

    displayItems.push({
      type: "root-block",
      itemId: `root-block-${rootBlockId}`,
      block: rootBlock,
    });
  }
};

const addSidePaneHeaderItem = (ctx: DisplayGeneratorContext, rootBlock: Block) => {
  const { params, displayItems } = ctx;

  if (params.addSidePaneHeader) {
    displayItems.push({
      type: "side-pane-header",
      itemId: `side-pane-header-${rootBlock.id}`,
      blockId: rootBlock.id,
    });
  }
};

const addPotentialLinksItems = (ctx: DisplayGeneratorContext, rootBlock: Block) => {
  const { blocksManager, expandedBP, getBacklinksContext, getIndexContext } = ctx.params;
  const { getBacklinks } = getBacklinksContext() ?? {};
  const { search } = getIndexContext() ?? {};
  if (!search || !getBacklinks) return;

  const backlinks = ctx.backlinks ?? getBacklinks(rootBlock.id);

  if (rootBlock && rootBlock.content[0] === BLOCK_CONTENT_TYPES.TEXT) {
    const potentialLinks = search(rootBlock.ctext)
      .map((id) => blocksManager.getBlock(id as string))
      .filter((l): l is Block => l != null)
      .filter((b) => !backlinks.has(b.id) && b.id !== rootBlock.id)
      .filter((b) => b.content[0] === BLOCK_CONTENT_TYPES.TEXT);

    if (potentialLinks.length > 0) {
      // 添加 potential-links-header
      ctx.displayItems.push({
        type: "potential-links-header",
        itemId: `potential-links-header-${rootBlock.id}`,
        blockId: rootBlock.id,
        potentialLinks: potentialLinks.map((b) => b.id),
      });

      // 添加 potential-links-blocks
      for (const potentialLink of potentialLinks) {
        const block = blocksManager.getBlock(potentialLink.id);
        if (!block) continue;
        ctx.displayItems.push({
          type: "potential-links-block",
          itemId: `potential-links-block-${potentialLink.id}`,
          block,
          refBlockId: rootBlock.id,
        });

        const dfs = (block: Block, currLevel: number) => {
          const itemId =
            block.id === potentialLink.id
              ? `potential-links-block-${potentialLink.id}`
              : `potential-links-descendant-${potentialLink.id}-${block.id}`;
          const fold = !expandedBP[itemId];

          if (block.id !== potentialLink.id) {
            ctx.displayItems.push({
              type: "potential-links-descendant",
              itemId,
              block,
              level: currLevel,
            });
          }

          if (typeof block.childrenIds == "string") return;
          if (fold) return;

          for (const childRef of block.childrenRefs) {
            if (childRef.value && !childRef.value.deleted) {
              const rawBlock = toRaw(childRef.value);
              dfs(rawBlock, currLevel + 1);
            }
          }
        };

        dfs(potentialLink, 0);
      }
    }
  }
};
