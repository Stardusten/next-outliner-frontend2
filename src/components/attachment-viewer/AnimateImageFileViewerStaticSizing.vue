<template>
  <div class="flex flex-col h-full overflow-hidden gap-2">
    <div class="relative flex-grow overflow-hidden">
      <div class="relative">
        <div
          ref="containerRef"
          class="cursor-move"
          :style="{
            width: `${canvasWidth * scale}px`,
            height: `${canvasHeight * scale}px`,
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="stopDrag"
          @mouseleave="stopDrag"
        >
          <canvas
            ref="canvasRef"
            class="origin-top-left"
            :style="{ transform: `scale(${scale})` }"
          />
        </div>
      </div>

      <div
        class="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur rounded-md shadow-sm"
      >
        <Button variant="ghost" size="icon" class="size-6" @click="decreaseScale">
          <Minus class="size-4" />
        </Button>
        <span class="text-sm min-w-12 text-center">{{ Math.round(scale * 100) }}%</span>
        <Button variant="ghost" size="icon" class="size-6" @click="increaseScale">
          <Plus class="size-4" />
        </Button>
      </div>
    </div>

    <div class="flex items-center gap-2 px-2 rounded-md">
      <!-- 播放/暂停按钮 -->
      <Button variant="ghost" size="icon" @click="togglePlay">
        <Pause v-if="isPlaying" class="size-4" />
        <Play v-else class="size-4" />
      </Button>

      <!-- 上一帧按钮 -->
      <Button variant="ghost" size="icon" @click="prevFrame" :disabled="isPlaying">
        <SkipBack class="size-4" />
      </Button>

      <!-- 下一帧按钮 -->
      <Button variant="ghost" size="icon" @click="nextFrame" :disabled="isPlaying">
        <SkipForward class="size-4" />
      </Button>

      <!-- 进度条 -->
      <div class="flex-1 flex items-center gap-2">
        <Slider
          v-model="currentFrameIndex"
          :max="frames.length - 1"
          :step="1"
          :disabled="isPlaying"
          class="flex-1"
        />
        <span class="text-sm text-muted-foreground">
          {{ currentFrameIndex[0] + 1 }}/{{ frames.length }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ViewingAnimateImageState } from "@/context/attachmentViewer";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Play, Pause, SkipBack, SkipForward, Plus, Minus } from "lucide-vue-next";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { parseGIF, decompressFrames } from "gifuct-js";

const props = defineProps<{
  viewingAttachment: ViewingAnimateImageState;
}>();

const canvasRef = ref<HTMLCanvasElement>();
const ctx = ref<CanvasRenderingContext2D>();
const frames = ref<any[]>([]);
const currentFrameIndex = ref([0]);
const isPlaying = ref(false);
let animationId: number | null = null;
let lastFrameTime = 0;

// 添加缩放相关的状态和方法
const scale = ref(1);
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.2;

const increaseScale = () => {
  scale.value = Math.min(MAX_SCALE, scale.value + SCALE_STEP);
};

const decreaseScale = () => {
  scale.value = Math.max(MIN_SCALE, scale.value - SCALE_STEP);
};

// 添加画布尺寸状态
const canvasWidth = ref(0);
const canvasHeight = ref(0);

// 添加容器引用
const containerRef = ref<HTMLDivElement>();

// 添加拖拽相关状态
const isDragging = ref(false);
const offset = ref({ x: 0, y: 0 });
const dragStart = ref({ x: 0, y: 0 });

// 开始拖拽
const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragStart.value = {
    x: e.clientX - offset.value.x,
    y: e.clientY - offset.value.y,
  };
};

// 拖拽中
const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const container = containerRef.value?.parentElement;
  if (!container) return;

  // 计算新的偏移量
  const newX = e.clientX - dragStart.value.x;
  const newY = e.clientY - dragStart.value.y;

  // 计算容器和内容的尺寸
  const containerRect = container.getBoundingClientRect();
  const contentWidth = canvasWidth.value * scale.value;
  const contentHeight = canvasHeight.value * scale.value;

  // 计算可移动的范围
  const minX = Math.min(0, containerRect.width - contentWidth);
  const maxX = 0;
  const minY = Math.min(0, containerRect.height - contentHeight);
  const maxY = 0;

  // 限制偏移量在可移动范围内
  offset.value = {
    x: Math.max(minX, Math.min(maxX, newX)),
    y: Math.max(minY, Math.min(maxY, newY)),
  };
};

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false;
};

// 监听缩放变化，重置偏移量
watch(scale, () => {
  offset.value = { x: 0, y: 0 };
});

// 渲染指定帧
const renderFrame = (frameIndex: number) => {
  console.log("[GIF] Rendering frame:", frameIndex);
  if (!ctx.value || !frames.value.length) {
    console.warn("[GIF] Cannot render: ctx or frames not ready");
    return;
  }

  const frame = frames.value[frameIndex];
  console.log("[GIF] Frame data:", {
    dims: frame.dims,
    delay: frame.delay,
    disposalType: frame.disposalType,
  });
  const { width, height, dims } = frame;
  const { left = 0, top = 0 } = dims;

  // 创建临时画布用于合成帧
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = dims.width;
  tempCanvas.height = dims.height;
  const tempCtx = tempCanvas.getContext("2d")!;

  // 将帧数据绘制到临时画布
  const imageData = tempCtx.createImageData(dims.width, dims.height);
  imageData.data.set(frame.patch);
  tempCtx.putImageData(imageData, 0, 0);

  // 如果是第一帧或需要清除画布
  if (frameIndex === 0 || frame.disposalType === 2) {
    ctx.value.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);
  }

  // 绘制当前帧
  ctx.value.drawImage(tempCanvas, left, top);
};

// 加载 GIF
const loadGif = async () => {
  try {
    console.log("[GIF] Start loading gif from:", props.viewingAttachment.url);
    const response = await fetch(props.viewingAttachment.url);
    const buffer = await response.arrayBuffer();
    const gif = parseGIF(buffer);
    frames.value = decompressFrames(gif, true);
    console.log("[GIF] Loaded frames:", frames.value.length);

    // 设置画布尺寸
    if (canvasRef.value && frames.value.length > 0) {
      const { width, height } = frames.value[0].dims;
      console.log("[GIF] Canvas size:", width, height);
      canvasRef.value.width = width;
      canvasRef.value.height = height;
      // 保存画布尺寸
      canvasWidth.value = width;
      canvasHeight.value = height;
      ctx.value = canvasRef.value.getContext("2d")!;
      renderFrame(0);
    }
  } catch (error) {
    console.error("[GIF] Error loading GIF:", error);
  }
};

// 动画循环
const animate = (timestamp: number) => {
  if (!frames.value.length || !isPlaying.value) {
    console.warn("[GIF] Animation stopped: no frames or not playing");
    return;
  }

  const frame = frames.value[currentFrameIndex.value[0]];
  const frameDelay = (frame.delay * 10) / 100;

  console.log("[GIF] Animation frame:", {
    currentFrame: currentFrameIndex.value[0],
    delay: frameDelay,
    timeSinceLastFrame: timestamp - lastFrameTime,
  });

  if (timestamp - lastFrameTime >= frameDelay) {
    nextFrame();
    lastFrameTime = timestamp;
  }

  animationId = requestAnimationFrame(animate);
};

// 播放/暂停切换
const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  console.log("[GIF] Toggle play:", isPlaying.value);
  if (isPlaying.value) {
    console.log("[GIF] Starting animation");
    lastFrameTime = performance.now();
    animate(lastFrameTime);
  } else if (animationId) {
    console.log("[GIF] Stopping animation");
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

// 下一帧
const nextFrame = () => {
  const newIndex = (currentFrameIndex.value[0] + 1) % frames.value.length;
  console.log("[GIF] Next frame:", newIndex);
  currentFrameIndex.value = [newIndex];
  renderFrame(currentFrameIndex.value[0]);
};

// 上一帧
const prevFrame = () => {
  const newIndex = (currentFrameIndex.value[0] - 1 + frames.value.length) % frames.value.length;
  console.log("[GIF] Previous frame:", newIndex);
  currentFrameIndex.value = [newIndex];
  renderFrame(currentFrameIndex.value[0]);
};

// 监听帧索引变化
watch(currentFrameIndex, (newIndex) => {
  renderFrame(newIndex[0]);
});

// 组件挂载时加载 GIF
onMounted(() => {
  loadGif();
});

// 组件卸载时清理
onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  // 移除所有拖拽相关的事件监听
  stopDrag();
});
</script>

<style scoped>
canvas {
  transition: transform 0.2s ease;
}

/* 添加拖拽时的过渡效果 */
div[ref="containerRef"] {
  transition: transform 0.05s ease;
}
div[ref="containerRef"]:active {
  transition: none;
}

/* 添加滚动条样式 */
div::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

div::-webkit-scrollbar-track {
  background: transparent;
}

div::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted));
  border-radius: 3px;
}

div::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
