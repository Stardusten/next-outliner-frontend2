<!-- <template>
  <Popover v-model:open="open">
    <PopoverTrigger></PopoverTrigger>
    <PopoverContent class="floating-editor-content p-2 w-[400px] h-[400px] overflow-hidden">
      <BlockTree
        v-if="openedBlockId"
        class="h-full"
        id="floating-editor"
        :root-block-ids="[openedBlockId]"
        :root-block-level="0"
        :padding-bottom="0"
      >
      </BlockTree>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import FloatingEditorContext from "@/context/floatingEditor";
import { calcPopoverPos } from "@/utils/popover";
import { nextTick, watch } from "vue";
import BlockTree from "../BlockTree.vue";
import Popover from "../ui/popover/Popover.vue";
import PopoverContent from "../ui/popover/PopoverContent.vue";
import PopoverTrigger from "../ui/popover/PopoverTrigger.vue";

const { showPos, open, openedBlockId } = FloatingEditorContext.useContext()!;

watch(open, async () => {
  await nextTick();

  if (!showPos.value) return;

  const el = document.querySelector("[data-radix-popper-content-wrapper]");
  if (!(el instanceof HTMLElement)) return;
  const { x, y } = showPos.value!;
  // const elRect = el.getBoundingClientRect();
  // 这里固定宽度，高度计算，因为候选变化会导致高度变化，如果每次候选变化都重新计算高度
  // 可能导致 popover 位置变化，体验不好
  const popoverPos = calcPopoverPos(300, 300, x, y, {
    // const popoverPos = calcPopoverPos(elRect.width, elRect.height, x, y, {
    // showPos 是行内元素右上角的位置
    // 为了防止遮挡当前行，如果是向上方弹出，应该向上偏移 30px
    offset: (pos) => {
      pos.leftUp.y -= 30;
      pos.rightUp.y -= 30;
      return pos;
    },
  });
  // 默认向右下弹出
  // 这里把弹出位置作为 CSS 变量绑定到 body 上
  // 因为 shadcn / radix 把 popover 的样式写死了
  // 只能这样去覆盖
  document.body.style.setProperty("--popover-x", `${popoverPos.rightDown.x}px`);
  document.body.style.setProperty("--popover-y", `${popoverPos.rightDown.y}px`);
});
</script>

<style lang="scss">
// 覆盖 radix-vue 的样式，这允许我们自己指定 popover 的位置
// 这里使用了 :has 选择器，保证不干扰其他 popover 的样式
[data-radix-popper-content-wrapper]:has(> .floating-editor-content) {
  transform: translate(var(--popover-x), var(--popover-y)) !important;
}
</style> -->
