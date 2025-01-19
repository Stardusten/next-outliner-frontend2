import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { createContext } from "@/utils/createContext";
import { ref } from "vue";

const BlockRefTagSettingsDialogContext = createContext(() => {
  const open = ref(false);
  const blockId = ref<BlockId | null>(null);

  const openDialog = (blockId_: BlockId) => {
    blockId.value = blockId_;
    open.value = true;
  };

  const closeDialog = () => {
    blockId.value = null;
    open.value = false;
  };

  return {
    open,
    blockId,
    openDialog,
    closeDialog,
  };
});

export default BlockRefTagSettingsDialogContext;
