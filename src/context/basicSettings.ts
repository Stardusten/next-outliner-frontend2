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
  });

  const textFontFamilyId = "basic.textFontFamily";
  const textFontFamilyKey = computed(() => `${kbPrefix.value}${textFontFamilyId}`);
  const textFontFamilyDefaultValue = "";
  const textFontFamily = useLocalStorage2(textFontFamilyKey, textFontFamilyDefaultValue);
  registerSettingItem({
    id: textFontFamilyId,
    groupKey: "basic",
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

  const customCssId = "basic.customCss";
  const customCssKey = computed(() => `${kbPrefix.value}${customCssId}`);
  const customCssDefaultValue = "";
  const customCss = useLocalStorage2(customCssKey, customCssDefaultValue);
  registerSettingItem({
    id: customCssId,
    groupKey: "basic",
    defaultValue: customCssDefaultValue,
    value: useWritableComputedRef(customCss),
    componentType: { type: "textArea", lang: "css" },
  });

  // 监听 customCss 的变化，更新全局样式
  watch(customCss, (newVal) => {
    let customCssEl = document.head.querySelector("style#custom-css");
    if (!customCssEl) {
      customCssEl = document.createElement("style");
      customCssEl.id = "custom-css";
      document.head.appendChild(customCssEl);
    }
    customCssEl.textContent = newVal;
  });

  const ctx = {
    textFontFamily,
    uiFontFamily,
    monospaceFontFamily,
  };
  return ctx;
});

export default BasicSettingsContext;
