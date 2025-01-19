<template>
  <Popover v-if="fieldInfo">
    <PopoverTrigger as-child>
      <slot />
    </PopoverTrigger>
    <PopoverContent class="w-[300px] p-2">
      <div class="space-y-2">
        <!-- Build Index Switch -->
        <div class="flex items-center justify-between">
          <Label class="text-sm font-normal">{{
            $t("kbView.blockRefTagSettings.buildIndex")
          }}</Label>
          <Switch class="scale-75 h-6" v-model="fieldInfo.metadata.buildIndex" />
        </div>
        <!-- Value Type Select -->
        <div class="flex items-center justify-between">
          <Label class="text-sm font-normal">{{
            $t("kbView.blockRefTagSettings.valueType")
          }}</Label>
          <Select
            :model-value="valueType2str(fieldInfo.metadata.valueType)"
            @update:model-value="fieldInfo.metadata.valueType = str2valueType($event)"
          >
            <SelectTrigger class="h-8 w-[200px]">
              <SelectValue :placeholder="$t('kbView.blockRefTagSettings.selectValueType')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="richtext">{{
                $t("kbView.blockRefTagSettings.valueTypes.richtext")
              }}</SelectItem>
              <SelectItem value="blockRef">{{
                $t("kbView.blockRefTagSettings.valueTypes.blockRef")
              }}</SelectItem>
              <SelectItem value="fileRef">{{
                $t("kbView.blockRefTagSettings.valueTypes.fileRef")
              }}</SelectItem>
              <SelectItem value="arrayOfBlockRef">{{
                $t("kbView.blockRefTagSettings.valueTypes.arrayOfBlockRef")
              }}</SelectItem>
              <SelectItem value="arrayOfFileRef">{{
                $t("kbView.blockRefTagSettings.valueTypes.arrayOfFileRef")
              }}</SelectItem>
              <SelectItem value="arrayOfRichText">{{
                $t("kbView.blockRefTagSettings.valueTypes.arrayOfRichText")
              }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import type { FieldValueType } from "@/context/fieldsManager";
import type { FieldInfo } from ".";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";

const props = defineProps<{
  fieldInfo: FieldInfo;
}>();

const valueType2str = (valueType: FieldValueType) => {
  console.log(valueType);
  if (valueType.type === "richtext") return "richtext";
  else if (valueType.type === "blockRef") return "blockRef";
  else if (valueType.type === "fileRef") return "fileRef";
  else if (valueType.type === "array") {
    if (valueType.itemType === "richtext") return "arrayOfRichText";
    else if (valueType.itemType === "blockRef") return "arrayOfBlockRef";
    else if (valueType.itemType === "fileRef") return "arrayOfFileRef";
  }
};

const str2valueType = (str: string) => {
  if (str === "richtext") return { type: "richtext" };
  else if (str === "blockRef") return { type: "blockRef" };
  else if (str === "fileRef") return { type: "fileRef" };
  else if (str === "arrayOfRichText") return { type: "array", itemType: "richtext" };
  else if (str === "arrayOfBlockRef") return { type: "array", itemType: "blockRef" };
  else if (str === "arrayOfFileRef") return { type: "array", itemType: "fileRef" };
};
</script>
