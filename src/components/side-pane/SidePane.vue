<template>
  <div class="right-pane z-20 overflow-hidden flex flex-col">
    <div class="z-20 flex items-center flex-shrink-0 justify-between py-[10px] px-[8px] mr-2">
      <div>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="sidePaneOpen = false">
              <ChevronsRight class="size-5 stroke-[1.8]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {{ $t("kbView.sidePane.collapse") }}
          </TooltipContent>
        </Tooltip>

        <Tooltip v-if="sidePaneDir === 'bottom'">
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="sidePaneDir = 'right'">
              <PanelRight class="size-5 stroke-[1.8]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {{ $t("kbView.sidePane.moveToRight") }}
          </TooltipContent>
        </Tooltip>

        <Tooltip v-if="sidePaneDir === 'right'">
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="sidePaneDir = 'bottom'">
              <PanelBottom class="size-5 stroke-[1.8]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {{ $t("kbView.sidePane.moveToBottom") }}
          </TooltipContent>
        </Tooltip>
      </div>

      <div>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="openSearchAndAdd">
              <Plus class="size-5 stroke-[1.8]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {{ $t("kbView.sidePane.searchAndAdd") }}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon">
              <SortDesc class="size-5 stroke-[1.8]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {{ $t("kbView.sidePane.setSort") }}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon">
              <Filter class="size-5 stroke-[1.8]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {{ $t("kbView.sidePane.setFilter") }}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>

    <div
      class="text-center flex-grow flex flex-col items-center justify-center"
      v-if="sidePaneBlockIds.length === 0"
    >
      <p class="text-2xl font-semibold text-muted-foreground">{{ $t("kbView.sidePane.empty") }}</p>
      <p class="text-sm mt-2 text-muted-foreground whitespace-pre-wrap leading-6">
        {{ $t("kbView.sidePane.emptyTip") }}
      </p>
    </div>

    <BlockTree
      v-else
      id="side-pane"
      class="h-full -mt-4"
      :root-block-ids="sidePaneBlockIds"
      :root-block-level="0"
      :add-side-pane-header="true"
      :enlarge-root-block="false"
      :show-backlinks="false"
      :show-potential-links="false"
      :padding-top="0"
    ></BlockTree>

    <!-- drag handler -->
    <div
      v-if="sidePaneDir === 'bottom'"
      class="absolute top-0 z-30 left-0 w-full h-1 cursor-row-resize"
      @mousedown="handleMouseDown"
    ></div>
    <div
      v-if="sidePaneDir === 'right'"
      class="absolute top-0 z-30 left-0 w-1 h-full cursor-col-resize"
      @mousedown="handleMouseDown"
    ></div>
  </div>
</template>

<script setup lang="tsx">
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import RefSuggestionsContext from "@/context/refSuggestions";
import SidebarContext from "@/context/sidebar";
import { ChevronsRight, Filter, PanelBottom, PanelRight, Plus, SortDesc } from "lucide-vue-next";
import BlockTree from "../BlockTree.vue";

const {
  sidePaneDir,
  sidePaneOpen,
  sidePaneWidth,
  sidePaneHeight,
  enableSidePaneAnimation,
  sidePaneBlockIds,
  addToSidePane,
} = SidebarContext.useContext()!;
const { openRefSuggestions, close } = RefSuggestionsContext.useContext()!;

const handleMouseMove = (e: MouseEvent) => {
  if (sidePaneDir.value === "right") {
    sidePaneWidth.value = window.innerWidth - e.x;
  } else {
    sidePaneHeight.value = window.innerHeight - e.y;
  }
};

const handleMouseUpOrLeave = () => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUpOrLeave);
  document.removeEventListener("mouseleave", handleMouseUpOrLeave);
  enableSidePaneAnimation.value = true; // 拖曳结束时恢复 padding 动画
};

const handleMouseDown = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  // 拖曳时关闭 padding 动画，让效果立即生效
  enableSidePaneAnimation.value = false;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUpOrLeave);
  document.addEventListener("mouseleave", handleMouseUpOrLeave);
};

const openSearchAndAdd = (e: MouseEvent) => {
  openRefSuggestions({
    showPos: { x: e.clientX, y: e.clientY },
    onSelectBlock: (blockId) => {
      addToSidePane(blockId);
      close();
    },
    onSelectNothing: close,
    allowCreateNew: false,
    allowFileRef: false,
  });
};
</script>
