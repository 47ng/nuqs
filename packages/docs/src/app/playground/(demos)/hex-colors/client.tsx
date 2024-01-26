'use client'

import { createParser, parseAsHex, useQueryState } from 'nuqs'

const hexColorSchema = createParser({
  parse(query) {
    if (query.length !== 6) {
      return null
    }
    return {
      r: parseAsHex.parse(query.slice(0, 2)) ?? 0x00,
      g: parseAsHex.parse(query.slice(2, 4)) ?? 0x00,
      b: parseAsHex.parse(query.slice(4)) ?? 0x00
    }
  },
  serialize({ r, g, b }) {
    return (
      parseAsHex.serialize(r) +
      parseAsHex.serialize(g) +
      parseAsHex.serialize(b)
    )
  }
})

export default function HexColorsDemo() {
  const [color, setColor] = useQueryState(
    'color',
    hexColorSchema.withDefault({
      r: 0x00,
      g: 0x00,
      b: 0x00
    })
  )
  const asHex = '#' + hexColorSchema.serialize(color)
  return (
    <div className="flex flex-wrap-reverse items-center gap-4">
      <div
        className="h-64 w-64 rounded border"
        style={{
          backgroundColor: `rgb(${color.r} ${color.g} ${color.b})`
        }}
      />
      <section className="space-y-2">
        <div className="flex items-center">
          <label>Color</label>
          <input
            type="color"
            value={asHex}
            onChange={e =>
              setColor(hexColorSchema.parse(e.target.value.slice(1)))
            }
            style={{
              display: 'inline-block',
              marginInline: '8px'
            }}
          />
          <span
            style={{
              fontFamily: 'monospace'
            }}
          >
            {asHex}
          </span>
        </div>
        <ColorSlider
          label="R"
          value={color.r}
          onChange={r => setColor(color => ({ ...color, r }))}
          accentColor={
            '#' + hexColorSchema.serialize({ r: color.r, g: 0, b: 0 })
          }
        />
        <ColorSlider
          label="G"
          value={color.g}
          onChange={g => setColor(color => ({ ...color, g }))}
          accentColor={
            '#' + hexColorSchema.serialize({ r: 0, g: color.g, b: 0 })
          }
        />
        <ColorSlider
          label="B"
          value={color.b}
          onChange={b => setColor(color => ({ ...color, b }))}
          accentColor={
            '#' + hexColorSchema.serialize({ r: 0, g: 0, b: color.b })
          }
        />
      </section>
    </div>
  )
}

type ColorSliderProps = {
  label: string
  value: number
  onChange: (value: number) => void
  accentColor: string
}

const ColorSlider = ({
  label,
  value,
  onChange,
  accentColor
}: ColorSliderProps) => {
  return (
    <div className="flex items-center gap-4" style={{ accentColor }}>
      <label>{label}</label>
      <input
        type="range"
        value={value}
        onChange={e => onChange(e.target.valueAsNumber)}
        min={0}
        max={255}
        step={1}
      />
    </div>
  )
}
