import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import "./assets/main.css";
import { eventbusPlugin } from "./plugins/eventbus";
import { messages } from "./ i18n/i18n";
import router from "./router";
import App from "./views/App.vue";
import { taskQueuePlugin } from "./plugins/taskQueue";
import "prosemirror-view/style/prosemirror.css";
import { watch } from "vue";

const startApp = async () => {
  const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem("locale") ?? "en_US",
    fallbackLocale: "en_US",
    messages,
  });

  // 监听语言变化，保存到 localStorage
  watch(i18n.global.locale, (locale) => {
    localStorage.setItem("locale", locale);
  });

  const app = createApp(App);
  app.use(i18n);
  app.use(router);
  app.use(eventbusPlugin);
  app.use(taskQueuePlugin);
  app.mount("#app");
};

document.addEventListener("DOMContentLoaded", startApp);
