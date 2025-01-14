<template>
  <Dialog v-model:open="timeMachineOpen">
    <DialogContent class="p-4 pt-5" @open-auto-focus.prevent>
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <History class="size-5 mr-2" />
          {{ $t("kbView.timeMachine.title") }}
        </DialogTitle>
        <DialogDescription>{{ $t("kbView.timeMachine.description") }}</DialogDescription>
      </DialogHeader>
      <div class="w-full space-y-4 text-sm">
        <div class="rounded-md border px-2 py-1">
          <div v-if="backups.length === 0" class="py-1">
            <p class="text-center text-muted-foreground">{{ $t("kbView.timeMachine.noBackup") }}</p>
          </div>
          <div
            v-for="backup in backups"
            :key="backup.name"
            class="flex justify-between items-center"
          >
            <div>
              <span>{{ backup.name }}</span>
              <span class="text-muted-foreground ml-2">
                {{
                  $t("kbView.timeMachine.size", { size: (backup.size / 1024 / 1024).toFixed(2) })
                }}
              </span>
            </div>
            <div>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" class="size-7 p-0">
                    <Eye class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ $t("kbView.timeMachine.preview") }}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" class="size-7 p-0 !text-blue-500">
                    <Undo class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ $t("kbView.timeMachine.restore") }}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" class="size-7 p-0 !text-red-500">
                    <Trash class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ $t("kbView.timeMachine.delete") }}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div class="w-full flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="sm" @click="refreshBackups">
                <RefreshCcw class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ $t("kbView.timeMachine.refresh") }}</p>
            </TooltipContent>
          </Tooltip>

          <Button variant="outline" size="sm" class="flex-grow" @click="createBackup" autofocus>
            <Plus class="size-4 mr-2" />
            {{ $t("kbView.timeMachine.createBackup") }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import TimeMachineContext from "@/context/timeMachine";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, History, Delete, Trash, Eye, Undo, RefreshCcw } from "lucide-vue-next";
import { ref } from "vue";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

const { timeMachineOpen, refreshBackups, backups, createBackup } = TimeMachineContext.useContext()!;
</script>
