<template>
  <TextContent
    v-if="block.content[0] === BLOCK_CONTENT_TYPES.TEXT"
    :block="block as TextBlock"
    :block-tree="blockTree"
    :readonly="readonly"
    :highlight-terms="highlightTerms"
    :highlight-refs="highlightRefs"
    :item-id="itemId"
  ></TextContent>
  <MathContent
    v-else-if="block.content[0] === BLOCK_CONTENT_TYPES.MATH"
    :block="block as MathBlock"
    :block-tree="blockTree"
    :readonly="readonly"
    :item-id="itemId"
  ></MathContent>
  <CodeContent
    v-else-if="block.content[0] === BLOCK_CONTENT_TYPES.CODE"
    :block="block as CodeBlock"
    :block-tree="blockTree"
    :readonly="readonly"
    :item-id="itemId"
  ></CodeContent>
  <ImageContent
    v-else-if="block.content[0] === BLOCK_CONTENT_TYPES.IMAGE"
    :block="block as ImageBlock"
    :block-tree="blockTree"
    :item-id="itemId"
  ></ImageContent>
  <AudioContent
    v-else-if="block.content[0] === BLOCK_CONTENT_TYPES.AUDIO"
    :block="block as AudioBlock"
    :block-tree="blockTree"
    :item-id="itemId"
  ></AudioContent>
  <VideoContent
    v-else-if="block.content[0] === BLOCK_CONTENT_TYPES.VIDEO"
    :block="block as VideoBlock"
    :block-tree="blockTree"
    :item-id="itemId"
  ></VideoContent>
</template>

<script setup lang="ts">
import { BLOCK_CONTENT_TYPES } from "@/common/constants";
import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import MathContent from "@/components/block-contents/MathContent.vue";
import TextContent from "@/components/block-contents/TextContent.vue";
import type {
  AudioBlock,
  Block,
  CodeBlock,
  ImageBlock,
  MathBlock,
  TextBlock,
  VideoBlock,
} from "@/context/blocks/view-layer/blocksManager";
import type { BlockTree } from "@/context/blockTree";
import type { DisplayItemId } from "@/utils/display-item";
import AudioContent from "../block-contents/AudioContent.vue";
import CodeContent from "../block-contents/CodeContent.vue";
import ImageContent from "../block-contents/ImageContent.vue";
import VideoContent from "../block-contents/VideoContent.vue";

defineProps<{
  block: Block;
  itemId?: DisplayItemId;
  blockTree?: BlockTree;
  readonly?: boolean;
  highlightTerms?: string[];
  highlightRefs?: BlockId[];
}>();
</script>
