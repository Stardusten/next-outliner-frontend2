import type { BlockId } from "@/common/type-and-schemas/block/block-id";
import { createContext } from "@/utils/createContext";
import useLocalStorage2 from "@/utils/useLocalStorage";
import useWritableComputedRef from "@/utils/useWritableComputedRef";
import { computed } from "vue";
import { z } from "zod";
import IndexContext from ".";
import BlocksContext from "./blocks/blocks";
import FieldsManagerContext from "./fieldsManager";
import ServerInfoContext from "./serverInfo";
import SettingsContext from "./settings";

const BacklinksContext = createContext(() => {
  const { registerSettingGroup, registerSettingItem } = SettingsContext.useContext()!;
  const { blocksManager } = BlocksContext.useContext()!;
  const { getBacklinks } = IndexContext.useContext()!;
  const { getFieldValues } = FieldsManagerContext.useContext()!;
  const { kbPrefix } = ServerInfoContext.useContext()!;

  const blockIdValidator = (value: string) => {
    if (!value) return "没有指定块 ID";
    const block = blocksManager.getBlock(value);
    return block ? undefined : "无效的块 ID";
  };

  registerSettingGroup({
    key: "backlinks",
  });

  const showBacklinksCounterId = "backlinks.showCounter";
  const showBacklinksCounterKey = computed(() => `${kbPrefix.value}${showBacklinksCounterId}`);
  const showBacklinksCounterDefaultValue = true;
  const showBacklinksCounter = useLocalStorage2(
    showBacklinksCounterKey,
    showBacklinksCounterDefaultValue,
  );
  registerSettingItem({
    id: showBacklinksCounterId,
    groupKey: "backlinks",
    defaultValue: showBacklinksCounterDefaultValue,
    value: useWritableComputedRef(showBacklinksCounter),
    componentType: {
      type: "switch",
    },
  });

  const putNewBlockAtId = "backlinks.putNewBlockAt";
  const putNewBlockAtKey = computed(() => `${kbPrefix.value}${putNewBlockAtId}`);
  const putNewBlockAtDefaultValue = "";
  const putNewBlockAt = useLocalStorage2(putNewBlockAtKey, putNewBlockAtDefaultValue);
  registerSettingItem({
    id: putNewBlockAtId,
    groupKey: "backlinks",
    defaultValue: putNewBlockAtDefaultValue,
    value: useWritableComputedRef(putNewBlockAt),
    componentType: { type: "blockIdInput" },
  });

  // 暂时没有考虑
  // - A
  //   - [[Alias]]
  //     - B
  //       - [[Alias]]
  //         - C
  // 这种阴间的情况
  const getAllAliases = (blockId: BlockId, includeSelf = true) => {
    const ret: BlockId[] = includeSelf ? [blockId] : [];
    const fieldValues = getFieldValues(blockId) ?? {};
    // 情况 1：
    // - this block
    //   - [[Alias]]
    //     - alias1
    //     - ...
    if ("Alias" in fieldValues) {
      const aliases = fieldValues.Alias;
      const res = z.array(z.string()).safeParse(aliases);
      if (res.success) {
        ret.push(...res.data);
      }
      return ret;
    }
    // 情况 2：
    // - parent block
    //   - [[Alias]]
    //     - this block
    {
      const block = blocksManager.getBlock(blockId);
      if (!block) return ret;
      const parentBlock = block.parentRef.value;
      const parentParentBlock = parentBlock?.parentRef.value;
      if (!parentParentBlock) return ret;
      const fieldValues = getFieldValues(parentParentBlock.id) ?? {};
      if ("Alias" in fieldValues) {
        const aliases = fieldValues.Alias;
        const res = z.array(z.string()).safeParse(aliases);
        if (res.success) {
          ret.push(...res.data);
        }
        return ret;
      }
    }
    return ret;
  };

  const getBacklinksConsideringAliases = (
    blockId: BlockId,
    type: "blockRef" | "tag" | "both" = "both",
  ) => {
    const aliases = getAllAliases(blockId);
    const ret = new Set<BlockId>();
    for (const alias of aliases) {
      const blockIds = getBacklinks(alias, type);
      for (const id of blockIds ?? []) {
        ret.add(id);
      }
    }
    return ret;
  };

  const ctx = {
    showBacklinksCounter,
    putNewBlockAt,
    getAllAliases,
    getBacklinksConsideringAliases,
  };
  return ctx;
});

export default BacklinksContext;
