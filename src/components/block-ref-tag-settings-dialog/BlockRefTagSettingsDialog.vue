<template>
  <Dialog v-model:open="open" v-if="currState">
    <DialogTrigger class="hidden" />
    <DialogContent class="max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <Tag class="size-5 mr-2" />
          {{ $t("kbView.blockRefTagSettings.title") }}
        </DialogTitle>
        <DialogDescription>
          {{ $t("kbView.blockRefTagSettings.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 引用/标签颜色 -->
        <div class="space-y-2">
          <Label>{{ $t("kbView.blockRefTagSettings.color") }}</Label>
          <div class="flex flex-wrap gap-2" ref="colorBtnsContainer">
            <Button
              v-for="color in predefinedColors"
              :key="color ?? 'undefined'"
              variant="outline"
              size="icon"
              class="size-8 [&.selected]:ring-2 [&.selected]:ring-primary"
              :class="{ selected: currState.selectedColor === color }"
              @click="currState.selectedColor = color"
            >
              <div
                class="size-4 rounded-sm relative"
                :style="{ backgroundColor: color ? `var(--highlight-${color})` : undefined }"
              >
                <div v-if="!color" class="absolute inset-0 flex items-center justify-center">
                  <div class="w-5 h-px bg-foreground rotate-45 transform origin-center"></div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        <!-- 关联的字段列表 -->
        <!-- <div class="space-y-2">
          <Label>{{ $t("kbView.blockRefTagSettings.relatedFields") }}</Label>
          <div class="flex flex-col items-center">
            <div
              v-if="currState.relatedFieldInfos.length === 0"
              class="text-sm text-muted-foreground mb-6"
            >
              {{ $t("kbView.blockRefTagSettings.noFields") }}
            </div>
            <div v-else class="w-full mb-2">
              <div
                v-for="field in currState.relatedFieldInfos"
                :key="field.id"
                class="flex items-center justify-between py-0.5 px-1"
              >
                <Field class="size-4 mr-2 mt-1 flex-shrink-0" />
                <Input
                  class="border-none py-0 px-2 mr-2 h-7 focus-visible:ring-transparent"
                  v-model="field.displayText"
                />
                <div class="flex items-center text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FieldSettingPopover :field-info="field">
                        <Button variant="ghost" size="icon" class="size-7">
                          <Settings class="size-4 flex-shrink-0" />
                        </Button>
                      </FieldSettingPopover>
                    </TooltipTrigger>
                    <TooltipContent>
                      {{ $t("kbView.blockRefTagSettings.tooltips.settings") }}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7"
                        @click="handleRemoveField(field.id)"
                      >
                        <Trash2
                          class="size-4 text-red-500 opacity-70 cursor-pointer hover:opacity-100"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {{ $t("kbView.blockRefTagSettings.tooltips.delete") }}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-start w-full gap-2">
              <AddNewFieldDropdown @add-field="handleAddNewField">
                <Button variant="outline" class="pl-2 pr-3 h-7 text-muted-foreground font-normal">
                  <Plus class="size-4 mr-2" />
                  {{ $t("kbView.blockRefTagSettings.addField") }}
                </Button>
              </AddNewFieldDropdown>

              <InsertExistingFieldPopover @select="handleInsertExistingField">
                <Button variant="outline" class="pl-2 pr-3 h-7 text-muted-foreground font-normal">
                  <Plus class="size-4 mr-2" />
                  {{ $t("kbView.blockRefTagSettings.insertExistingField") }}
                </Button>
              </InsertExistingFieldPopover>
            </div>
          </div>
        </div> -->
      </div>

      <DialogFooter>
        <p v-if="hasUnsavedChanges" class="text-sm text-orange-500 mr-auto flex items-center">
          <CircleAlert class="size-4 mr-2" />
          {{ $t("kbView.blockRefTagSettings.unsavedChanges") }}
        </p>
        <Button variant="outline" @click="open = false">
          {{ $t("kbView.blockRefTagSettings.cancel") }}
        </Button>
        <Button @click="handleSave">
          {{ $t("kbView.blockRefTagSettings.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import BlockRefTagSettingsDialogContext from "@/context/blockRefTagSettingsDialog";
import BlocksContext from "@/context/blocks/blocks";
import FieldsManagerContext, { type FieldValueType } from "@/context/fieldsManager";
import RefSuggestionsContext from "@/context/refSuggestions";
import { plainTextToTextContent } from "@/utils/pm";
import cloneDeep from "lodash.clonedeep";
import isEqual from "lodash.isequal";
import { CircleAlert, Plus, Settings, Tag, Trash2 } from "lucide-vue-next";
import { nanoid } from "nanoid";
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import type { FieldInfo } from ".";
import Field from "../icons/Field.vue";
import { getPmSchema } from "../prosemirror/pmSchema";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Input from "../ui/input/Input.vue";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import AddNewFieldDropdown from "./AddNewFieldDropdown.vue";
import FieldSettingPopover from "./FieldSettingPopover.vue";
import InsertExistingFieldPopover from "./InsertExistingFieldPopover.vue";
import type { MinimalBlock } from "@/context/blocks/view-layer/blocksManager";

const { open, blockId } = BlockRefTagSettingsDialogContext.useContext()!;
const { blocksManager, blockEditor } = BlocksContext.useContext()!;
const { getFieldMetadata, allFields } = FieldsManagerContext.useContext()!;
const { openRefSuggestions, close } = RefSuggestionsContext.useContext()!;

const predefinedColors = ["red", "green", "blue", "yellow", "gray", "orange", "purple", undefined];

type State = {
  selectedColor: string | undefined;
  relatedFieldInfos: FieldInfo[];
} | null;

const initState = ref<State>(null);
const currState = ref<State>(null);
const colorBtnsContainer = useTemplateRef("colorBtnsContainer");

watch(
  blockId,
  () => {
    if (!blockId.value) return;
    const block = blocksManager.getBlock(blockId.value);
    if (!block) return;

    // 加载关联的字段
    const relatedFieldIds = block.metadata?.relatedFieldIds ?? [];
    const relatedFieldInfos_: FieldInfo[] = [];
    for (const id of relatedFieldIds) {
      const field = allFields.value.get(id);
      if (field) {
        relatedFieldInfos_.push({
          id,
          displayText: blocksManager.getCtext(field.content),
          metadata: field.metadata,
        });
      }
    }

    initState.value = {
      selectedColor: block.metadata?.blockRefColor,
      relatedFieldInfos: relatedFieldInfos_,
    };

    currState.value = cloneDeep({
      selectedColor: block.metadata?.blockRefColor,
      relatedFieldInfos: relatedFieldInfos_,
    });

    // 聚焦到当前选中的颜色按钮
    nextTick(() => {
      const containerEl = colorBtnsContainer.value;
      if (!containerEl) return;
      const colorIndex = predefinedColors.indexOf(block.metadata?.blockRefColor);
      if (colorIndex === -1) return;
      const btnEl = containerEl.children[colorIndex];
      if (!(btnEl instanceof HTMLElement)) return;
      btnEl.focus();
    });
  },
  { immediate: true },
);

const hasUnsavedChanges = computed(
  () => JSON.stringify(initState.value) !== JSON.stringify(currState.value),
);

const handleAddNewField = (type: FieldValueType) => {
  if (!blockId.value || !currState.value) return;
  const id = nanoid();
  const newFieldInfo: FieldInfo = {
    id,
    displayText: "Field " + id,
    metadata: {
      buildIndex: false,
      valueType: type,
    },
  };
  currState.value.relatedFieldInfos.push(newFieldInfo);
};

const handleInsertExistingField = (field: MinimalBlock) => {
  if (!currState.value) return;
  currState.value.relatedFieldInfos.push({
    id: field.id,
    displayText: blocksManager.getCtext(field.content),
    metadata: field.metadata,
  });
};

const handleRemoveField = (fieldId: string) => {
  if (!currState.value) return;
  const index = currState.value.relatedFieldInfos.findIndex((field) => field.id === fieldId);
  if (index !== -1) currState.value.relatedFieldInfos.splice(index, 1);
};

const handleSave = () => {
  if (!blockId.value || !currState.value || !initState.value) return;

  const tr = blocksManager.createBlockTransaction({ type: "ui" });
  const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });

  const oldBlock = blocksManager.getBlock(blockId.value);
  if (!oldBlock) return;

  // 先全部深拷贝一份，防止之后在同步层发送到 worker 时无法序列化
  const currRelatedFieldInfos = cloneDeep(currState.value.relatedFieldInfos);
  const initRelatedFieldInfos = cloneDeep(initState.value.relatedFieldInfos);

  for (const currField of currRelatedFieldInfos) {
    const oldField = initRelatedFieldInfos.find((f) => f.id === currField.id);
    // 新增字段
    if (!oldField) {
      blockEditor.insertNormalBlock({
        id: currField.id,
        pos: { parentId: blockId.value, childIndex: 0 },
        content: plainTextToTextContent(currField.displayText, schema),
        meta: { field: cloneDeep(currField.metadata) },
        tr,
        commit: false,
      });
    }
    // 更新的字段
    else {
      if (isEqual(oldField.metadata, currField.metadata)) continue;

      blockEditor.setBlockMetadata({
        blockId: blockId.value,
        metadata: {
          ...oldField.metadata,
          ...currField.metadata,
        },
        tr,
        commit: false,
      });
    }
  }

  // 被删除的字段
  for (const field of initRelatedFieldInfos) {
    const deleted = !currRelatedFieldInfos.some((f) => f.id === field.id);
    if (deleted) {
      blockEditor.deleteBlock({
        blockId: field.id,
        tr,
        commit: false,
      });
    }
  }

  // 更新当前块的 relatedFieldIds
  blockEditor.setBlockMetadata({
    blockId: blockId.value,
    metadata: {
      ...oldBlock.metadata,
      blockRefColor: currState.value.selectedColor,
      relatedFieldIds: currRelatedFieldInfos.map((f) => f.id),
    },
    tr,
    commit: false,
  });

  tr.commit();

  open.value = false;
};
</script>
