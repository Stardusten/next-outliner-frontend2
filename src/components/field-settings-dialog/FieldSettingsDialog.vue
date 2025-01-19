<template>
  <Dialog v-model:open="open">
    <DialogTrigger class="hidden" />
    <DialogContent class="max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <Field class="size-5 mr-2" />
          {{ $t("kbView.fieldSettings.title") }}
        </DialogTitle>
        <DialogDescription>
          {{ $t("kbView.fieldSettings.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 是否是 field -->
        <div class="flex items-center justify-between">
          <Label>{{ $t("kbView.fieldSettings.isField") }}</Label>
          <Switch :checked="isField" @update:checked="handleIsFieldChange" />
        </div>

        <!-- field 相关设置 -->
        <div v-if="isField" class="space-y-4">
          <hr class="border-b border-t-0 border-border pt-2" />

          <!-- 是否建立索引 -->
          <div class="flex items-center justify-between">
            <div>
              <Label>{{ $t("kbView.fieldSettings.buildIndex") }}</Label>
              <p class="text-sm text-muted-foreground">
                {{ $t("kbView.fieldSettings.buildIndexDescription") }}
              </p>
            </div>
            <Switch v-model="buildIndex" />
          </div>

          <!-- 值类型 -->
          <div class="space-y-2">
            <Label>{{ $t("kbView.fieldSettings.valueType") }}</Label>
            <Select v-model="valueType">
              <SelectTrigger>
                <SelectValue :placeholder="$t('kbView.fieldSettings.selectValueType')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="richtext">
                  {{ $t("kbView.fieldSettings.valueTypes.richtext") }}
                </SelectItem>
                <SelectItem value="blockRef">
                  {{ $t("kbView.fieldSettings.valueTypes.blockRef") }}
                </SelectItem>
                <SelectItem value="fileRef">
                  {{ $t("kbView.fieldSettings.valueTypes.fileRef") }}
                </SelectItem>
                <SelectItem value="array">
                  {{ $t("kbView.fieldSettings.valueTypes.array") }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 数组元素类型 -->
          <div v-if="valueType === 'array'" class="space-y-2">
            <Label>{{ $t("kbView.fieldSettings.arrayItemType") }}</Label>
            <Select v-model="arrayItemType">
              <SelectTrigger>
                <SelectValue :placeholder="$t('kbView.fieldSettings.selectArrayItemType')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="richtext">
                  {{ $t("kbView.fieldSettings.arrayItemTypes.richtext") }}
                </SelectItem>
                <SelectItem value="blockRef">
                  {{ $t("kbView.fieldSettings.arrayItemTypes.blockRef") }}
                </SelectItem>
                <SelectItem value="block">
                  {{ $t("kbView.fieldSettings.arrayItemTypes.block") }}
                </SelectItem>
                <SelectItem value="fileRef">
                  {{ $t("kbView.fieldSettings.arrayItemTypes.fileRef") }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <p v-if="hasUnsavedChanges" class="text-sm text-orange-500 mr-auto flex items-center">
          <CircleAlert class="size-4 mr-2" />
          {{ $t("kbView.fieldSettings.unsavedChanges") }}
        </p>
        <Button variant="outline" @click="open = false">
          {{ $t("kbView.fieldSettings.cancel") }}
        </Button>
        <Button @click="handleSave">
          {{ $t("kbView.fieldSettings.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import Field from "../icons/Field.vue";
import FieldsManagerContext from "@/context/fieldsManager";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { FieldSettingsDialogContext } from "@/context/fieldSettingsDialog";
import { CircleAlert } from "lucide-vue-next";

const { open, blockId } = FieldSettingsDialogContext.useContext()!;
const { getFieldMetadata, setBlockFieldMetadata } = FieldsManagerContext.useContext()!;

const isField = ref(false);
const buildIndex = ref(false);
const valueType = ref<"richtext" | "blockRef" | "array" | "fileRef">("richtext");
const arrayItemType = ref<"richtext" | "blockRef" | "block" | "fileRef">("richtext");

// 初始化表单数据
watch(
  blockId,
  () => {
    if (!blockId.value) return;
    const metadata = getFieldMetadata(blockId.value);
    if (metadata) {
      isField.value = true;
      buildIndex.value = metadata.buildIndex ?? false;
      valueType.value = metadata.valueType.type;
      if (metadata.valueType.type === "array") {
        arrayItemType.value = metadata.valueType.itemType;
      }
    } else {
      isField.value = false;
      buildIndex.value = false;
      valueType.value = "richtext";
      arrayItemType.value = "richtext";
    }
  },
  { immediate: true },
);

const handleIsFieldChange = (value: boolean) => {
  if (value) {
    isField.value = true;
  } else {
    isField.value = false;
    buildIndex.value = false;
    valueType.value = "richtext";
    arrayItemType.value = "richtext";
  }
};

const handleSave = () => {
  if (!blockId.value) return;
  if (!isField.value) {
    setBlockFieldMetadata(blockId.value, null);
  } else {
    setBlockFieldMetadata(blockId.value, {
      buildIndex: buildIndex.value,
      valueType:
        valueType.value === "array"
          ? { type: "array", itemType: arrayItemType.value }
          : { type: valueType.value },
    });
  }
  open.value = false;
};

const hasUnsavedChanges = computed(() => {
  if (!blockId.value) return false;
  const metadata = getFieldMetadata(blockId.value);

  // 检查是否有未保存的更改
  if (metadata) {
    if (!isField.value) return true;
    if (buildIndex.value !== (metadata.buildIndex ?? false)) return true;
    if (valueType.value !== metadata.valueType.type) return true;
    if (metadata.valueType.type === "array" && valueType.value === "array") {
      if (arrayItemType.value !== metadata.valueType.itemType) return true;
    }
  } else {
    if (isField.value) return true;
  }

  return false;
});
</script>
