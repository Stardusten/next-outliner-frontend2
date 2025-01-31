import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { getPmSchema } from "@/components/prosemirror/pmSchema";
import { useTaskQueue } from "@/plugins/taskQueue";
import { createContext } from "@/utils/createContext";
import { plainTextToTextContent } from "@/utils/pm";
import { computed, nextTick, ref } from "vue";
import BacklinksContext from "./backlinks";
import BlocksContext from "./blocks/blocks";
import type { NonNormalizedBlockPosParentChild } from "./blocks/view-layer/blocksEditor";
import SettingsContext from "./settings";
import { ServerInfoContext } from "./serverInfo";
import useLocalStorage2 from "@/utils/useLocalStorage";
import useWritableComputedRef from "@/utils/useWritableComputedRef";

const QuickAddContext = createContext(() => {
  const { blockEditor, blocksManager } = BlocksContext.useContext()!;
  const { registerSettingGroup, registerSettingItem } = SettingsContext.useContext()!;
  const { kbPrefix } = ServerInfoContext.useContext()!;
  const taskQueue = useTaskQueue();

  const open = ref(false);
  const tempBlockId = ref<BlockId | null>(null);
  const insertPos = ref<NonNormalizedBlockPosParentChild | null>(null);

  registerSettingGroup({ key: "quickAdd" });

  const putNewBlockAtId = "quickAdd.putNewBlockAt";
  const putNewBlockAtKey = computed(() => `${kbPrefix.value}${putNewBlockAtId}`);
  const putNewBlockAtDefaultValue = "";
  const putNewBlockAt = useLocalStorage2(putNewBlockAtKey, putNewBlockAtDefaultValue);
  registerSettingItem({
    id: putNewBlockAtId,
    groupKey: "quickAdd",
    defaultValue: putNewBlockAtDefaultValue,
    value: useWritableComputedRef(putNewBlockAt),
    componentType: { type: "blockIdInput" },
  });

  const openQuickAdd = () => {
    if (open.value) return;
    const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
    taskQueue.addTask(async () => {
      const parentId = putNewBlockAt.value === "" ? "root" : putNewBlockAt.value;
      const { newNormalBlockId } =
        blockEditor.insertNormalBlock({
          pos: {
            parentId,
            childIndex: "last-space",
          },
          content: plainTextToTextContent("", schema),
          expandParentIfFolded: false,
        }) ?? {};
      if (!newNormalBlockId) return;
      tempBlockId.value = newNormalBlockId;
      insertPos.value = {
        parentId,
        childIndex: "last-space",
      };
      open.value = true;
    });
  };

  const handleAdd = () => {
    if (!insertPos.value) return handleCancel();
    const initInsertPos = {
      parentId: putNewBlockAt.value === "" ? "root" : putNewBlockAt.value,
      childIndex: "last-space",
    };
    const changed =
      insertPos.value.parentId !== initInsertPos.parentId ||
      insertPos.value.childIndex !== initInsertPos.childIndex;
    if (changed) {
      taskQueue.addTask(async () => {
        blockEditor.moveBlock({
          blockId: tempBlockId.value!,
          pos: insertPos.value!,
        });
      });
    }
    open.value = false;
    tempBlockId.value = null;
    insertPos.value = null;
    // 防止聚焦到 quickadd 按钮
    nextTick(() => {
      (document.activeElement as HTMLElement).blur?.();
    });
  };

  const handleCancel = () => {
    if (tempBlockId.value) {
      taskQueue.addTask(async () => {
        blockEditor.deleteBlock({
          blockId: tempBlockId.value!,
        });
      });
    }
    open.value = false;
    tempBlockId.value = null;
    insertPos.value = null;
    // 防止聚焦到 quickadd 按钮
    nextTick(() => {
      (document.activeElement as HTMLElement).blur?.();
    });
  };

  return { open, tempBlockId, insertPos, openQuickAdd, handleAdd, handleCancel };
});

export default QuickAddContext;
