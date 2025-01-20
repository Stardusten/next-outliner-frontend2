<template>
  <div
    class="header-bar fixed top-0 left-0 flex flex-row justify-between items-center w-[calc(100vw-16px)] z-10 bg-background bg-clip-content"
    :style="{ paddingRight, transition }"
  >
    <div
      class="flex flex-row w-full justify-between items-center py-[10px] pl-[8px] overflow-hidden"
    >
      <div class="left-part mr-2 flex-shrink-0">
        <!-- 左边的按钮 -->
        <div class="left-buttons">
          <LeftButtons />
        </div>
      </div>

      <div class="w-0 flex-1 flex items-center justify-center">
        <BlockPath :block-id="mainRootBlockId" @click-path-segment="handleClickPathSegment" />
      </div>

      <div class="right-part flex flex-row items-center flex-shrink-0">
        <!-- 同步状态 -->
        <Tooltip>
          <TooltipTrigger>
            <Dot class="size-8" :class="synced ? 'stroke-green-500' : 'stroke-red-500'" />
          </TooltipTrigger>
          <TooltipContent>
            {{ t(`kbView.syncStatus.${synced ? "synced" : "disconnected"}`) }}
          </TooltipContent>
        </Tooltip>

        <!-- 右边的按钮 -->
        <div class="right-buttons">
          <Tooltip v-for="(button, index) in rightButtons" :key="index">
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                :class="button.active?.value ? 'bg-muted' : 'w-fit min-w-8'"
                @focus="preventFocus"
                @click="button.onClick"
              >
                <HeaderBarItem :item="button" iconOnly />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <component :is="button.label" />
            </TooltipContent>
          </Tooltip>
        </div>

        <!-- 更多选项 -->
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" @focus="preventFocus">
                  <MoreVertical class="size-5 stroke-[1.8]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {{ t("kbView.headerBar.moreOptions") }}
              </TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="mr-2">
            <DropdownMenuItem
              v-for="(item, index) in moreOptions"
              :key="index"
              @click="item.onClick"
            >
              <HeaderBarItem :item="item" iconClass="!size-4" />
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe class="size-4 mr-3" />
                {{ $t("languages.label") }}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem
                    v-for="locale in $i18n.availableLocales"
                    :key="locale"
                    :checked="$i18n.locale === locale"
                    @click="$i18n.locale = locale"
                  >
                    {{ $t(`languages.${locale}`) }}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="tsx">
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AttachmentsManagerContext from "@/context/attachmentsManager";
import BlocksContext from "@/context/blocks/blocks";
import FocusModeContext from "@/context/focusMode";
import FusionCommandContext from "@/context/fusionCommand";
import MainTreeContext from "@/context/mainTree";
// import MenubarContext from "@/context/menubar";
import HistoryContext from "@/context/history";
import { KbInfoContext } from "@/context/kbinfo";
import KeymapContext from "@/context/keymap";
import ServerInfoContext from "@/context/serverInfo";
import SettingsPanelContext from "@/context/settingsPanel";
import SidebarContext from "@/context/sidebar";
import ThemeContext from "@/context/theme";
import TimeMachineContext from "@/context/timeMachine";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Dot,
  Download,
  FolderClosed,
  FolderInput,
  Globe,
  HelpCircle,
  History,
  Keyboard,
  LogOut,
  Moon,
  MoreVertical,
  PanelRight,
  Search,
  Settings,
  Sun,
} from "lucide-vue-next";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { HeaderBarItemType } from ".";
import BlockPath from "../BlockPath.vue";
import DailynoteNavigator from "../dailynote-navigator/DailynoteNavigator.vue";
import { useToast } from "../ui/toast";
import HeaderBarItem from "./HeaderBarItem.vue";
import LeftButtons from "./LeftButtons.vue";

const { sidePaneOpen, sidePaneDir, sidePaneWidth, enableSidePaneAnimation } =
  SidebarContext.useContext()!;
const { open: openSettingsPanel } = SettingsPanelContext.useContext()!;
const { open: openAttachmentsManager } = AttachmentsManagerContext.useContext()!;
// const { menuPaneOpen } = MenubarContext.useContext();
const { theme, toggleTheme } = ThemeContext.useContext()!;
const { focusModeEnabled } = FocusModeContext.useContext()!;
const { timeMachineOpen } = TimeMachineContext.useContext()!;
const { openFusionCommand } = FusionCommandContext.useContext()!;
const { synced } = BlocksContext.useContext()!;
const { mainRootBlockId } = MainTreeContext.useContext()!;
const { logout } = ServerInfoContext.useContext()!;
const { currKbInfo } = KbInfoContext.useContext()!;
const openImporter = ref(false);
const { t } = useI18n();
const { goPrev, goNext, canGoPrev, canGoNext } = HistoryContext.useContext()!;
const { openKeybindings } = KeymapContext.useContext()!;
const { toast } = useToast();

const handleClickPathSegment = (blockId: BlockId) => {
  mainRootBlockId.value = blockId;
};

// 计算 header 的宽度
// 16px 是 padding
const paddingRight = computed(() =>
  sidePaneOpen.value && sidePaneDir.value === "right" ? `${sidePaneWidth.value}px` : "0px",
);

const transition = computed(() =>
  enableSidePaneAnimation.value
    ? "padding 500ms var(--tf), opacity 500ms var(--tf)"
    : "opacity 500ms var(--tf)",
);

// 阻止按钮聚焦
const preventFocus = (e: FocusEvent) => {
  (e.target as HTMLElement)?.blur();
};

const leftButtons: HeaderBarItemType[] = [
  // {
  //   icon: Menu,
  //   label: () => <>{menuPaneOpen.value ? "关闭菜单栏" : "打开菜单栏"}</>,
  //   onClick: () => {
  //     console.log("click menu", menuPaneOpen.value);
  //     menuPaneOpen.value = !menuPaneOpen.value;
  //   },
  //   active: menuPaneOpen,
  // },
  {
    icon: ArrowLeft,
    label: () => <>后退</>,
    disabled: computed(() => !canGoPrev.value),
    onClick: goPrev,
  },
  {
    icon: ArrowRight,
    label: () => <>前进</>,
    disabled: computed(() => !canGoNext.value),
    onClick: goNext,
  },
];

const rightButtons: HeaderBarItemType[] = [
  {
    icon: () => (
      <DailynoteNavigator>
        <CalendarDays class="size-5 stroke-[1.8]" />
      </DailynoteNavigator>
    ),
    label: () => t("kbView.headerBar.dailynoteNavigator"),
    onClick: () => {},
  },
  {
    icon: () => <Search class="size-5 stroke-[1.8]" />,
    label: () => <>{t("kbView.headerBar.search")}</>,
    onClick: () => openFusionCommand(""),
  },
  {
    icon: () => (
      <div>
        {theme.value === "dark" ? (
          <Moon class="size-5 stroke-[1.8]" />
        ) : (
          <Sun class="size-5 stroke-[1.8]" />
        )}
      </div>
    ),
    label: () =>
      theme.value === "dark"
        ? t("kbView.headerBar.switchLightTheme")
        : t("kbView.headerBar.switchDarkTheme"),
    onClick: toggleTheme,
  },
  {
    icon: () => <Bell class="size-5 stroke-[1.8]" />,
    label: () => t("kbView.headerBar.notifications"),
    onClick: () => {},
  },
  {
    icon: PanelRight,
    label: () =>
      sidePaneOpen.value ? t("kbView.headerBar.closeSidepane") : t("kbView.headerBar.openSidepane"),
    onClick: () => (sidePaneOpen.value = !sidePaneOpen.value),
    active: sidePaneOpen,
  },
];

const moreOptions: HeaderBarItemType[] = [
  {
    icon: Download,
    label: () => t("kbView.headerBar.export"),
    onClick: () => {},
  },
  {
    icon: FolderInput,
    label: () => t("kbView.headerBar.import"),
    onClick: () => {
      console.log("open importer");
      openImporter.value = true;
    },
  },
  // {
  //   icon: Focus,
  //   label: () =>
  //     focusModeEnabled.value
  //       ? t("kbView.headerBar.exitFocusMode")
  //       : t("kbView.headerBar.enterFocusMode"),
  //   onClick: () => (focusModeEnabled.value = !focusModeEnabled.value),
  // },
  {
    icon: FolderClosed,
    label: () => t("kbView.headerBar.attachmentsManager"),
    onClick: () => (openAttachmentsManager.value = true),
  },
  {
    icon: History,
    label: () => t("kbView.headerBar.timeMachine"),
    onClick: () => (timeMachineOpen.value = true),
  },
  {
    icon: Settings,
    label: () => t("kbView.headerBar.settings"),
    onClick: () => (openSettingsPanel.value = true),
  },
  {
    icon: Keyboard,
    label: () => t("kbView.headerBar.keybindings"),
    onClick: () => (openKeybindings.value = true),
  },
  {
    icon: HelpCircle,
    label: () => t("kbView.headerBar.help"),
    onClick: () => {},
  },
  {
    icon: LogOut,
    label: () => t("kbView.headerBar.exit"),
    onClick: logout,
  },
];
</script>
