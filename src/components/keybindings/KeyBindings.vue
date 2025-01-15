<template>
  <Drawer v-model:open="openKeybindings">
    <DrawerTrigger>
      <slot />
    </DrawerTrigger>

    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{{ $t("kbView.keybindings.title") }}</DrawerTitle>
        <DrawerDescription>{{ $t("kbView.keybindings.description") }}</DrawerDescription>
      </DrawerHeader>

      <div class="p-4 space-y-4 max-h-[calc(90vh-150px)] overflow-y-auto">
        <div v-for="(group, groupName) in keyBindings" :key="groupName" class="space-y-2">
          <h3 class="font-medium text-muted-foreground text-sm">{{ groupName }}</h3>
          <div class="space-y-1">
            <div
              v-for="(binding, index) in group"
              :key="index"
              class="flex justify-between items-center text-sm"
            >
              <span>{{ binding.description }}</span>
              <kbd class="px-2 py-1 bg-muted rounded">{{ binding.key }}</kbd>
            </div>
          </div>
        </div>
      </div>

      <DrawerFooter>
        <DrawerClose asChild>
          <Button variant="ghost"> {{ $t("kbView.keybindings.close") }} </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import KeymapContext from "@/context/keymap";
import { Button } from "../ui/button";
import { useI18n } from "vue-i18n";

const { openKeybindings } = KeymapContext.useContext()!;
const { t } = useI18n();

// 定义按键绑定数据
const keyBindings = {
  [t("kbView.keybindings.groups.commands")]: [
    { key: "Alt/Option + ↑", description: t("kbView.keybindings.commands.swapUp") },
    { key: "Alt/Option + ↓", description: t("kbView.keybindings.commands.swapDown") },
    { key: "Command/Ctrl + ↓", description: t("kbView.keybindings.commands.expand") },
    { key: "Command/Ctrl + ↑", description: t("kbView.keybindings.commands.collapse") },
    { key: "Command/Ctrl + Shift + ↑", description: t("kbView.keybindings.commands.collapseAll") },
    { key: "Command/Ctrl + Shift + ↓", description: t("kbView.keybindings.commands.expandAll") },
    { key: "Tab", description: t("kbView.keybindings.commands.indent") },
    { key: "Shift + Tab", description: t("kbView.keybindings.commands.outdent") },
    { key: "@", description: t("kbView.keybindings.commands.insertBlockRef") },
    { key: "#", description: t("kbView.keybindings.commands.insertTag") },
    { key: "Alt/Option + m", description: t("kbView.keybindings.commands.insertInlineMath") },
    {
      key: "Alt/Option + Shift + m",
      description: t("kbView.keybindings.commands.insertBlockMath"),
    },
    { key: "Command/Ctrl + b", description: t("kbView.keybindings.commands.bold") },
    { key: "Command/Ctrl + i", description: t("kbView.keybindings.commands.italic") },
    { key: "Command/Ctrl + `", description: t("kbView.keybindings.commands.code") },
    { key: "Command/Ctrl + =", description: t("kbView.keybindings.commands.highlight") },
    { key: "```<language><space>", description: t("kbView.keybindings.commands.toCodeblock") },
    { key: "Command/Ctrl + z", description: t("kbView.keybindings.commands.undo") },
    { key: "Command/Ctrl + Shift + z", description: t("kbView.keybindings.commands.redo") },
    { key: "Shift + Enter", description: t("kbView.keybindings.commands.softBreak") },
    { key: "Command/Ctrl + p", description: t("kbView.keybindings.commands.openFusionCommand") },
    {
      key: "Command/Ctrl + k",
      description: t("kbView.keybindings.commands.addToSidePane"),
    },
  ],
};
</script>
