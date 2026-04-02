import { defineModule } from "@react-router-modules/core";
import type { RouteObject } from "react-router";
import type { AppDependencies, AppSlots } from "@example/app-shared";

export default defineModule<AppDependencies, AppSlots>({
  id: "billing",
  version: "0.1.0",

  meta: {
    name: "Billing",
    description: "Manage invoices and billing",
    icon: "credit-card",
    category: "finance",
  },

  createRoutes: (): RouteObject => ({
    path: "billing",
    children: [
      {
        index: true,
        lazy: () => import("./pages/BillingDashboard.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "invoices",
        lazy: () => import("./pages/InvoiceList.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "invoices/:invoiceId",
        lazy: () => import("./pages/InvoiceDetail.js").then((m) => ({ Component: m.default })),
      },
    ],
  }),

  navigation: [
    { label: "Billing", to: "/billing", icon: "credit-card", group: "finance", order: 10 },
    { label: "Invoices", to: "/billing/invoices", group: "finance", order: 11 },
  ],

  slots: {
    commands: [
      {
        id: "billing:dashboard",
        label: "Open Billing Dashboard",
        group: "navigate",
        onSelect: () => {},
      },
      { id: "billing:invoices", label: "View Invoices", group: "navigate", onSelect: () => {} },
    ],
  },

  requires: ["auth", "httpClient"],
});
