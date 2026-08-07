// This file is needed for projects that have `moduleResolution` set to `node`
// in their tsconfig.json to be able to `import {} from 'nuqs/adapters/react-router'`.
// Other module resolutions strategies will look for the `exports` in `package.json`,
// but with `node`, TypeScript will look for a .d.ts file with that name at the
// root of the package.
//
// Note: this default react-router adapter is for react-router v6.
// If you are using react-router v7 or v8, please import from
// `nuqs/adapters/react-router/v7` or `nuqs/adapters/react-router/v8`

export * from '../dist/adapters/react-router'
