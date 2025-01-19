<template>
  <Popover v-model:open="open">
    <PopoverTrigger class="hidden" />
    <PopoverContent class="block-ref-contextmenu-content p-3 w-[350px]" @open-auto-focus.prevent>
      <div class="text-sm font-medium mb-2">{{ $t("kbView.blockRefContextMenu.title") }}</div>

      <!-- 别名列表 -->
      <div class="space-y-0.5 mb-2">
        <div v-if="aliases.length === 0" class="text-sm text-center text-muted-foreground pb-2">
          {{ $t("kbView.blockRefContextMenu.noAliases") }}
        </div>
        <div
          v-else
          v-for="info in aliases"
          :key="info.block.id"
          class="flex items-center py-0.5 px-1"
        >
          <GripVertical class="size-4 mr-1.5 text-muted-foreground" />
          <div class="flex-1">
            <BlockContent class="!text-sm" :block="info.block as any" />
          </div>
          <div class="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <div class="text-sm text-muted-foreground">{{ info.backlinks.size }}</div>
              </TooltipTrigger>
              <TooltipContent>
                {{ $t("kbView.blockRefContextMenu.backlinkCount", { count: info.backlinks.size }) }}
              </TooltipContent>
            </Tooltip>
            <AlertDialog>
              <AlertDialogTrigger :disabled="info.backlinks.size > 0">
                <Tooltip>
                  <TooltipTrigger>
                    <Trash2
                      class="size-4 text-red-500 cursor-pointer"
                      :class="
                        info.backlinks.size > 0 ? 'opacity-30' : 'opacity-70 hover:opacity-100'
                      "
                    />
                  </TooltipTrigger>
                  <TooltipContent v-if="info.backlinks.size > 0">
                    {{ $t("kbView.blockRefContextMenu.cannotDelete") }}
                  </TooltipContent>
                </Tooltip>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{
                    $t("kbView.blockRefContextMenu.deleteAlias.title")
                  }}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {{ $t("kbView.blockRefContextMenu.deleteAlias.description") }}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {{ $t("kbView.blockRefContextMenu.deleteAlias.cancel") }}
                  </AlertDialogCancel>
                  <Button variant="destructive" @click="handleDeleteAlias(info.block.id)">
                    {{ $t("kbView.blockRefContextMenu.deleteAlias.confirm") }}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <!-- 添加新别名 -->
      <div class="flex items-center gap-2">
        <Input
          v-model="newAlias"
          :placeholder="$t('kbView.blockRefContextMenu.addAlias')"
          class="flex-1 h-8 text-sm"
        />
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          :disabled="newAlias.trim().length === 0"
          @click="handleAddAlias"
        >
          <Plus class="size-4" />
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import BlockRefContextmenuContext from "@/context/blockRefContextmenu";
import BlocksContext from "@/context/blocks/blocks";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import FieldsManagerContext from "@/context/fieldsManager";
import { calcPopoverPos } from "@/utils/popover";
import { GripVertical, Pencil, Plus, Trash2, Settings } from "lucide-vue-next";
import { nextTick, ref, watch } from "vue";
import BlockContent from "../block-contents/BlockContent.vue";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { useTaskQueue } from "@/plugins/taskQueue";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import BacklinksContext from "@/context/backlinks";
import { plainTextToTextContent } from "@/utils/pm";
import { getPmSchema } from "../prosemirror/pmSchema";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";

const { open, showPos, clickedBlockId } = BlockRefContextmenuContext.useContext()!;
const { getFieldValues } = FieldsManagerContext.useContext()!;
const { blocksManager, blockEditor } = BlocksContext.useContext()!;
const { getAllAliases, addAlias, getBacklinks } = BacklinksContext.useContext()!;

type AliasInfo = {
  block: Block;
  backlinks: Set<BlockId>;
};

const aliases = ref<AliasInfo[]>([]);
const newAlias = ref("");

watch([open, clickedBlockId], ([open, clickedBlockId]) => {
  if (!open || !clickedBlockId) return;
  updateAliases(clickedBlockId);
});

watch(showPos, async () => {
  await nextTick();
  if (!showPos.value) return;
  const el = document.querySelector("[data-radix-popper-content-wrapper]");
  if (!(el instanceof HTMLElement)) return;
  const { x, y } = showPos.value!;
  const elRect = el.getBoundingClientRect();
  const popoverPos = calcPopoverPos(elRect.width, elRect.height, x, y, {});
  newAlias.value = "";

  // 默认向右下弹出
  // 这里把弹出位置作为 CSS 变量绑定到 body 上
  // 因为 shadcn / radix 把 popover 的样式写死了
  // 只能这样去覆盖
  document.body.style.setProperty("--popover-x", `${popoverPos.rightDown.x}px`);
  document.body.style.setProperty("--popover-y", `${popoverPos.rightDown.y}px`);
});

const updateAliases = (blockId: BlockId) => {
  const aliasIds = getAllAliases(blockId, true);

  const result: AliasInfo[] = [];
  for (const id of aliasIds) {
    const block = blocksManager.getBlock(id);
    if (!block) continue;
    const backlinks = getBacklinks(id, "both", false);
    result.push({ block, backlinks });
  }
  aliases.value = result;
};

const handleAddAlias = () => {
  if (!clickedBlockId.value) return;
  const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
  const aliasContent = plainTextToTextContent(newAlias.value, schema);
  addAlias(clickedBlockId.value, aliasContent);
  updateAliases(clickedBlockId.value); // 添加别名后，手动更新别名列表
  newAlias.value = "";
};

const handleDeleteAlias = (aliasId: string) => {
  const taskQueue = useTaskQueue();
  taskQueue.addTask(async () => {
    blockEditor.deleteBlock({ blockId: aliasId });
  });
};
</script>

<style lang="scss">
[data-radix-popper-content-wrapper]:has(> .block-ref-contextmenu-content) {
  transform: translate(var(--popover-x), var(--popover-y)) !important;
}
</style>
