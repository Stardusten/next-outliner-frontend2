<template>
  <Dialog v-model:open="open" v-if="property">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <Field class="size-4 mr-2" />
          {{ $t("kbView.blockProperties.editDialog.title") }}
        </DialogTitle>
        <DialogDescription>
          {{ $t("kbView.blockProperties.editDialog.description") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <!-- 属性类型 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">{{ $t("kbView.blockProperties.editDialog.type") }}</Label>
          <Input :model-value="property.type" disabled class="col-span-3" />
        </div>

        <!-- 属性键 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">{{ $t("kbView.blockProperties.editDialog.key") }}</Label>
          <div class="col-span-3 space-y-1">
            <Input v-model="editedKey" :error="isDuplicateKey" />
            <p v-if="isDuplicateKey" class="text-sm pt-1 text-red-500">
              {{ $t("kbView.blockProperties.editDialog.duplicateKey") }}
            </p>
          </div>
        </div>

        <!-- 属性值 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">{{ $t("kbView.blockProperties.editDialog.value") }}</Label>
          <div class="col-span-3">
            <!-- 数字类型 -->
            <Input
              v-if="property.type === 'decimal' || property.type === 'float'"
              v-model="editedValue"
              type="number"
              :step="property.type === 'float' ? 'any' : '1'"
            />

            <!-- 文本类型 -->
            <Input
              v-else-if="
                property.type === 'plaintext' ||
                property.type === 'email' ||
                property.type === 'phone'
              "
              v-model="editedValue"
              :type="property.type === 'email' ? 'email' : 'text'"
            />

            <!-- 日期类型 -->
            <Input v-else-if="property.type === 'date'" v-model="editedValue" type="date" />

            <!-- 日期时间类型 -->
            <Input
              v-else-if="property.type === 'datetime'"
              v-model="editedValue"
              type="datetime-local"
            />

            <!-- 复选框类型 -->
            <Checkbox v-else-if="property.type === 'checkbox'" v-model="editedValue" class="ml-2" />

            <!-- 选择类型 -->
            <Select v-else-if="property.type === 'select'" v-model="editedValue">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in property.options" :key="option" :value="option">
                  {{ option }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- 多选类型 -->
            <!-- TODO: Implement multi-select component -->
          </div>
        </div>
      </div>
      <DialogFooter>
        <div class="flex items-center justify-between w-full">
          <p
            class="text-sm text-orange-500 flex items-center"
            :class="{ invisible: !hasUnsavedChanges }"
          >
            <CircleAlert class="size-4 mr-2" />
            {{ $t("kbView.blockProperties.editDialog.unsavedChanges") }}
          </p>
          <div class="flex gap-2">
            <Button variant="outline" @click="handleCancel">
              {{ $t("kbView.blockProperties.editDialog.cancel") }}
            </Button>
            <Button @click="handleSave" :disabled="isDuplicateKey || !editedKey.trim()">
              {{ $t("kbView.blockProperties.editDialog.save") }}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Settings, CircleAlert } from "lucide-vue-next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { BlockProperties } from "@/common/type-and-schemas/block/block-properties";
import Field from "../icons/Field.vue";

const props = defineProps<{
  propertyKey: string | null | undefined;
  property: BlockProperties[string] | null | undefined;
  existingKeys?: string[];
}>();

const open = defineModel<boolean>("open");
const emits = defineEmits<{
  save: [oldKey: string, newKey: string, value: BlockProperties[string]["value"]];
}>();

const editedKey = ref(props.propertyKey ?? "");
const editedValue = ref(props.property?.value);

const isDuplicateKey = computed(() => {
  if (!props.existingKeys || !editedKey.value.trim()) return false;
  return props.existingKeys.includes(editedKey.value) && editedKey.value !== props.propertyKey;
});

// 监听 props 变化，更新编辑值
watch(
  () => props.propertyKey,
  (newKey) => {
    editedKey.value = newKey ?? "";
  },
);

watch(
  () => props.property?.value,
  (newValue) => {
    editedValue.value = newValue;
  },
);

const hasUnsavedChanges = computed(
  () => editedKey.value !== props.propertyKey || editedValue.value !== props.property?.value,
);

const handleCancel = () => {
  editedKey.value = props.propertyKey ?? "";
  editedValue.value = props.property?.value;
  open.value = false;
};

const handleSave = () => {
  if (!props.propertyKey) return;
  emits("save", props.propertyKey, editedKey.value, editedValue.value);
  open.value = false;
};
</script>
