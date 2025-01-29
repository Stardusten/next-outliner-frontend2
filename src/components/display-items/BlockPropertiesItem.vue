<template>
  <div class="block-properties-item" v-if="Object.keys(editingProperties).length > 0">
    <div class="indent-lines">
      <div class="indent-line" v-for="i in level + 1" :key="i" :data-level="i"></div>
    </div>
    <div class="border w-full ml-[20px] mt-2 mb-1 px-2 py-1 rounded-md">
      <div
        v-for="(property, key) in editingProperties"
        class="flex items-center w-full gap-2 group"
        :style="{ fontFamily: 'var(--text-font)' }"
      >
        <div class="flex items-center gap-2 basis-1/2">
          <Tooltip>
            <TooltipTrigger asChild>
              <PropertyIcon :type="property.type" class="size-4 shrink-0 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              {{ $t("kbView.blockProperties.tooltips.propertyType", { type: property.type }) }}
            </TooltipContent>
          </Tooltip>
          <AutoResizeInput
            class="border-none h-[unset] p-0 focus-visible:ring-transparent min-w-0"
            :model-value="editingKeys[key] ?? key"
            @update:model-value="(v) => handlePropertyKeyEdit(key, v as string)"
            @blur="handlePropertyKeyBlur(key)"
          />
        </div>

        <div class="basis-1/2 flex items-center">
          <DecimalPropertyValue
            v-if="property.type === 'decimal'"
            :model-value="property.value"
            @update:model-value="handlePropertyValueEdit(key, $event)"
          />
          <FloatPropertyValue
            v-else-if="property.type === 'float'"
            :model-value="property.value"
            @update:model-value="handlePropertyValueEdit(key, $event)"
          />
          <PlainTextPropertyValue
            v-else-if="['plaintext', 'email', 'phone'].includes(property.type)"
            :model-value="property.value"
            @update:model-value="handlePropertyValueEdit(key, $event)"
          />
          <SelectPropertyValue
            v-else-if="property.type === 'select'"
            :model-value="property.value"
            :options="property.options"
            @update:model-value="handlePropertyValueEdit(key, $event)"
          />
          <CheckboxPropertyValue
            v-else-if="property.type === 'checkbox'"
            :model-value="property.value"
            @update:model-value="handlePropertyValueEdit(key, $event)"
          />
          <DatePropertyValue
            v-else-if="property.type === 'date'"
            :model-value="property.value"
            @update:model-value="handlePropertyValueEdit(key, $event)"
          />
          <DateTimePropertyValue
            v-else-if="property.type === 'datetime'"
            :model-value="property.value"
            @update:model-value="handlePropertyValueEdit(key, $event)"
          />
          <MultiSelectPropertyValue
            v-else-if="property.type === 'multiselect'"
            :model-value="property.value"
            :options="property.options"
            @update:model-value="handlePropertyValueEdit(key, $event)"
          />
        </div>

        <div
          class="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                :data-show="property.type === 'select' || property.type === 'multiselect'"
                class="p-1 data-[show=false]:opacity-0 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                @click="handleConfigOptions(key)"
              >
                <Settings class="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {{ $t("kbView.blockProperties.tooltips.configOptions") }}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                class="p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                @click="handleDeleteProperty(key)"
              >
                <Trash class="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {{ $t("kbView.blockProperties.tooltips.deleteProperty") }}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <AddPropertyDropdown @add-property="handleAddProperty" />
    </div>
    <OptionsConfigDialog
      v-model:open="showOptionsDialog"
      :options="editingOptions"
      @update:options="handleOptionsDialogSave"
    />
  </div>
</template>

<script setup lang="ts">
import {
  blockPropertyDefaults,
  type BlockProperties,
} from "@/common/type-and-schemas/block/block-properties";
import BlocksContext from "@/context/blocks/blocks";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import { useTaskQueue } from "@/plugins/taskQueue";
import type { DisplayItem, DisplayItemId } from "@/utils/display-item";
import { useDebounceFn } from "@vueuse/core";
import cloneDeep from "lodash.clonedeep";
import isEqual from "lodash.isequal";
import { Settings, Trash } from "lucide-vue-next";
import { nanoid } from "nanoid";
import { ref, watch } from "vue";
import AutoResizeInput from "../auto-resize-input/AutoResizeInput.vue";
import AddPropertyDropdown from "../block-properties/AddPropertyDropdown.vue";
import PropertyIcon from "../block-properties/PropertyIcon.vue";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import DecimalPropertyValue from "../block-properties/DecimalPropertyValue.vue";
import FloatPropertyValue from "../block-properties/FloatPropertyValue.vue";
import PlainTextPropertyValue from "../block-properties/PlainTextPropertyValue.vue";
import SelectPropertyValue from "../block-properties/SelectPropertyValue.vue";
import CheckboxPropertyValue from "../block-properties/CheckboxPropertyValue.vue";
import DatePropertyValue from "../block-properties/DatePropertyValue.vue";
import DateTimePropertyValue from "../block-properties/DateTimePropertyValue.vue";
import MultiSelectPropertyValue from "../block-properties/MultiSelectPropertyValue.vue";
import OptionsConfigDialog from "../block-properties/OptionsConfigDialog.vue";

const props = defineProps<{
  blockTree?: BlockTree;
  block: Block;
  level: number;
  itemType?: DisplayItem["type"];
  itemId?: DisplayItemId;
}>();
const { blockEditor } = BlocksContext.useContext()!;
const editingProperties = ref<BlockProperties>({});
const editingKeys = ref<Record<string, string>>({});
const showOptionsDialog = ref(false);
const editingOptions = ref<string[]>([]);
const editingPropertyKey = ref<string>("");

watch(
  () => props.block.metadata.properties,
  (newProperties) => {
    if (!isEqual(newProperties, editingProperties.value)) {
      editingProperties.value = newProperties;
    }
  },
  { immediate: true, deep: true },
);

const updateBlockProperties = useDebounceFn((newProperties: BlockProperties) => {
  const taskQueue = useTaskQueue();
  taskQueue.addTask(async () => {
    const newMetadata = cloneDeep({ ...props.block.metadata, properties: newProperties });
    blockEditor.setBlockMetadata({
      blockId: props.block.id,
      metadata: newMetadata,
    });
  });
}, 500);

const renameKey = (obj: Record<string, any>, oldKey: string, newKey: string) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => (key === oldKey ? [newKey, value] : [key, value])),
  );
};

const handlePropertyKeyEdit = (oldKey: string, newKey: string) => {
  editingKeys.value[oldKey] = newKey;
};

const handlePropertyKeyBlur = (oldKey: string) => {
  const newKey = editingKeys.value[oldKey];
  if (!newKey || newKey === oldKey) {
    delete editingKeys.value[oldKey];
    return;
  }

  // 检查新键是否已存在
  if (editingProperties.value[newKey]) {
    delete editingKeys.value[oldKey];
    return;
  }

  // 重命名属性
  editingProperties.value = renameKey(editingProperties.value, oldKey, newKey);
  delete editingKeys.value[oldKey];
  updateBlockProperties(editingProperties.value);
};

const handlePropertyValueEdit = (key: string, value: BlockProperties[string]["value"]) => {
  editingProperties.value[key] = { ...editingProperties.value[key], value };
  updateBlockProperties(editingProperties.value);
};

const handleAddProperty = (type: BlockProperties[string]["type"]) => {
  editingProperties.value["Field " + nanoid()] = blockPropertyDefaults[type];
  updateBlockProperties(editingProperties.value);
};

const handleDeleteProperty = (key: string) => {
  delete editingProperties.value[key];
  updateBlockProperties(editingProperties.value);
};

const handleConfigOptions = (key: string) => {
  editingPropertyKey.value = key;
  editingOptions.value = (editingProperties.value[key] as any).options || [];
  showOptionsDialog.value = true;
};

const handleOptionsDialogSave = (options: string[]) => {
  const key = editingPropertyKey.value;
  if (!key) return;

  editingProperties.value[key] = {
    ...editingProperties.value[key],
    options,
  } as any;
  updateBlockProperties(editingProperties.value);
};
</script>

<style lang="scss">
.block-properties-item {
  display: flex;

  .indent-lines {
    display: flex;

    .indent-line {
      width: calc(var(--block-indent-width) - var(--block-indent-adjust));
      height: 100%;
      border-right: var(--border-indent);
      margin-right: var(--block-indent-adjust);
      border-right: 1px solid var(--indent-line-color);
    }
  }
}
</style>
