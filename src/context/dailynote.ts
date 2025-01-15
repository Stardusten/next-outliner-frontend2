import { getPmSchema } from "@/components/prosemirror/pmSchema";
import { useToast } from "@/components/ui/toast/use-toast";
import { useTaskQueue } from "@/plugins/taskQueue";
import { createContext } from "@/utils/createContext";
import { contentNodesToPmNode, plainTextToTextContent } from "@/utils/pm";
import useLocalStorage2 from "@/utils/useLocalStorage";
import useWritableComputedRef from "@/utils/useWritableComputedRef";
import dayjs from "dayjs";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import IndexContext from ".";
import BlocksContext from "./blocks/blocks";
import { INTERNAL_BLOCK_PARENT_ID } from "./blocks/view-layer/blocksManager";
import BlockTreeContext from "./blockTree";
import ServerInfoContext from "./serverInfo";
import SettingsContext from "./settings";

const DAILY_NOTE_TAG = "day";

const DailyNoteContext = createContext(() => {
  const { registerSettingGroup, registerSettingItem } = SettingsContext.useContext()!;
  const { getBacklinks } = IndexContext.useContext()!;
  const { blocksManager, blockEditor, synced } = BlocksContext.useContext()!;
  const { toast } = useToast();
  const { t } = useI18n();
  const taskQueue = useTaskQueue();
  const { getBlockTree } = BlockTreeContext.useContext()!;
  const { kbPrefix } = ServerInfoContext.useContext()!;

  // 确保存在 day 块可以用作标签
  // TODo: 只执行一次添加
  watch(
    synced,
    (newValue, oldValue) => {
      // not synced -> synced
      if (!oldValue && newValue) {
        const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
        const dayBlock = blocksManager.getBlock("day");
        if (dayBlock) return;
        const tr = blocksManager.createBlockTransaction({ type: "ui" });
        tr.addBlock({
          id: "day",
          type: "normalBlock",
          fold: false,
          parentId: INTERNAL_BLOCK_PARENT_ID,
          childrenIds: [],
          content: plainTextToTextContent("Day", schema),
          metadata: {},
        });
        tr.commit();
      }
    },
    { immediate: true },
  );

  const blockIdValidator = (value: string) => {
    if (!value) return "没有指定块 ID";
    const block = blocksManager.getBlock(value);
    return block ? undefined : "无效的块 ID";
  };

  registerSettingGroup({
    key: "dailynote",
  });

  const defaultDateFormatId = "dailynote.defaultDateFormat";
  const defaultDateFormatKey = computed(() => `${kbPrefix.value}${defaultDateFormatId}`);
  const defaultDateFormatDefaultValue = "YYYY-MM-DD";
  const defaultDateFormat = useLocalStorage2(defaultDateFormatKey, defaultDateFormatDefaultValue);
  registerSettingItem({
    id: defaultDateFormatId,
    groupKey: "dailynote",
    defaultValue: defaultDateFormatDefaultValue,
    value: useWritableComputedRef(defaultDateFormat),
    componentType: { type: "textInput" },
  });

  const parentBlockOfNewDailyNoteId = "dailynote.parentBlockOfNewDailyNote";
  const parentBlockOfNewDailyNoteKey = computed(
    () => `${kbPrefix.value}${parentBlockOfNewDailyNoteId}`,
  );
  const parentBlockOfNewDailyNoteDefaultValue = "";
  const parentBlockOfNewDailyNote = useLocalStorage2(
    parentBlockOfNewDailyNoteKey,
    parentBlockOfNewDailyNoteDefaultValue,
  );
  registerSettingItem({
    id: parentBlockOfNewDailyNoteId,
    groupKey: "dailynote",
    defaultValue: parentBlockOfNewDailyNoteDefaultValue,
    value: useWritableComputedRef(parentBlockOfNewDailyNote),
    componentType: { type: "blockIdInput" },
  });

  const getAllDailyNotes = () => {
    const dailyNotes = getBacklinks(DAILY_NOTE_TAG, "tag");
    return [...dailyNotes];
  };

  const getDateToDailyNote = () => {
    const dailyNotes = getAllDailyNotes();
    const dates = {} as Record<string, string>;
    for (const blockId of dailyNotes) {
      const block = blocksManager.getBlock(blockId);
      if (!block) continue;
      const date = dayjs(block.ctext).format("YYYY-MM-DD");
      dates[date] = blockId;
    }
    return dates;
  };

  const createDailyNote = (date: Date) => {
    const main = getBlockTree("main");
    if (!main) return;
    const dateToDailyNote = getDateToDailyNote();
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const schema = getPmSchema({ getBlockRef: blocksManager.getBlockRef });
    // 如果已经存在，则不创建
    if (dateToDailyNote[dateStr]) return;
    // 否则创建
    if (!parentBlockOfNewDailyNote.value) {
      toast({
        title: t("kbView.dailynoteNavigator.dontKnowWhereToCreate.title"),
        description: t("kbView.dailynoteNavigator.dontKnowWhereToCreate.desc"),
      });
      return;
    }
    taskQueue.addTask(async () => {
      const { newNormalBlockId } =
        blockEditor.insertNormalBlock({
          pos: {
            parentId: parentBlockOfNewDailyNote.value,
            childIndex: "first",
          },
          content: contentNodesToPmNode([
            schema.text(dateStr + " "),
            schema.nodes.blockRef_v2.create({ toBlockId: "day", tag: true }),
          ]),
        }) ?? {};
      if (newNormalBlockId) {
        await main.nextUpdate();
        main.focusBlock(newNormalBlockId, { highlight: true, expandIfFold: true });
      }
    });
  };

  const ctx = {
    defaultDateFormat,
    parentBlockOfNewDailyNote,
    getAllDailyNotes,
    getDateToDailyNote,
    createDailyNote,
  };
  return ctx;
});

export default DailyNoteContext;
