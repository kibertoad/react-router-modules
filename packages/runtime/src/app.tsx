import { useMemo } from "react";
import { RouterProvider } from "react-router";
import type { DataRouter } from "react-router";
import type { StoreApi } from "zustand";
import type { ReactiveService } from "@react-router-modules/core";
import { SharedDependenciesContext } from "@react-router-modules/core";
import { NavigationContext } from "./navigation-context.js";
import { SlotsContext } from "./slots-context.js";
import { ModulesContext } from "./modules-context.js";
import type { NavigationManifest, ModuleEntry } from "./types.js";

interface AppProps {
  router: DataRouter;
  stores: Record<string, StoreApi<unknown>>;
  services: Record<string, unknown>;
  reactiveServices: Record<string, ReactiveService<unknown>>;
  navigation: NavigationManifest;
  slots: object;
  modules: readonly ModuleEntry[];
  providers?: React.ComponentType<{ children: React.ReactNode }>[];
}

export function createAppComponent({
  router,
  stores,
  services,
  reactiveServices,
  navigation,
  slots,
  modules,
  providers,
}: AppProps) {
  // All values captured in closure are stable references created once at resolve() time.
  // Wrap in a stable object so context consumers don't re-render on parent renders.
  const depsValue = { stores, services, reactiveServices };

  function App() {
    const tree = useMemo(() => {
      let node: React.ReactNode = (
        <SharedDependenciesContext value={depsValue}>
          <NavigationContext value={navigation}>
            <SlotsContext value={slots}>
              <ModulesContext value={modules}>
                <RouterProvider router={router} />
              </ModulesContext>
            </SlotsContext>
          </NavigationContext>
        </SharedDependenciesContext>
      );

      // Wrap with user-supplied providers (first element = outermost wrapper)
      if (providers) {
        for (const Provider of [...providers].reverse()) {
          node = <Provider>{node}</Provider>;
        }
      }

      return node;
    }, []);

    return tree;
  }

  App.displayName = "ReactiveApp";
  return App;
}
