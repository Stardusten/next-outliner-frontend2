import AdminDashboard from "@/views/admin-dashboard/AdminDashboard.vue";
import KbView from "@/views/kb-view/KbView.vue";
import AdminLoginView from "@/views/login-view/AdminLoginView.vue";
import KbEditorLoginView from "@/views/login-view/KbEditorLoginView.vue";
import LoginView from "@/views/login-view/LoginView.vue";
import { createRouter, createWebHashHistory } from "vue-router";
// TODO: switch to dynamic import
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/login/kb-editor",
    },
    {
      path: "/login",
      component: LoginView,
      children: [
        {
          path: "kb-editor",
          component: KbEditorLoginView,
        },
        {
          path: "admin",
          component: AdminLoginView,
        },
      ],
    },
    {
      path: "/admin-dashboard/:serverUrl",
      component: AdminDashboard,
      beforeEnter: (to, from, next) => {
        const {
          extractTokenPayload,
          buildAdminTokenKey: buildTokenKey,
          logout,
        } = globalThis.getServerInfoContext()!;
        const targetServerUrl = to.params.serverUrl as string;
        const tokenKey = buildTokenKey(targetServerUrl);
        const token = localStorage.getItem(tokenKey);
        const tokenPayload = token ? extractTokenPayload(token) : null;
        if (
          !tokenPayload ||
          tokenPayload.role !== "admin" ||
          tokenPayload.serverUrl !== targetServerUrl
        ) {
          logout();
          next({ path: "/login/admin" });
        } else {
          next();
        }
      },
    },
    {
      path: "/kb/:serverUrl/:location/:rootBlockId?/:focusedBlockId?",
      component: KbView,
      beforeEnter: (to, from, next) => {
        const {
          extractTokenPayload,
          buildKbEditorTokenKey: buildTokenKey,
          logout,
        } = globalThis.getServerInfoContext()!;
        const targetServerUrl = to.params.serverUrl as string;
        const targetLocation = to.params.location as string;
        const tokenKey = buildTokenKey(targetServerUrl, targetLocation);
        const token = localStorage.getItem(tokenKey);
        const tokenPayload = token ? extractTokenPayload(token) : null;
        // invalid or missing token
        if (
          !tokenPayload ||
          tokenPayload.role !== "kb-editor" ||
          tokenPayload.serverUrl !== targetServerUrl ||
          tokenPayload.location !== targetLocation
        ) {
          logout();
          next({ path: "/login/kb-editor" });
        } else {
          next();
        }
      },
    },
  ],
});

export default router;
