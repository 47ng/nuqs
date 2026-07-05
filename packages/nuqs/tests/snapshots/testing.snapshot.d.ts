// #region Functions
export declare function isParserBijective<T>(_: SingleParserBuilder<T>, _: string, _: T): boolean;
export declare function isParserBijective<T>(_: MultiParserBuilder<T>, _: Array<string>, _: T): boolean;
export declare function testParseThenSerialize<T>(_: SingleParserBuilder<T>, _: string): boolean;
export declare function testParseThenSerialize<T>(_: MultiParserBuilder<T>, _: Array<string>): boolean;
export declare function testSerializeThenParse<T>(_: SingleParserBuilder<T>, _: T): boolean;
export declare function testSerializeThenParse<T>(_: MultiParserBuilder<T>, _: T): boolean;
// #endregion
