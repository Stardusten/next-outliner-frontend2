<template>
  <Collapsible :open="isExpanded">
    <div class="group flex items-center h-8 px-2 hover:bg-muted rounded-sm overflow-hidden">
      <CollapsibleTrigger as-child class="h-full flex-shrink-0">
        <Button variant="ghost" class="p-0 w-6" @click="onToggle">
          <ChevronRight
            class="size-4 transition-transform duration-200"
            :class="{ 'rotate-90': isExpanded }"
          />
        </Button>
      </CollapsibleTrigger>
      <FileItem
        :name="name"
        :path="path"
        :is-directory="true"
        :mtime="mtime"
        :ctime="ctime"
        :size="size"
      />
    </div>
    <CollapsibleContent class="ml-6">
      <template v-for="subDirent in subDirents" :key="subDirent.name">
        <FileItem
          :name="subDirent.name"
          :path="`${path}${getSeperator()}${subDirent.name}`"
          :is-directory="subDirent.isDirectory"
          :file-info="subDirent"
          :mtime="subDirent.mtime"
          :ctime="subDirent.ctime"
          :size="subDirent.size"
        />
      </template>
      <div v-if="filteredCount" class="text-xs ml-10 text-muted-foreground py-1">
        {{ $t("kbView.attachmentsManager.hiddenFiles", { count: filteredCount }) }}
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-vue-next";
import FileItem from "./FileItem.vue";
import type { Dirents } from "@/common/type-and-schemas/dirents";
import { getSeperator } from "@/common/helper-functions/path";

defineProps<{
  name: string;
  path: string;
  isExpanded: boolean;
  mtime: Date | string;
  ctime: Date | string;
  size: number;
  subDirents: Dirents[string][];
  filteredCount?: number;
  onToggle: () => void;
}>();
</script>
