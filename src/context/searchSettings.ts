import { createContext } from "@/utils/createContext";
import SettingsContext from "./settings";
import ServerInfoContext from "./serverInfo";
import { computed } from "vue";
import useWritableComputedRef from "@/utils/useWritableComputedRef";
import useLocalStorage2 from "@/utils/useLocalStorage";

const SearchSettingsContext = createContext(() => {
  const { registerSettingGroup, registerSettingItem } = SettingsContext.useContext()!;
  const { kbPrefix } = ServerInfoContext.useContext()!;

  const searchSettingGroupKey = "search";
  registerSettingGroup({ key: searchSettingGroupKey });

  const ignoreDiacriticsId = "search.ignoreDiacritics";
  const ignoreDiacriticsKey = computed(() => `${kbPrefix.value}${ignoreDiacriticsId}`);
  const ignoreDiacriticsDefaultValue = true;
  const ignoreDiacritics = useLocalStorage2(ignoreDiacriticsKey, ignoreDiacriticsDefaultValue);
  registerSettingItem({
    id: ignoreDiacriticsId,
    groupKey: searchSettingGroupKey,
    defaultValue: ignoreDiacriticsDefaultValue,
    value: useWritableComputedRef(ignoreDiacritics),
    componentType: {
      type: "switch",
    },
  });

  return {
    ignoreDiacritics,
  };
});

export default SearchSettingsContext;
