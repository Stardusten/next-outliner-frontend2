import { createContext } from "@/utils/createContext";
import useLocalStorage2 from "@/utils/useLocalStorage";
import useWritableComputedRef from "@/utils/useWritableComputedRef";
import { computed, watch } from "vue";
import ServerInfoContext from "./serverInfo";
import SettingsContext from "./settings";

const BasicSettingsContext = createContext(() => {
  const { registerSettingGroup, registerSettingItem } = SettingsContext.useContext()!;
  const { kbPrefix } = ServerInfoContext.useContext()!;

  registerSettingGroup({
    key: "basic",
    label: {
      zh: "基本设置",
    },
  });

  const textFontFamilyId = "basic.textFontFamily";
  const textFontFamilyKey = computed(() => `${kbPrefix.value}${textFontFamilyId}`);
  const textFontFamilyDefaultValue = "";
  const textFontFamily = useLocalStorage2(textFontFamilyKey, textFontFamilyDefaultValue);
  registerSettingItem({
    id: textFontFamilyId,
    groupKey: "basic",
    label: {
      zh: "正文字体",
    },
    desc: {
      zh: "指定笔记正文的字体。",
    },
    defaultValue: textFontFamilyDefaultValue,
    value: useWritableComputedRef(textFontFamily),
    componentType: {
      type: "fontSelector",
    },
  });

  // 监听 textFontFamily 的变化，更新全局样式
  watch(
    textFontFamily,
    (newVal) => {
      document.documentElement.style.setProperty(
        "--text-font",
        newVal ? `${newVal}, var(--text-default-font)` : "var(--text-default-font)",
      );
    },
    { immediate: true },
  );

  const uiFontFamilyId = "basic.uiFontFamily";
  const uiFontFamilyKey = computed(() => `${kbPrefix.value}${uiFontFamilyId}`);
  const uiFontFamilyDefaultValue = "";
  const uiFontFamily = useLocalStorage2(uiFontFamilyKey, uiFontFamilyDefaultValue);
  registerSettingItem({
    id: uiFontFamilyId,
    groupKey: "basic",
    label: {
      zh: "界面字体",
    },
    desc: {
      zh: "指定软件界面字体。在不指定其他字体的情况下，该字体将成为软件的基础字体。",
    },
    defaultValue: uiFontFamilyDefaultValue,
    value: useWritableComputedRef(uiFontFamily),
    componentType: {
      type: "fontSelector",
    },
  });

  // 监听 uiFontFamily 的变化，更新全局样式
  watch(
    uiFontFamily,
    (newVal) => {
      document.documentElement.style.setProperty(
        "--ui-font",
        newVal ? `${newVal}, var(--ui-default-font)` : "var(--ui-default-font)",
      );
    },
    { immediate: true },
  );

  const monospaceFontFamilyId = "basic.monospaceFontFamily";
  const monospaceFontFamilyKey = computed(() => `${kbPrefix.value}${monospaceFontFamilyId}`);
  const monospaceFontFamilyDefaultValue = "";
  const monospaceFontFamily = useLocalStorage2(
    monospaceFontFamilyKey,
    monospaceFontFamilyDefaultValue,
  );
  registerSettingItem({
    id: monospaceFontFamilyId,
    groupKey: "basic",
    label: {
      zh: "代码块字体",
    },
    desc: {
      zh: "指定行内代码、代码块等需要等宽字体的场景使用的字体。",
    },
    defaultValue: monospaceFontFamilyDefaultValue,
    value: useWritableComputedRef(monospaceFontFamily),
    componentType: {
      type: "fontSelector",
    },
  });

  // 监听 monospaceFontFamily 的变化，更新全局样式
  watch(
    monospaceFontFamily,
    (newVal) => {
      document.documentElement.style.setProperty(
        "--code-font",
        newVal ? `${newVal}, var(--code-default-font)` : "var(--code-default-font)",
      );
    },
    { immediate: true },
  );

  const enableFloatingEditorId = "basic.enableFloatingEditor";
  const enableFloatingEditorKey = computed(() => `${kbPrefix.value}${enableFloatingEditorId}`);
  const enableFloatingEditorDefaultValue = false;
  const enableFloatingEditor = useLocalStorage2(
    enableFloatingEditorKey,
    enableFloatingEditorDefaultValue,
  );
  registerSettingItem({
    id: enableFloatingEditorId,
    groupKey: "basic",
    label: {
      zh: "启用浮动编辑器",
    },
    desc: {
      zh: "启用后，在块引用块上按 Ctrl / Command 键时，会弹出浮动编辑器。",
    },
    defaultValue: enableFloatingEditorDefaultValue,
    value: useWritableComputedRef(enableFloatingEditor),
    componentType: {
      type: "switch",
    },
  });

  const ctx = {
    textFontFamily,
    uiFontFamily,
    monospaceFontFamily,
    enableFloatingEditor,
  };
  return ctx;
});

export default BasicSettingsContext;
