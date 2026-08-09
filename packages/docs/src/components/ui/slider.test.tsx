import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Slider } from './slider'

function sliderThumb(html: string) {
  const thumb = html.match(/<span[^>]*role="slider"[^>]*>/)?.[0]
  expect(thumb).toBeDefined()
  return thumb!
}

describe('Slider accessibility', () => {
  it('applies an accessible label to the slider thumb', () => {
    const thumb = sliderThumb(
      renderToStaticMarkup(
        <Slider aria-label="Floating point value" defaultValue={[0]} />
      )
    )

    expect(thumb).toContain('aria-label="Floating point value"')
  })

  it('applies an accessible label reference to the slider thumb', () => {
    const thumb = sliderThumb(
      renderToStaticMarkup(
        <Slider aria-labelledby="float-label" defaultValue={[0]} />
      )
    )

    expect(thumb).toContain('aria-labelledby="float-label"')
  })
})
