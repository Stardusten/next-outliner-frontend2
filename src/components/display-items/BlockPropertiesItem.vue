<template>
  <div class="block-properties-item">
    <div class="indent-lines">
      <div class="indent-line" v-for="i in level + 1" :key="i" :data-level="i"></div>
    </div>
    <div class="bg-muted/70 w-full ml-[18px] px-2 py-1 my-1 rounded">
      <div
        v-for="[key, property] in Object.entries(properties)"
        class="flex items-center w-full gap-2"
        :style="{ fontFamily: 'var(--text-font)' }"
      >
        <div class="flex items-center gap-2 min-w-0 basis-[calc(50%-3rem)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <PropertyIcon :type="property.type" class="size-4 shrink-0 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              {{ $t("kbView.blockProperties.tooltips.propertyType", { type: property.type }) }}
            </TooltipContent>
          </Tooltip>
          <span class="truncate">{{ key }}</span>
        </div>
        <div class="truncate min-w-0 basis-[calc(50%-3rem)]">{{ property.value }}</div>
        <div class="flex items-center shrink-0 ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                class="p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                @click="openEditDialog(key, property)"
              >
                <Pencil class="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {{ $t("kbView.blockProperties.tooltips.editProperty") }}
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
  </div>
  <EditPropertyDialog
    v-model:open="editDialogOpen"
    :property-key="editingProperty?.key"
    :property="editingProperty?.property"
    :existing-keys="Object.keys(properties)"
    @save="handlePropertyEdit"
  />
</template>

<script setup lang="ts">
import { getProperties } from "@/common/helper-functions/block";
import type { Block } from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import type { DisplayItem, DisplayItemId } from "@/utils/display-item";
import { computed, ref } from "vue";
import PropertyIcon from "../block-properties/PropertyIcon.vue";
import AddPropertyDropdown from "../block-properties/AddPropertyDropdown.vue";
import { Pencil, Trash } from "lucide-vue-next";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import EditPropertyDialog from "../block-properties/EditPropertyDialog.vue";
import {
  BlockPropertyDefaultValues as blockPropertyDefaultValues,
  type BlockProperties,
} from "@/common/type-and-schemas/block/block-properties";
import { useTaskQueue } from "@/plugins/taskQueue";
import { nanoid } from "nanoid";
import BlocksContext from "@/context/blocks/blocks";

const props = defineProps<{
  blockTree?: BlockTree;
  block: Block;
  level: number;
  itemType?: DisplayItem["type"];
  itemId?: DisplayItemId;
}>();
const { blockEditor } = BlocksContext.useContext()!;
const properties = computed(() => getProperties(props.block));
const editDialogOpen = ref(false);
const editingProperty = ref<{ key: string; property: BlockProperties[string] } | null>(null);

function renameKey(obj: Record<string, any>, oldKey: string, newKey: string) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => (key === oldKey ? [newKey, value] : [key, value])),
  );
}

const openEditDialog = (key: string, property: BlockProperties[string]) => {
  editingProperty.value = { key, property };
  editDialogOpen.value = true;
};

const handlePropertyEdit = (
  oldKey: string,
  newKey: string,
  newValue: BlockProperties[string]["value"],
) => {
  const taskQueue = useTaskQueue();
  taskQueue.addTask(async () => {
    const newProperties = renameKey(properties.value, oldKey, newKey);
    newProperties[newKey] = {
      ...newProperties[newKey],
      value: newValue,
    };
    const newMetadata = { ...props.block.metadata, properties: newProperties };
    blockEditor.setBlockMetadata({
      blockId: props.block.id,
      metadata: newMetadata,
    });
  });
};

const handleAddProperty = (type: BlockProperties[string]["type"]) => {
  const taskQueue = useTaskQueue();
  taskQueue.addTask(async () => {
    const newProperties = {
      ...properties.value,
      ["Field " + nanoid()]: {
        type,
        value: blockPropertyDefaultValues[type],
      },
    };
    const newMetadata = { ...props.block.metadata, properties: newProperties };
    blockEditor.setBlockMetadata({
      blockId: props.block.id,
      metadata: newMetadata,
    });
  });
};

const handleDeleteProperty = (key: string) => {
  const taskQueue = useTaskQueue();
  taskQueue.addTask(async () => {
    const newProperties = { ...properties.value };
    delete newProperties[key];
    const newMetadata = { ...props.block.metadata, properties: newProperties };
    blockEditor.setBlockMetadata({
      blockId: props.block.id,
      metadata: newMetadata,
    });
  });
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
