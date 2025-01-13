<template>
  <!-- 头部栏 -->
  <HeaderBar />
  <!-- mr-1 是为了让滚动条和屏幕边缘留出一点空隙 -->
  <BlockTree
    v-if="synced && rootBlockRef"
    class="h-[100vh] mr-1"
    id="main"
    :style="{
      paddingRight: sidePaneOpen && sidePaneDir === 'right' ? `${sidePaneWidth}px` : '0px',
      paddingBottom: sidePaneOpen && sidePaneDir === 'bottom' ? `${sidePaneHeight}px` : '0px',
      transition: enableSidePaneAnimation ? 'padding 500ms var(--tf)' : 'none',
    }"
    :root-block-ids="[mainRootBlockId]"
    :root-block-level="0"
    :padding-top="60"
    :enlarge-root-block="true"
  ></BlockTree>
  <div
    v-else
    class="h-[100vh] mr-1 flex justify-center items-center text-muted-foreground"
    :style="{
      paddingRight: sidePaneOpen && sidePaneDir === 'right' ? `${sidePaneWidth}px` : '0px',
      paddingBottom: sidePaneOpen && sidePaneDir === 'bottom' ? `${sidePaneHeight}px` : '0px',
      transition: enableSidePaneAnimation ? 'padding 500ms var(--tf)' : 'none',
    }"
  >
    <Loader2 class="animate-spin mr-2" />
    {{ $t("kbView.loadingKb") }}
  </div>
  <!-- 右侧侧边栏 -->
  <Transition @leave="handleCloseR" @enter="handleOpenR">
    <SidePane
      v-if="sidePaneOpen && sidePaneDir === 'right'"
      class="absolute right-0 top-0 h-full border-l"
      :style="{ width: `${sidePaneWidth}px` }"
    />
  </Transition>
  <!-- 底部侧边栏 -->

  <Transition @leave="handleCloseB" @enter="handleOpenB">
    <SidePane
      v-if="sidePaneOpen && sidePaneDir === 'bottom'"
      class="absolute bottom-0 left-0 w-[100vw] border-t"
      :style="{ height: `${sidePaneHeight}px` }"
    />
  </Transition>
  <!-- 菜单栏 -->
  <!-- <MenuPane /> -->
  <!-- 浮动数学输入框 -->
  <FloatingMathInput />
  <!-- 融合命令 -->
  <FusionCommand />
  <!-- 时光机 -->
  <TimeMachine />
  <RefSuggestions />
  <!-- 附件管理器 -->
  <AttachmentsManager />
  <!-- 设置面板 -->
  <SettingsPanel />
  <!-- 块移动 popover -->
  <BlockMover />
  <!-- 粘贴对话框 -->
  <PasteDialog />
  <!-- 浮动编辑器 -->
  <FloatingEditor />
  <!-- 导出器 -->
  <Exporter />
  <!-- 属性检视器 -->
  <FieldValueInspector />
  <!-- <ImageEditor /> -->
  <!-- keybinding 展示 -->
  <KeyBindings />
  <!-- 块上下文菜单 -->
  <BlockContextMenu />
</template>

<script setup lang="ts">
import TimeMachine from "@/components/time-machine/TimeMachine.vue";
import BlockMover from "@/block-mover/BlockMover.vue";
import BlockTree from "@/components/BlockTree.vue";
import Exporter from "@/components/exporter/Exporter.vue";
import FieldValueInspector from "@/components/field-values-inspector/FieldValueInspector.vue";
import FloatingEditor from "@/components/floating-editor/FloatingEditor.vue";
import PasteDialog from "@/components/paste-dialog/PasteDialog.vue";
import RefSuggestions from "@/components/ref-suggestions/RefSuggestions.vue";
import SettingsPanel from "@/components/settings/SettingsPanel.vue";
import CreateNewTreeDialogContext from "@/context/createNewTreeDialog";
import MainTreeContext from "@/context/mainTree";
import { Loader2 } from "lucide-vue-next";
import { shallowRef, watch } from "vue";
import FloatingMathInput from "../../components/FloatingMathInput.vue";
import FusionCommand from "../../components/fusion-command/FusionCommand.vue";
import HeaderBar from "../../components/header-bar/HeaderBar.vue";
import SidePane from "../../components/side-pane/SidePane.vue";
import BlocksContext from "../../context/blocks/blocks";
import SidebarContext from "../../context/sidebar";
import AttachmentsManager from "@/components/attachments-mgr/AttachmentsManager.vue";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import { syncRef } from "@vueuse/core";
import KeyBindings from "@/components/keybindings/KeyBindings.vue";
import BlockContextMenu from "@/components/contextmenu/BlockContextMenu.vue";
// import ImageEditor from "@/components/image-editor/ImageEditor.vue";

const { sidePaneOpen, sidePaneDir, sidePaneWidth, sidePaneHeight, enableSidePaneAnimation } =
  SidebarContext.useContext()!;
const { synced, blocksManager } = BlocksContext.useContext()!;
const { mainRootBlockId } = MainTreeContext.useContext()!;
const rootBlockRef = blocksManager.getBlockRef("root");
const { openCreateNewTreeDialog, closeCreateNewTreeDialog } =
  CreateNewTreeDialogContext.useContext()!;

watch(synced, (newValue, oldValue) => {
  if (!oldValue && newValue) {
    // 由断开连接恢复到连接状态时，检查根块是否存在
    const rootBlockRef = blocksManager.getRootBlockRef();
    if (rootBlockRef.value == null) {
      blocksManager.createNewTree();
    } else {
      // 提交一个空更改，修复 undo 无法 undo 到初始 state 的问题
      const tr = blocksManager.createBlockTransaction({ type: "ui" });
      tr.commit();
    }
  }
});

const handleCloseR = (el: Element, done: () => void) => {
  if (!(el instanceof HTMLElement)) return;
  const animation = el.animate(
    [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: `translateX(100%)` },
    ] as any,
    {
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  );
  animation.onfinish = () => {
    done();
  };
};

const handleOpenR = (el: Element, done: () => void) => {
  if (!(el instanceof HTMLElement)) return;
  const animation = el.animate(
    [
      { opacity: 0, transform: `translateX(100%)` },
      { opacity: 1, transform: "translateX(0)" },
    ] as any,
    {
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  );
  animation.onfinish = () => {
    done();
  };
};

const handleCloseB = (el: Element, done: () => void) => {
  if (!(el instanceof HTMLElement)) return;
  const animation = el.animate(
    [
      {
        opacity: 1,
        transform: "translateY(0)",
      },
      { opacity: 0, transform: `translateY(100%)` },
    ] as any,
    {
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  );
  animation.onfinish = () => {
    done();
  };
};

const handleOpenB = (el: Element, done: () => void) => {
  if (!(el instanceof HTMLElement)) return;
  const animation = el.animate(
    [
      {
        opacity: 0,
        transform: `translateY(100%)`,
      },
      { opacity: 1, transform: "translateY(0)" },
    ] as any,
    {
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  );
  animation.onfinish = () => {
    done();
  };
};
</script>
