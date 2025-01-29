<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger class="hidden" />
    <DropdownMenuContent
      class="block-contextmenu-content min-w-[200px] overflow-y-auto max-h-[var(--radix-dropdown-menu-content-available-height)]"
    >
      <DropdownMenuItem
        class="!text-red-500"
        :disabled="!deleteBlock(true, clickedBlockId!, undefined)"
        @click="deleteBlock(false, clickedBlockId!, $event)"
      >
        <Trash2 class="size-4 mr-2" />
        {{ $t("kbView.commands.deleteBlock") }}
      </DropdownMenuItem>
      <!-- <DropdownMenuItem
        :disabled="!openFieldSettingsDialogCommand(true, clickedBlockId!, undefined)"
        @click="openFieldSettingsDialogCommand(false, clickedBlockId!, $event)"
      >
        <Field class="size-4 mr-2" />
        {{ $t("kbView.commands.fieldSettings") }}
      </DropdownMenuItem> -->
      <DropdownMenuItem
        :disabled="!addMetadata(true, clickedBlockId!, undefined)"
        @click="addMetadata(false, clickedBlockId!, $event)"
      >
        <Field class="size-4 mr-2" />
        {{ $t("kbView.commands.addMetadata") }}
      </DropdownMenuItem>
      <DropdownMenuItem
        :disabled="!openBlockRefTagSettingsDialogCommand(true, clickedBlockId!, undefined)"
        @click="openBlockRefTagSettingsDialogCommand(false, clickedBlockId!, $event)"
      >
        <Link class="size-4 mr-2" />
        {{ $t("kbView.commands.blockRefTagSettings") }}
      </DropdownMenuItem>
      <!-- <DropdownMenuItem
        :disabled="!openFieldValuesInspectorCommand(true, clickedBlockId!, undefined)"
        @click="openFieldValuesInspectorCommand(false, clickedBlockId!, $event)"
      >
        <Database class="size-4 mr-2" />
        {{ $t("kbView.commands.openFieldValuesInspector") }}
      </DropdownMenuItem> -->
      <DropdownMenuItem>
        <Copy class="size-4 mr-2" />
        {{ $t("kbView.commands.copyBlockReference") }}
      </DropdownMenuItem>
      <DropdownMenuItem>
        <FlipHorizontal class="size-4 mr-2" />
        {{ $t("kbView.commands.copyBlockMirror") }}
      </DropdownMenuItem>
      <DropdownMenuItem
        :disabled="!insertMirrorBelow(true, clickedBlockId!, undefined)"
        @click="insertMirrorBelow(false, clickedBlockId!, $event)"
      >
        <FlipHorizontal class="size-4 mr-2" />
        {{ $t("kbView.commands.insertMirrorBelow") }}
      </DropdownMenuItem>
      <!-- <DropdownMenuItem
        :disabled="!addToFavorite(true, clickedBlockId!, undefined)"
        @click="addToFavorite(false, clickedBlockId!, $event)"
      >
        <Bookmark class="size-4 mr-2" />
        {{ $t("kbView.commands.addToFavorite") }}
      </DropdownMenuItem> -->
      <DropdownMenuItem
        :disabled="!addToSidePane(true, clickedBlockId!, undefined)"
        @click="addToSidePane(false, clickedBlockId!, $event)"
      >
        <Sidebar class="size-4 mr-2" />
        {{ $t("kbView.commands.addToSidepane") }}
      </DropdownMenuItem>
      <!-- <DropdownMenuItem>
        <Archive class="size-4 mr-2" />
        {{ $t("kbView.commands.archiveDone") }}
      </DropdownMenuItem> -->
      <DropdownMenuItem
        :disabled="!moveBlock(true, clickedBlockId!, undefined)"
        @click="moveBlock(false, clickedBlockId!, $event)"
      >
        <ArrowRight class="size-4 mr-2" />
        {{ $t("kbView.commands.moveBlock") }}
      </DropdownMenuItem>
      <DropdownMenuItem
        :disabled="!moveBlockLeaveRef(true, clickedBlockId!, undefined)"
        @click="moveBlockLeaveRef(false, clickedBlockId!, $event)"
      >
        <ArrowRight class="size-4 mr-2" />
        {{ $t("kbView.commands.moveBlockLeaveRef") }}
      </DropdownMenuItem>
      <!--DropdownMenuItem
        :disabled="!moveBlock(true, clickedBlockId!, undefined)"
        @click="moveBlock(false, clickedBlockId!, $event)"
      >
        <ArrowRight class="size-4 mr-2" />
        {{ $t("kbView.commands.moveBlockLeaveMirror") }}
      </DropdownMenuItem> -->

      <!-- 排序 -->
      <!-- <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <SortAsc class="size-4 mr-2" />
          {{ $t("kbView.commands.sortDirectChildren") }}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>
            <ArrowUpAZ class="size-4 mr-2" />
            {{ $t("kbView.commands.sortDictAsc") }}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ArrowDownAZ class="size-4 mr-2" />
            {{ $t("kbView.commands.sortDictDesc") }}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CalendarArrowUp class="size-4 mr-2" />
            {{ $t("kbView.commands.ctimeAsc") }}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CalendarArrowDown class="size-4 mr-2" />
            {{ $t("kbView.commands.ctimeDesc") }}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CalendarArrowUp class="size-4 mr-2" />
            {{ $t("kbView.commands.mtimeAsc") }}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CalendarArrowDown class="size-4 mr-2" />
            {{ $t("kbView.commands.mtimeDesc") }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub> -->

      <DropdownMenuItem
        :disabled="!exportBlock(true, clickedBlockId!, undefined)"
        @click="exportBlock(false, clickedBlockId!, $event)"
      >
        <Download class="size-4 mr-2" />
        {{ $t("kbView.commands.export") }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import {
  Copy,
  Trash2,
  FlipHorizontal,
  Bookmark,
  Sidebar,
  Download,
  SortAsc,
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarArrowUp,
  CalendarArrowDown,
  Archive,
  MoveRight,
  ArrowRight,
  Database,
  Paintbrush,
  Link,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSubContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { useTaskQueue } from "@/plugins/taskQueue";
import BlocksDropdown from "@/context/blocks/blocks";
import BlockMoverContext from "@/context/blockMover";
import FavoriteContext from "@/context/favorite";
import SidebarContext from "@/context/sidebar";
import type { BlockPos } from "@/context/blocks/view-layer/blocksEditor";
import LastFocusContext from "@/context/lastFocus";
import ExporterContext from "@/context/exporter";
import FieldValueInspectorContext from "@/context/fieldValueInspector";
import BlockContextMenuContext from "@/context/blockContextMenu";
import { nextTick, watch } from "vue";
import { calcPopoverPos } from "@/utils/popover";
import Field from "../icons/Field.vue";
import { FieldSettingsDialogContext } from "@/context/fieldSettingsDialog";
import BlockRefTagSettingsDialogContext from "@/context/blockRefTagSettingsDialog";
import { getProperties } from "@/common/helper-functions/block";
import { nanoid } from "nanoid";
import type { BlockProperties } from "@/common/type-and-schemas/block/block-properties";

type CommandExec = (
  test: boolean,
  blockId: BlockId | undefined,
  event: MouseEvent | undefined,
) => boolean;

const taskQueue = useTaskQueue();
const { blockEditor, blocksManager } = BlocksDropdown.useContext()!;
const { openBlockMover } = BlockMoverContext.useContext()!;
const { favoriteBlockIds } = FavoriteContext.useContext()!;
const { sidePaneBlockIds, addToSidePane: addToSidePaneImpl } = SidebarContext.useContext()!;
const { lastFocusedBlockTree } = LastFocusContext.useContext()!;
const { openExporter } = ExporterContext.useContext()!;
const { openFieldValuesInspector } = FieldValueInspectorContext.useContext()!;
const { open, showPos, clickedBlockId } = BlockContextMenuContext.useContext()!;
const { openDialog: openFieldSettingsDialog } = FieldSettingsDialogContext.useContext()!;
const { openDialog: openBlockRefTagSettingsDialog } =
  BlockRefTagSettingsDialogContext.useContext()!;

watch(showPos, async () => {
  await nextTick();
  if (!showPos.value) return;
  const el = document.querySelector("[data-radix-popper-content-wrapper]");
  if (!(el instanceof HTMLElement)) return;
  const { x, y } = showPos.value!;
  const elRect = el.getBoundingClientRect();
  const popoverPos = calcPopoverPos(elRect.width, elRect.height, x, y, {});

  // 默认向右下弹出
  // 这里把弹出位置作为 CSS 变量绑定到 body 上
  // 因为 shadcn / radix 把 popover 的样式写死了
  // 只能这样去覆盖
  document.body.style.setProperty("--popover-x", `${popoverPos.rightDown.x}px`);
  document.body.style.setProperty("--popover-y", `${popoverPos.rightDown.y}px`);
});

const predefinedColors = ["red", "green", "blue", "yellow", "gray", "orange", "purple", undefined];

const deleteBlock: CommandExec = (test, blockId) => {
  if (!test && blockId) {
    taskQueue.addTask(async () => {
      await blockEditor.deleteBlock({ blockId });
    });
  }
  return !!blockId;
};

const moveBlock: CommandExec = (test, blockId, event) => {
  if (!test && blockId && event) {
    const pos = { x: event.clientX, y: event.clientY };
    setTimeout(() => {
      openBlockMover(pos, blockId);
    }, 200); // 等待 contextmenu 的动画结束
  }
  return !!blockId;
};

const moveBlockLeaveRef: CommandExec = (test, blockId, event) => {
  if (!test && blockId && event) {
    const pos = { x: event.clientX, y: event.clientY };
    setTimeout(() => {
      openBlockMover(pos, blockId, { leaveRef: true });
    }, 200); // 等待 contextmenu 的动画结束
  }
  return !!blockId;
};

const addToSidePane: CommandExec = (test, blockId) => {
  const notInSidePane = !!blockId && !sidePaneBlockIds.value.includes(blockId);
  if (!test && notInSidePane) {
    addToSidePaneImpl(blockId);
  }
  return !!blockId && notInSidePane;
};

const addToFavorite: CommandExec = (test, blockId) => {
  const notInFavorite = !!blockId && !favoriteBlockIds.value.includes(blockId);
  if (!test && notInFavorite) {
    favoriteBlockIds.value.push(blockId);
  }
  return !!blockId && notInFavorite;
};

const insertMirrorBelow: CommandExec = (test, blockId) => {
  if (!test && blockId) {
    taskQueue.addTask(async () => {
      const pos: BlockPos = {
        baseBlockId: blockId,
        offset: 1,
      };
      const tree = lastFocusedBlockTree.value;
      if (!tree) return;
      await blockEditor.insertMirrorBlock({ pos, srcBlockId: blockId });
      const diBelow = tree.getDiBelow(blockId);
      diBelow && tree.focusDi(diBelow[0].itemId);
    });
  }
  return !!blockId;
};

const exportBlock: CommandExec = (test, blockId, event) => {
  if (!test && blockId) {
    openExporter(blockId);
  }
  return !!blockId;
};

const openFieldValuesInspectorCommand: CommandExec = (test, blockId) => {
  if (!test && blockId) {
    openFieldValuesInspector(blockId);
  }
  return !!blockId;
};

const openFieldSettingsDialogCommand: CommandExec = (test, blockId) => {
  if (!test && blockId) {
    openFieldSettingsDialog(blockId);
  }
  return !!blockId;
};

const openBlockRefTagSettingsDialogCommand: CommandExec = (test, blockId) => {
  if (!test && blockId) {
    openBlockRefTagSettingsDialog(blockId);
  }
  return !!blockId;
};

const getBlockRefColorSetter: (color: string | undefined) => CommandExec =
  (color) => (test, blockId, event) => {
    if (!test && blockId && event) {
      taskQueue.addTask(async () => {
        const block = blocksManager.getBlock(blockId);
        if (!block) return;
        blockEditor.setBlockMetadata({
          blockId,
          metadata: {
            ...block.metadata,
            blockRefColor: color,
          },
        });
      });
    }
    return !!blockId;
  };

const addMetadata: CommandExec = (test, blockId) => {
  if (!test && blockId) {
    taskQueue.addTask(() => {
      const block = blocksManager.getBlock(blockId);
      if (!block) return;
      const properties = getProperties(block);
      const newProperties = {
        ...properties,
        ["Field " + nanoid()]: { type: "decimal", value: 0 },
      } satisfies BlockProperties;
      blockEditor.setBlockMetadata({
        blockId,
        metadata: { ...block.metadata, properties: newProperties },
      });
    });
  }
  return !!blockId;
};
</script>

<style lang="scss">
[data-radix-popper-content-wrapper]:has(> .block-contextmenu-content) {
  transform: translate(var(--popover-x), var(--popover-y)) !important;
}
</style>
