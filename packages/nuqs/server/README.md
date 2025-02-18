Why just the cache here?

Those "top-level" .d.ts files are used to help projects with `moduleResolution: 'node'`
resolve the correct imports.

The other import under server, `nuqs/server/temporary-react-agnostic`
is temporary (as it says on the tin) and will be removed in nuqs@3.0.0.

Also, nuqs@3.0.0 will require a `moduleResolution: 'bundler' | 'nodeNext` setting in your tsconfig.json.
