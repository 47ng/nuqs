// AAA-contrast badge colors derived from the GitHub label colors of the
// impact labels. A raw label color painted as a solid chip cannot reach the
// WCAG AAA ratio (7:1) for mid-tone hues with either black or white text, so
// both themes use a tinted chip instead: the label color blended into the
// page background, with the text walked along the label's own hue/saturation
// until it provably clears 7:1 against that chip. Everything is precomputed
// here (opaque colors, no runtime alpha blending) so the guarantee holds
// regardless of what the badge is rendered on.

// The GitHub label colors of the impact labels, as configured on the repo.
// Presentation-only (the notes markdown can't carry color), so the map lives
// here rather than in the shared codec; an unmapped label falls back to the
// neutral gray of `adapters/community`.
export const LABEL_COLORS: Record<string, string> = {
  'feature/useQueryState': '#c6f6d5',
  'feature/useQueryStates': '#c6f6d5',
  'feature/serializer': '#c6f6d5',
  'feature/cache': '#c6f6d5',
  'feature/time-safety': '#c6f6d5',
  'parsers/built-in': '#ffffff',
  'parsers/community': '#4a45e4',
  'adapters/next/app': '#000000',
  'adapters/next/pages': '#000000',
  'adapters/react': '#5fdbfb',
  'adapters/react-router': '#f44250',
  'adapters/remix': '#c15baf',
  'adapters/tanstack-router': '#36af4d',
  'adapters/testing': '#fcc72b',
  'adapters/community': '#888888'
}
export const FALLBACK_COLOR = '#888888'

// WCAG 2.x AAA for normal text. The badges are 12px, so the relaxed
// large-text threshold (4.5:1) does not apply.
export const AAA_CONTRAST = 7

// Docs page backgrounds the chips are blended into (globals.css --background:
// `0 0% 100%` light, `240 10% 3.9%` dark).
const PAGE_BG = { light: [255, 255, 255], dark: [9, 9, 11] } as const

type RGB = [number, number, number]

function hexToRgb(hex: string): RGB {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}

function rgbToHex([r, g, b]: RGB): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h = (h * 60 + 360) % 360
  }
  return [h, s, l]
}

function hslToRgb([h, s, l]: [number, number, number]): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [rn, gn, bn] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return [
    Math.round((rn + m) * 255),
    Math.round((gn + m) * 255),
    Math.round((bn + m) * 255)
  ]
}

function relativeLuminance([r, g, b]: RGB): number {
  const [rl, gl, bl] = [r, g, b].map(channel => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rl! + 0.7152 * gl! + 0.0722 * bl!
}

export function contrast(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a))
  const lb = relativeLuminance(hexToRgb(b))
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Opaque alpha-blend of the label color over a background: the chip fill.
function blend(label: RGB, bg: readonly number[], alpha: number): RGB {
  return [
    Math.round(label[0] * alpha + bg[0]! * (1 - alpha)),
    Math.round(label[1] * alpha + bg[1]! * (1 - alpha)),
    Math.round(label[2] * alpha + bg[2]! * (1 - alpha))
  ]
}

// Walk the color's lightness (hue and saturation preserved) toward the given
// direction until it clears `threshold` against `against`. Terminates by
// construction: pure black/white against any tinted fill exceeds both
// thresholds used here, and the loop clamps there.
function ensureContrast(
  color: RGB,
  against: string,
  direction: 'darken' | 'lighten',
  threshold: number
): string {
  const [h, s, l] = rgbToHsl(color)
  const step = direction === 'darken' ? -0.005 : 0.005
  let lightness = l
  for (;;) {
    const candidate = rgbToHex(hslToRgb([h, s, lightness]))
    if (contrast(candidate, against) >= threshold) return candidate
    lightness += step
    if (lightness <= 0) return '#000000'
    if (lightness >= 1) return '#ffffff'
  }
}

// The border has no WCAG requirement (decorative), but it is what keeps a
// chip whose color sits near the page background visible at all — a white
// label on the light theme, a black one on the dark theme. This floor
// guarantees a discernible edge in those cases.
const BORDER_CONTRAST = 1.5

export type LabelTheme = {
  bg: string
  fg: string
  border: string
}

// The AAA-compliant chip colors for one GitHub label color in one theme:
// an 18% tint of the label over the page background, text pushed along the
// label's hue until it clears 7:1 against that tint, and a 40% tint as the
// border, pushed until it is visible against the page background.
export function labelTheme(hex: string, theme: 'light' | 'dark'): LabelTheme {
  const label = hexToRgb(hex)
  const pageBg = PAGE_BG[theme]
  const pageBgHex = rgbToHex([...PAGE_BG[theme]] as RGB)
  const direction = theme === 'light' ? 'darken' : 'lighten'
  const bg = rgbToHex(blend(label, pageBg, 0.18))
  const border = ensureContrast(
    blend(label, pageBg, 0.4),
    pageBgHex,
    direction,
    BORDER_CONTRAST
  )
  const fg = ensureContrast(label, bg, direction, AAA_CONTRAST)
  return { bg, fg, border }
}
