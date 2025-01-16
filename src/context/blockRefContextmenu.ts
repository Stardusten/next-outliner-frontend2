import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { createContext } from "@/utils/createContext";
import { ref } from "vue";

const BlockRefContextmenuContext = createContext(() => {
  const open = ref(false);
  const showPos = ref<{ x: number; y: number } | null>(null);
  const clickedBlockId = ref<BlockId | null>(null);

  const openAt = (pos: { x: number; y: number }, clickedBlockId_: BlockId) => {
    open.value = true;
    showPos.value = pos;
    clickedBlockId.value = clickedBlockId_;
  };

  return {
    open,
    clickedBlockId,
    showPos,
    openAt,
  };
});

export default BlockRefContextmenuContext;
