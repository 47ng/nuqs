# registry

A shadcn/ui compatible registry for community parsers and utilities for the [nuqs](https://nuqs.dev) library.

## Development

```bash
# Install dependencies
pnpm install

# Build the registry
pnpm build

# Run the registry (using serve or any other static file server)
serve public -p 3000

```

Usage example in any npm package:

```bash
pnpm dlx shadcn@latest add http://localhost:3000/r/parseAsTuple.json
```

## Learn More

To learn more about nuqs and shadcn/ui registries, take a look at the following resources:

- [nuqs Documentation](https://nuqs.dev) - learn about nuqs features and API
- [shadcn/ui Registry Documentation](https://ui.shadcn.com/docs/registry) - learn about shadcn/ui registries
- [nuqs GitHub Repository](https://github.com/47ng/nuqs) - source code and issues
