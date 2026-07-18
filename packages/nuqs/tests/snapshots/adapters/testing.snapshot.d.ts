// #region Types
export type OnUrlUpdateFunction = (_: UrlUpdateEvent) => void;
export type UrlUpdateEvent = {
  searchParams: URLSearchParams;
  queryString: string;
  options: Required<AdapterOptions>;
};
// #endregion

// #region Functions
export declare function NuqsTestingAdapter({ resetUrlUpdateQueueOnMount, autoResetQueueOnUpdate, defaultOptions, processUrlSearchParams, rateLimitFactor, hasMemory, onUrlUpdate, children, searchParams: initialSearchParams }: TestingAdapterProps): ReactElement;
export declare function withNuqsTestingAdapter(_?: Omit<TestingAdapterProps, "children">): ({ children }: {
  children: ReactNode;
}) => ReactElement;
// #endregion
