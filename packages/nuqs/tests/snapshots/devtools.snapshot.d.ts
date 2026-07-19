// #region Types
export type NuqsLogEvent = { [Code in DebugCode]: {
  id: number;
  ts: number;
  level: LogLevel;
  code: Code;
  category: LogCategory;
  message: string;
  args: DebugArgs<Code>;
}; }[DebugCode];
// #endregion

// #region Functions
export declare function NuqsDevtools(): ReactElement;
// #endregion
