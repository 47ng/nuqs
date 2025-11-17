Wrap your `<BrowserRouter>` with the `<NuqsAdapter>`:

```tsx
// [!code word:NuqsAdapter]
import { NuqsAdapter } from './nuqs-adapter'

export function ReactRouter() {
  return (
    <NuqsAdapter>
      <BrowserRouter>
        <Switch>{/* Your routes here */}</Switch>
      </BrowserRouter>
    </NuqsAdapter>
  )
}
```

## Compatibility

This adapter is compatible with `nuqs@^2.8`: support for `react-router-dom@^5`
was extended in `nuqs@2.8.0`, but will likely be removed in `nuqs@3.0.0`.

If you need support for React Router v5, pin your dependency to `nuqs@^2`.
