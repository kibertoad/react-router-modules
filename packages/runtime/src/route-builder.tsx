import { Outlet } from "react-router";
import type { RouteObject } from "react-router";
import type { ReactiveModuleDescriptor, LazyModuleDescriptor } from "@react-router-modules/core";

export interface RouteBuilderOptions {
  /**
   * Pre-built root route. If provided, rootComponent/notFoundComponent/loader
   * are ignored — configure them directly on this route instead.
   */
  rootRoute?: RouteObject;
  /** Component for the root layout (renders <Outlet /> for child routes) */
  rootComponent?: () => React.JSX.Element;
  /** Component for the index route (/) */
  indexComponent?: () => React.JSX.Element;
  /** Component for the 404 / not-found route */
  notFoundComponent?: () => React.JSX.Element;
  /**
   * Called before every route loads — for observability, feature flags, etc.
   * Runs for ALL routes including public ones.
   * Ignored if rootRoute is provided.
   */
  loader?: (args: { request: Request; params: Record<string, string | undefined> }) => any;
  /**
   * Auth boundary — a pathless layout route that wraps module routes and
   * the index route. Shell routes (login, error pages) sit outside this
   * boundary and are NOT guarded.
   *
   * Follows React Router's recommended layout route pattern.
   *
   * When provided, the route tree becomes:
   * ```
   * Root (loader runs for ALL routes)
   * ├── shellRoutes (public — /login, /signup, etc.)
   * └── _authenticated (layout — loader guards children)
   *     ├── / (indexComponent)
   *     └── module routes
   * ```
   *
   * When omitted, all routes are direct children of root (no auth boundary).
   */
  authenticatedRoute?: {
    /** Auth guard — throw redirect() to deny access */
    loader: (args: { request: Request; params: Record<string, string | undefined> }) => any;
    /** Layout component for authenticated pages. Defaults to <Outlet />. */
    Component?: () => React.JSX.Element;
  };
  /** Additional routes owned by the shell (login, error pages, etc.) */
  shellRoutes?: () => RouteObject[];
}

/**
 * Composes all module route subtrees into a React Router route tree.
 * Modules without createRoutes are skipped (headless modules).
 */
export function buildRouteTree(
  modules: ReactiveModuleDescriptor[],
  lazyModules: LazyModuleDescriptor[],
  options?: RouteBuilderOptions,
): RouteObject[] {
  // If a custom root route is provided, use it as the base
  if (options?.rootRoute) {
    const rootChildren: RouteObject[] = [...(options.rootRoute.children ?? [])];

    // Shell-owned routes (login, error pages) — always direct children of root
    if (options?.shellRoutes) {
      rootChildren.push(...options.shellRoutes());
    }

    const protectedChildren: RouteObject[] = [];

    // Add index route if provided
    if (options?.indexComponent) {
      protectedChildren.push({
        index: true,
        Component: options.indexComponent,
      });
    }

    // Eager modules
    for (const mod of modules) {
      if (!mod.createRoutes) continue;
      const routes = mod.createRoutes();
      protectedChildren.push(...(Array.isArray(routes) ? routes : [routes]));
    }

    // Lazy modules
    for (const lazyMod of lazyModules) {
      protectedChildren.push(createLazyModuleRoute(lazyMod));
    }

    if (options?.authenticatedRoute) {
      rootChildren.push(
        createAuthenticatedLayoutRoute(options.authenticatedRoute, protectedChildren),
      );
    } else {
      rootChildren.push(...protectedChildren);
    }

    options.rootRoute.children = rootChildren;
    return [options.rootRoute];
  }

  // Build root route from options
  const rootChildren: RouteObject[] = [];

  // Shell-owned routes (login, error pages) — always direct children of root
  if (options?.shellRoutes) {
    rootChildren.push(...options.shellRoutes());
  }

  const protectedChildren: RouteObject[] = [];

  // Add index route if provided
  if (options?.indexComponent) {
    protectedChildren.push({
      index: true,
      Component: options.indexComponent,
    });
  }

  // Eager modules: call createRoutes
  for (const mod of modules) {
    if (!mod.createRoutes) continue;
    const routes = mod.createRoutes();
    protectedChildren.push(...(Array.isArray(routes) ? routes : [routes]));
  }

  // Lazy modules
  for (const lazyMod of lazyModules) {
    protectedChildren.push(createLazyModuleRoute(lazyMod));
  }

  if (options?.authenticatedRoute) {
    rootChildren.push(
      createAuthenticatedLayoutRoute(options.authenticatedRoute, protectedChildren),
    );
  } else {
    rootChildren.push(...protectedChildren);
  }

  const rootRoute: RouteObject = {
    path: "/",
    Component: options?.rootComponent,
    loader: options?.loader,
    children: rootChildren,
  };

  return [rootRoute];
}

function createAuthenticatedLayoutRoute(
  auth: NonNullable<RouteBuilderOptions["authenticatedRoute"]>,
  children: RouteObject[],
): RouteObject {
  return {
    id: "_authenticated",
    Component: auth.Component ?? (() => <Outlet />),
    loader: auth.loader,
    children,
  };
}

function createLazyModuleRoute(_lazyMod: LazyModuleDescriptor): RouteObject {
  // TODO: Implement lazy module loading properly
  // For now, create a placeholder route
  return {
    path: _lazyMod.basePath.replace(/^\//, ""),
    Component: () => null,
  };
}
