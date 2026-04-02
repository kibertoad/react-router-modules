import { defineModule } from "@react-router-modules/core";
import type { RouteObject } from "react-router";
import type { AppDependencies, AppSlots } from "@example/app-shared";
import { UserDetailActions } from "./components/UserDetailActions.js";
import { UserDetailPanel } from "./components/UserDetailPanel.js";

export default defineModule<AppDependencies, AppSlots>({
  id: "users",
  version: "0.1.0",

  meta: {
    name: "Users",
    description: "User management and profiles",
    icon: "users",
    category: "admin",
  },

  createRoutes: (): RouteObject => ({
    path: "users",
    children: [
      {
        index: true,
        lazy: () => import("./pages/UserList.js").then((m) => ({ Component: m.default })),
      },
      {
        path: ":userId",
        handle: {
          headerActions: UserDetailActions,
          detailPanel: UserDetailPanel,
        },
        lazy: () => import("./pages/UserDetail.js").then((m) => ({ Component: m.default })),
      },
    ],
  }),

  navigation: [{ label: "Users", to: "/users", icon: "users", group: "admin", order: 20 }],

  // Static slots — always available
  slots: {
    commands: [{ id: "users:list", label: "View Users", group: "navigate", onSelect: () => {} }],
  },

  // Dynamic slots — re-evaluated when recalculateSlots() is called (e.g. after login)
  dynamicSlots: (deps) => ({
    commands:
      deps.auth.user?.role === "admin"
        ? [
            {
              id: "users:manage-roles",
              label: "Manage Roles",
              group: "actions",
              onSelect: () => {},
            },
          ]
        : [],
  }),

  requires: ["auth", "httpClient"],
});
