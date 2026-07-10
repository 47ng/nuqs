// #region Types
export type CreateLoaderOptions<P extends ParserMap> = LoaderOptions<P>;
export type CreateSerializerOptions<Parsers extends ParserMap> = Pick<Options, "clearOnDefault"> & {
  urlKeys?: UrlKeys<Parsers>;
  processUrlSearchParams?: (_: URLSearchParams) => URLSearchParams;
};
export type CreateStandardSchemaV1Options<Parsers extends ParserMap, PartialOutput extends boolean = false> = CreateLoaderOptions<Parsers> & {
  partialOutput?: PartialOutput;
};
export type GenericParser<T> = SingleParser<T> | MultiParser<T>;
export type GenericParserBuilder<T> = SingleParserBuilder<T> | MultiParserBuilder<T>;
export type HistoryOptions = "replace" | "push";
export type inferParserType<Input> = Input extends GenericParserBuilder<any> ? inferSingleParserType<Input> : Input extends Record<string, GenericParserBuilder<any>> ? inferParserRecordType<Input> : never;
export type LoaderFunction<Parsers extends ParserMap> = {
  (_: LoaderInput, _?: LoaderFunctionOptions): inferParserType<Parsers>;
  (_: Promise<LoaderInput>, _?: LoaderFunctionOptions): Promise<inferParserType<Parsers>>;
};
export type LoaderInput = URL | Request | URLSearchParams | Record<string, string | string[] | undefined> | string;
/** @deprecated */
export type LoaderOptions<Parsers extends ParserMap> = {
  urlKeys?: UrlKeys<Parsers>;
};
export type MultiParser<T> = {
  type: "multi";
  parse: (_: ReadonlyArray<string>) => T | null;
  serialize?: (_: T) => Array<string>;
  eq?: (_: T, _: T) => boolean;
};
export type MultiParserBuilder<T> = Required<MultiParser<T>> & Options & {
  withOptions<This>(this: This, _: Options): This;
  withDefault(this: MultiParserBuilder<T>, _: NonNullable<T>): Omit<MultiParserBuilder<T>, "parseServerSide"> & {
    readonly defaultValue: NonNullable<T>;
    parseServerSide(_: string | string[] | undefined): NonNullable<T>;
  };
  parseServerSide(_: string | string[] | undefined): T | null;
};
export type Nullable<T> = { [K in keyof T]: T[K] | null } & {};
export type Options = {
  history?: HistoryOptions;
  scroll?: boolean;
  shallow?: boolean;
  throttleMs?: number;
  limitUrlUpdates?: LimitUrlUpdates;
  startTransition?: TransitionStartFunction;
  clearOnDefault?: boolean;
};
/** @deprecated */
export type Parser<T> = SingleParser<T>;
/** @deprecated */
export type ParserBuilder<T> = SingleParserBuilder<T>;
export type ParserMap = Record<string, ParserWithOptionalDefault<any>>;
export type ParserWithOptionalDefault<T> = GenericParserBuilder<T> & {
  defaultValue?: T;
};
export type SearchParams = Record<string, string | string[] | undefined>;
export type SetValues<T extends UseQueryStatesKeysMap> = (_: Partial<Nullable<Values<T>>> | UpdaterFn<T> | null, _?: Options) => Promise<URLSearchParams>;
export type SingleParser<T> = {
  type?: "single";
  parse: (_: string) => T | null;
  serialize?: (_: T) => string;
  eq?: (_: T, _: T) => boolean;
};
export type SingleParserBuilder<T> = Required<SingleParser<T>> & Options & {
  withOptions<This>(this: This, _: Options): This;
  withDefault(this: SingleParserBuilder<T>, _: NonNullable<T>): Omit<SingleParserBuilder<T>, "parseServerSide"> & {
    readonly defaultValue: NonNullable<T>;
    parseServerSide(_: string | string[] | undefined): NonNullable<T>;
  };
  parseServerSide(_: string | string[] | undefined): T | null;
};
export type UrlKeys<Parsers extends Record<string, any>> = Partial<Record<keyof Parsers, string>>;
export type UseQueryStateOptions<T> = GenericParser<T> & Options;
export type UseQueryStateReturn<Parsed, Default> = [Default extends undefined ? Parsed | null : Parsed, (value: null | Parsed | ((old: Default extends Parsed ? Parsed : Parsed | null) => Parsed | null), options?: Options) => Promise<URLSearchParams>];
export type UseQueryStatesKeysMap<Map = any> = { [Key in keyof Map]: KeyMapValue<Map[Key]> } & {};
export type UseQueryStatesOptions<KeyMap extends UseQueryStatesKeysMap> = Options & {
  urlKeys: UrlKeys<KeyMap>;
};
export type UseQueryStatesReturn<T extends UseQueryStatesKeysMap> = [Values<T>, SetValues<T>];
export type Values<T extends UseQueryStatesKeysMap> = { [K in keyof T]: T[K]["defaultValue"] extends NonNullable<ReturnType<T[K]["parse"]>> ? NonNullable<ReturnType<T[K]["parse"]>> : ReturnType<T[K]["parse"]> | null };
// #endregion

// #region Functions
export declare function createLoader<Parsers extends ParserMap>(_: Parsers, {
  urlKeys
}?: CreateLoaderOptions<Parsers>): LoaderFunction<Parsers>;
export declare function createMultiParser<T>(_: Omit<Require<MultiParser<T>, "parse" | "serialize">, "type">): MultiParserBuilder<T>;
export declare function createParser<T>(_: Require<SingleParser<T>, "parse" | "serialize">): SingleParserBuilder<T>;
export declare function createSerializer<Parsers extends ParserMap, BaseType extends Base = Base, Return = string>(_: Parsers, {
  clearOnDefault,
  urlKeys,
  processUrlSearchParams
}?: CreateSerializerOptions<Parsers>): SerializeFunction<Parsers, BaseType, Return>;
export declare function createStandardSchemaV1<Parsers extends ParserMap, PartialOutput extends boolean = false>(_: Parsers, {
  urlKeys,
  partialOutput
}?: CreateStandardSchemaV1Options<Parsers, PartialOutput>): StandardSchemaV1<MaybePartial<PartialOutput, inferParserType<Parsers>>>;
export declare function debounce(_: number): LimitUrlUpdates;
export declare function parseAsArrayOf<ItemType>(_: SingleParser<ItemType>, _?: string): SingleParserBuilder<ItemType[]>;
export declare function parseAsJson<T>(_: ((_: unknown) => T | null) | StandardSchemaV1<T>): SingleParserBuilder<T>;
export declare function parseAsNativeArrayOf<ItemType>(_: SingleParser<ItemType>): ReturnType<MultiParserBuilder<ItemType[]>["withDefault"]>;
export declare function parseAsNumberLiteral<const Literal extends number>(_: readonly Literal[]): SingleParserBuilder<Literal>;
export declare function parseAsStringEnum<Enum extends string>(_: Enum[]): SingleParserBuilder<Enum>;
export declare function parseAsStringLiteral<const Literal extends string>(_: readonly Literal[]): SingleParserBuilder<Literal>;
export declare function throttle(_: number): LimitUrlUpdates;
export declare function useQueryState<T>(_: string, _: UseQueryStateOptions<T> & {
  defaultValue: T;
}): UseQueryStateReturn<NonNullable<ReturnType<typeof options.parse>>, typeof options.defaultValue>;
export declare function useQueryState<T>(_: string, _: UseQueryStateOptions<T>): UseQueryStateReturn<NonNullable<ReturnType<typeof options.parse>>, undefined>;
export declare function useQueryState(_: string, _: Options & {
  defaultValue: string;
} & { [K in keyof GenericParser<unknown>]?: never }): UseQueryStateReturn<string, typeof options.defaultValue>;
export declare function useQueryState(_: string, _: Pick<UseQueryStateOptions<string>, keyof Options>): UseQueryStateReturn<string, undefined>;
export declare function useQueryState(_: string): UseQueryStateReturn<string, undefined>;
export declare function useQueryStates<KeyMap extends UseQueryStatesKeysMap>(_: KeyMap, _?: Partial<UseQueryStatesOptions<KeyMap>>): UseQueryStatesReturn<KeyMap>;
// #endregion

// #region Variables
export declare const defaultRateLimit: LimitUrlUpdates;
export declare const parseAsBoolean: SingleParserBuilder<boolean>;
export declare const parseAsFloat: SingleParserBuilder<number>;
export declare const parseAsHex: SingleParserBuilder<number>;
export declare const parseAsIndex: SingleParserBuilder<number>;
export declare const parseAsInteger: SingleParserBuilder<number>;
export declare const parseAsIsoDate: SingleParserBuilder<Date>;
export declare const parseAsIsoDateTime: SingleParserBuilder<Date>;
export declare const parseAsString: SingleParserBuilder<string>;
export declare const parseAsTimestamp: SingleParserBuilder<Date>;
// #endregion
