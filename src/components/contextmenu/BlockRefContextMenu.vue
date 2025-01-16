<template>
  <Popover v-model:open="open">
    <PopoverTrigger class="hidden" />
    <PopoverContent class="block-ref-contextmenu-content p-3 w-[350px]">
      <div class="text-sm font-medium mb-2">{{ $t("kbView.blockRefContextMenu.title") }}</div>

      <!-- 别名列表 -->
      <div class="space-y-0.5 mb-2">
        <div v-if="aliasBlocks.length === 0" class="text-sm text-center text-muted-foreground pb-1">
          {{ $t("kbView.blockRefContextMenu.noAliases") }}
        </div>
        <div v-else v-for="b in aliasBlocks" :key="b.id" class="flex items-center py-0.5 px-1">
          <GripVertical class="size-4 mr-1.5 text-muted-foreground" />
          <div class="flex-1">
            <BlockContent :block="b as any" />
          </div>
          <div class="flex items-center gap-2">
            <!-- <Pencil class="size-4 text-blue-500 opacity-70 cursor-pointer hover:opacity-100" /> -->
            <AlertDialog>
              <AlertDialogTrigger>
                <Trash2 class="size-4 text-red-500 opacity-70 cursor-pointer hover:opacity-100" />
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
                  <Button variant="destructive" @click="handleDeleteAlias(b.id)">
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
        <Button variant="ghost" size="icon" class="h-7 w-7">
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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-vue-next";
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

const { open, showPos, clickedBlockId } = BlockRefContextmenuContext.useContext()!;
const { getFieldValues } = FieldsManagerContext.useContext()!;
const { blocksManager, blockEditor } = BlocksContext.useContext()!;

const aliasBlocks = ref<Block[]>([]);
const newAlias = ref("");
watch([open, clickedBlockId], ([open, clickedBlockId]) => {
  if (!open || !clickedBlockId) return;
  const fieldValues = getFieldValues(clickedBlockId);
  const aliasIds = fieldValues?.["Alias"] ?? [];

  const result: Block[] = [];
  for (const id of aliasIds) {
    const block = blocksManager.getBlock(id);
    if (block) result.push(block);
  }
  aliasBlocks.value = result;
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

const handleAddAlias = () => {};

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
