const config = {
  $schema: './node_modules/@stryker-mutator/core/schema/stryker-schema.json',
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  ignorePatterns: ['tsconfig.json', 'tsconfig.build.json'],
  reporters: ['progress'],
  concurrency: 4,
  ignoreStatic: true,
  mutator: {
    excludedMutations: [
      'ArrayDeclaration', // Replaces array contents with an empty array.
      'ArrowFunction', // Replaces arrow-function bodies with undefined.
      'BlockStatement', // Removes the statements from a block.
      'BooleanLiteral', // Negates boolean literals.
      'ObjectLiteral', // Replaces object contents with an empty object.
      'StringLiteral' // Replaces strings with empty or altered values.
    ]
  },
  thresholds: {
    // CI compares the combined Node and browser mutation debt to the base.
    break: 0
  },
  incremental: true
}

export default config
