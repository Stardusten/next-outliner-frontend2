<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <slot />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>
        {{ $t("kbView.blockRefTagSettings.addTypes.single") }}
      </DropdownMenuLabel>
      <DropdownMenuItem @click="emit('addField', { type: 'richtext' })">
        <LetterText class="size-4 mr-2" />
        {{ $t("kbView.blockRefTagSettings.addTypes.richText") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addField', { type: 'blockRef' })">
        <Link class="size-4 mr-2" />
        {{ $t("kbView.blockRefTagSettings.addTypes.blockReference") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addField', { type: 'fileRef' })">
        <File class="size-4 mr-2" />
        {{ $t("kbView.blockRefTagSettings.addTypes.file") }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>
        {{ $t("kbView.blockRefTagSettings.addTypes.array") }}
      </DropdownMenuLabel>
      <DropdownMenuItem @click="emit('addField', { type: 'array', itemType: 'blockRef' })">
        <Link class="size-4 mr-2" />
        {{ $t("kbView.blockRefTagSettings.addTypes.arrayOfBlockReference") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addField', { type: 'array', itemType: 'fileRef' })">
        <File class="size-4 mr-2" />
        {{ $t("kbView.blockRefTagSettings.addTypes.arrayOfFileReference") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addField', { type: 'array', itemType: 'richtext' })">
        <List class="size-4 mr-2" />
        {{ $t("kbView.blockRefTagSettings.addTypes.arrayOfBlock") }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { File, LetterText, Link, List } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import type { FieldValueType } from "@/context/fieldsManager";

const emit = defineEmits<{
  (event: "addField", type: FieldValueType): void;
}>();
</script>
