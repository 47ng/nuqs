# Color Parser

Parse colors in multiple formats (hex, rgb, hsl, hsv) using [tinycolor2](https://github.com/bgrins/TinyColor).

Install the parser using the CLI or copy/paste above, then use it in your components:

## Usage

### Basic hex color

```tsx
import { useQueryState } from 'nuqs'
import { parseAsHex } from '~/lib/parsers/color'

function ColorPicker() {
  const [color, setColor] = useQueryState(
    'color',
    parseAsHex().withDefault('#0055ff')
  )
  
  return (
    <input
      type="color"
      value={color}
      onChange={(e) => setColor(e.target.value)}
    />
  )
}
```

### Different output formats

```tsx
import { parseAsRgb, parseAsHsl, parseAsHsv } from '~/lib/parsers/color'

// RGB output
const [color] = useQueryState('color', parseAsRgb().withDefault('rgb(0, 85, 255)'))

// HSL output
const [color] = useQueryState('color', parseAsHsl().withDefault('hsl(220, 100%, 50%)'))

// HSV output
const [color] = useQueryState('color', parseAsHsv().withDefault('hsv(220, 100%, 100%)'))
```

### Short hex format

```tsx
import { parseAsHex } from '~/lib/parsers/color'

const [color, setColor] = useQueryState(
  'color',
  parseAsHex(true).withDefault('#05f') // true = short format
)
// Returns #05f instead of #0055ff when possible
```

### Theme customizer

```tsx
import { useQueryStates } from 'nuqs'
import { parseAsHex, parseAsRgb } from '~/lib/parsers/color'

function ThemeEditor() {
  const [colors, setColors] = useQueryStates({
    primary: parseAsHex().withDefault('#0055ff'),
    secondary: parseAsHex(true).withDefault('#f0f'),
    background: parseAsRgb().withDefault('rgb(255, 255, 255)')
  })
  
  return (
    <div>
      <input
        type="color"
        value={colors.primary}
        onChange={(e) => setColors({ primary: e.target.value })}
      />
      {/* ... */}
    </div>
  )
}
```

## Accepted input formats

The parser accepts any valid color format that tinycolor2 supports:

- **Hex**: `#fff`, `#ffffff`, `fff`, `ffffff`
- **RGB**: `rgb(255, 255, 255)`, `rgba(255, 255, 255, 0.5)`
- **HSL**: `hsl(0, 0%, 100%)`, `hsla(0, 0%, 100%, 0.5)`
- **HSV**: `hsv(0, 0%, 100%)`, `hsva(0, 0%, 100%, 0.5)`
- **Named**: `white`, `red`, `blue`, etc.

Invalid colors return `null`.

## URL serialization

All colors are automatically serialized to 6-character hex format (without `#`) in URLs:

```
// User input: rgb(255, 0, 0)  → URL: ?color=ff0000
// User input: hsl(120, 100%, 50%) → URL: ?color=00ff00
// User input: blue → URL: ?color=0000ff
```

## API

### `parseAsColor(options?)`

Main parser with configuration options.

**Options:**
- `format?: 'hex' | 'rgb' | 'hsl' | 'hsv'` - Output format (default: `'hex'`)
- `short?: boolean` - Use short hex format when possible (default: `false`)

### Convenience parsers

- `parseAsHex(short?)` - Parse as hex color
- `parseAsRgb()` - Parse as RGB color  
- `parseAsHsl()` - Parse as HSL color
- `parseAsHsv()` - Parse as HSV color

## Why tinycolor2?

- **Lightweight**: Only 5kB minified + gzipped
- **Comprehensive**: Supports all common color formats
- **Battle-tested**: Widely used in production
- **Simple API**: Easy to use and understand
- **Type-safe**: TypeScript definitions included
