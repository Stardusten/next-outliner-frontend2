import { createContext } from "@/utils/createContext";
import { useColorMode } from "@vueuse/core";
import { watch } from "vue";

export const ThemeContext = createContext(() => {
  const theme = useColorMode();

  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };

  // 监听主题变化，同步更新 body 元素的 color-scheme 样式
  // 让 html 元素一些样式可以自动适配主题
  watch(
    theme,
    (value) => {
      document.body.style.colorScheme = value;
    },
    { immediate: true },
  );

  return {
    theme,
    toggleTheme,
  };
});

export default ThemeContext;
