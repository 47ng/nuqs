// #region Functions
export declare function enableHistorySync(): void;
export declare function NuqsAdapter({ children, fullPageNavigationOnShallowFalseUpdates, serverSearch, ...adapterProps }: AdapterProps & {
  children: ReactNode;
  fullPageNavigationOnShallowFalseUpdates?: boolean;
  serverSearch?: string | URLSearchParams;
}): ReactElement;
// #endregion
