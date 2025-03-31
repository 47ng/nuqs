import { useRouter, useRouterState } from "@tanstack/react-router";
import { startTransition, useCallback, useMemo } from "react";
import type { AdapterInterface, UpdateUrlFunction } from '../lib/defs'

export function useNuqsTanstackRouterAdapter(): AdapterInterface {
  const state = useRouterState();
  const router = useRouter();

  const search = useMemo(
    () => new URLSearchParams(state.location.search || ""),
    [state.location.search]
  );

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      startTransition(() => {
        const url = renderURL(location.pathname, search);
        router.navigate({
          // @ts-ignore
          from: state.location.pathname,

          to: url,
          search: search,
        });
        if (options.scroll) {
          window.scrollTo(0, 0);
        }
      });
    },
    [router.navigate]
  );

  return {
    searchParams: search,
    updateUrl,
    rateLimitFactor: 2,
  };
}

function renderURL(pathname: string, search: URLSearchParams) {
  const hashlessBase = pathname.split("#")[0] ?? "";
  const query = search.toString() ? `?${search.toString()}` : "";
  const hash = location.hash;
  return hashlessBase + query + hash;
}
