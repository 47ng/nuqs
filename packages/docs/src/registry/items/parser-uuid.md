Install the parser using the CLI or copy/paste above, then import it in your components:

```ts title="app/page.tsx"
import { useQueryState } from 'nuqs'
import { parseAsUuid } from '~/lib/parsers/uuid'

// [!code word:parseAsUuid]
// Accept any valid UUID (versions 1-8, plus nil and max)
const [id, setId] = useQueryState('id', parseAsUuid())

// Only accept UUID v4
const [sessionId, setSessionId] = useQueryState(
  'sessionId',
  parseAsUuid({ version: 4 })
)
```

By default, the parser accepts any valid UUID format (versions 1-8), plus the
special nil UUID (all zeros) and max UUID (all Fs). When a version is specified,
only UUIDs of that version are accepted. Invalid values parse as `null`.
