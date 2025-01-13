<template>
  <Dialog v-model:open="timeMachineOpen">
    <DialogContent class="p-4 pt-5" @open-auto-focus.prevent>
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <History class="size-5 mr-2" />
          时光机
        </DialogTitle>
        <DialogDescription> 备份和恢复你的笔记 </DialogDescription>
      </DialogHeader>
      <div class="w-full space-y-4">
        <div class="rounded-md border p-2">
          <div
            v-for="backup in backups"
            :key="backup.name"
            class="flex justify-between items-center"
          >
            <div>
              <span>{{ backup.name }}</span>
              <span class="text-muted-foreground ml-2 text-sm"
                >{{ (backup.size / 1024 / 1024).toFixed(2) }} MB</span
              >
            </div>
            <div>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" class="size-7 p-0">
                    <Eye class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>预览此备份</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" class="size-7 p-0 !text-blue-500">
                    <Undo class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>回退到此备份</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" class="size-7 p-0 !text-red-500">
                    <Trash class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>删除此备份</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" class="w-full" autofocus>
          <Plus class="size-4 mr-2" />
          创建新备份
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import TimeMachineContext from "@/context/timeMachine";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, History, Delete, Trash, Eye, Undo } from "lucide-vue-next";
import { ref } from "vue";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

const { timeMachineOpen } = TimeMachineContext.useContext()!;

type Backup = {
  name: string;
  size: number;
};

const backups = ref<Backup[]>([
  {
    name: "备份 1",
    size: 1.3 * 1024 * 1024,
  },
  {
    name: "备份 2",
    size: 1.5 * 1024 * 1024,
  },
  {
    name: "备份 3",
    size: 1.6 * 1024 * 1024,
  },
  {
    name: "备份 4",
    size: 1.82 * 1024 * 1024,
  },
]);
</script>
