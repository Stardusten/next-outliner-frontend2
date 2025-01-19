<template>
  <div
    class="block-item flex items-center ml-6 mt-10 mb-2 text-muted-foreground"
    data-item-type="backlink-header"
  >
    <Link class="size-4 mr-2" />
    <div>{{ $t("kbView.backlinksPanel.nBacklinks", { count: backlinks.length }) }}</div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <MoreHorizontal class="size-4 ml-2 cursor-pointer hover:text-primary transition-colors" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="min-w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuItem> <ListTree class="size-4 mr-2" /> 显示路径 </DropdownMenuItem>

          <!-- 切换视图 -->
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <PanelsTopLeft class="size-4 mr-2" /> 切换视图
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem> <List class="size-4 mr-2" /> 列表视图 </DropdownMenuItem>
                <DropdownMenuItem> <Table class="size-4 mr-2" /> 表格视图 </DropdownMenuItem>
                <DropdownMenuItem> <Kanban class="size-4 mr-2" /> 看板视图 </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SortAsc class="size-4 mr-2" /> 排序规则
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
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
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <!-- <DropdownMenuItem> <ListCollapse class="size-4 mr-2" /> 分组规则 </DropdownMenuItem> -->
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import {
  ListTree,
  List,
  Link,
  Table,
  Kanban,
  MoreHorizontal,
  PanelsTopLeft,
  SortAsc,
  ListCollapse,
  ArrowUpAZ,
  ArrowDownAZ,
  CalendarArrowUp,
  CalendarArrowDown,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const props = defineProps<{
  blockId: BlockId;
  backlinks: BlockId[];
}>();
</script>
