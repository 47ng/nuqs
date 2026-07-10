// #region Types
export type unstable_AdapterContext = AdapterProps & {
  useAdapter: UseAdapterHook;
};
export type unstable_AdapterInterface = {
  searchParams: URLSearchParams;
  pathname?: string;
  updateUrl: UpdateUrlFunction;
  getSearchParamsSnapshot?: () => URLSearchParams;
  rateLimitFactor?: number;
  autoResetQueueOnUpdate?: boolean;
};
export type unstable_AdapterOptions = Pick<Options, "history" | "scroll" | "shallow">;
export type unstable_UpdateUrlFunction = (_: URLSearchParams, _: Required<AdapterOptions>) => void;
export type unstable_UseAdapterHook = (_: string[]) => AdapterInterface;
// #endregion

// #region Functions
export declare function renderQueryString(_: URLSearchParams): string;
export declare function unstable_createAdapterProvider(_: UseAdapterHook): AdapterProvider;
// #endregion
