// #region Functions
export declare function enableHistorySync(): void;
export declare function NuqsAdapter({ children, fullPageNavigationOnShallowFalseUpdates, serverSearch, ...adapterProps }: AdapterProps & {
  children: React.ReactNode;
  fullPageNavigationOnShallowFalseUpdates?: boolean;
  serverSearch?: string | URLSearchParams;
}): React.ReactElement;
// #endregion
