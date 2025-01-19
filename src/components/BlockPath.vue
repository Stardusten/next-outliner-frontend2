<template>
  <Breadcrumb>
    <BreadcrumbList class="!gap-x-1 !gap-y-0">
      <template v-for="(block, index) in displayPath" :key="index">
        <BreadcrumbItem v-if="typeof block !== 'string'">
          <BreadcrumbLink
            class="no-underline cursor-pointer"
            @click="emit('click-path-segment', block.id)"
          >
            <template v-if="isTextContent(block)">
              <BlockContent
                class="!max-w-[unset] *:cursor-pointer *:max-w-[30ch] *:!whitespace-pre *:truncate"
                :block="block"
                :block-tree="undefined"
                :readonly="true"
              />
            </template>
            <template v-else>
              {{ getBlockTypeLabel(block) }}
            </template>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem v-else>
          <span class="px-1">...</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="index !== displayPath.length - 1"> / </BreadcrumbSeparator>
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang="ts">
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import BlocksContext from "@/context/blocks/blocks";
import { computed } from "vue";
import BlockContent from "./block-contents/BlockContent.vue";
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import { useI18n } from "vue-i18n";
import type { Block } from "@/context/blocks/view-layer/blocksManager";

interface Props {
  blockId: BlockId;
  includeSelf?: boolean;
  maxTotalLength?: number;
  minVisibleSegments?: number;
}

const props = withDefaults(defineProps<Props>(), {
  includeSelf: false,
  maxTotalLength: 100,
  minVisibleSegments: 2,
});

const emit = defineEmits<{
  (e: "click-path-segment", blockId: BlockId): void;
}>();

const { t } = useI18n();
const { blocksManager } = BlocksContext.useContext()!;

const normalizedPath = computed(() => {
  const path = [...blocksManager.getBlockPath(props.blockId)];
  path.reverse();
  if (!props.includeSelf) {
    path.pop();
  }
  return path;
});

const isTextContent = (block: Block) => {
  return block.content[0] === BLOCK_CONTENT_TYPES.TEXT;
};

const getBlockTypeLabel = (block: Block) => {
  switch (block.content[0]) {
    case BLOCK_CONTENT_TYPES.IMAGE:
      return t("kbView.blockPath.image");
    case BLOCK_CONTENT_TYPES.VIDEO:
      return t("kbView.blockPath.video");
    case BLOCK_CONTENT_TYPES.CODE:
      return t("kbView.blockPath.code");
    case BLOCK_CONTENT_TYPES.MATH:
      return t("kbView.blockPath.math");
    case BLOCK_CONTENT_TYPES.CAROUSEL:
      return t("kbView.blockPath.carousel");
    case BLOCK_CONTENT_TYPES.AUDIO:
      return t("kbView.blockPath.audio");
    case BLOCK_CONTENT_TYPES.QUERY:
      return t("kbView.blockPath.query");
    default:
      return t("kbView.blockPath.unknown");
  }
};

const displayPath = computed(() => {
  const path = normalizedPath.value;
  if (!path.length) return [];

  // 计算总长度
  let totalLength = 0;
  const segments = path.map((block) => {
    const text = isTextContent(block) ? block.ctext : getBlockTypeLabel(block);
    totalLength += text.length;
    return { block, length: text.length };
  });

  // 如果总长度在限制内，直接返回完整路径
  if (totalLength <= props.maxTotalLength) return path;

  // 保留开头和结尾的块，中间用 ... 代替
  const result = [];
  const start = path.slice(0, props.minVisibleSegments);
  const end = path.slice(-props.minVisibleSegments);

  result.push(...start);
  result.push("...");
  result.push(...end);

  return result;
});
</script>
