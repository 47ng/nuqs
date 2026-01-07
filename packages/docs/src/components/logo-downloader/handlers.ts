const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (!match) return rgb

  const hex = (x: number) => {
    const h = x.toString(16)
    return h.length === 1 ? '0' + h : h
  }

  return (
    '#' +
    hex(parseInt(match[1])) +
    hex(parseInt(match[2])) +
    hex(parseInt(match[3]))
  )
}

export const handleCopyLogoSvg = async (svgText: string) => {
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': new Blob([svgText], { type: 'text/plain' })
    })
  ])
}

export const handleCopyLogoPng = async (svgText: string) => {
  const pngBlobPromise = new Promise<Blob>(async (resolve, reject) => {
    try {
      const blob = new Blob([svgText], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width || 64
        canvas.height = img.height || 64
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0)

        canvas.toBlob(pngBlob => {
          URL.revokeObjectURL(url)
          if (pngBlob) {
            resolve(pngBlob)
          } else {
            reject(new Error('Failed to create PNG blob'))
          }
        }, 'image/png')
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    } catch (error) {
      reject(error)
    }
  })

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': pngBlobPromise
    })
  ])
}

const getColorsFromTheme = (theme: 'light' | 'dark') => {
  const wordmark = document.getElementById('nuqs-wordmark')
  if (!wordmark) return null

  const html = document.documentElement
  const body = document.body
  const originalHtmlClass = html.className
  const originalBodyClass = body.className

  if (theme === 'dark') {
    html.classList.add('dark')
    body.classList.add('dark')
  } else {
    html.classList.remove('dark')
    body.classList.remove('dark')
  }

  void wordmark.offsetHeight

  const paths = wordmark.querySelectorAll('path')
  const colors = Array.from(paths).map(path => {
    const computedStyle = window.getComputedStyle(path)
    return rgbToHex(computedStyle.fill)
  })

  html.className = originalHtmlClass
  body.className = originalBodyClass

  void wordmark.offsetHeight

  return colors
}

const downloadWordmarkWithTheme = async (theme: 'light' | 'dark') => {
  const wordmark = document.getElementById('nuqs-wordmark')
  if (!wordmark) return

  const colors = getColorsFromTheme(theme)
  if (!colors) return

  const wordmarkClone = wordmark.cloneNode(true) as SVGElement
  const clonedPaths = wordmarkClone.querySelectorAll('path')

  clonedPaths.forEach((path, index) => {
    path.setAttribute('fill', colors[index])
    path.removeAttribute('class')
  })

  wordmarkClone.removeAttribute('class')

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(wordmarkClone)

  await navigator.clipboard.writeText(svgString)
}

export const handleCopyWordmarkSvgLight = async () => {
  await downloadWordmarkWithTheme('light')
}

export const handleCopyWordmarkSvgDark = async () => {
  await downloadWordmarkWithTheme('dark')
}

const convertWordmarkToPng = async (theme: 'light' | 'dark'): Promise<Blob> => {
  const wordmark = document.getElementById(
    'nuqs-wordmark'
  ) as SVGSVGElement | null
  if (!wordmark) throw new Error('Wordmark not found')

  const colors = getColorsFromTheme(theme)
  if (!colors) throw new Error('Could not extract colors')

  return new Promise<Blob>((resolve, reject) => {
    try {
      const wordmarkClone = wordmark.cloneNode(true) as SVGElement
      const clonedPaths = wordmarkClone.querySelectorAll('path')

      clonedPaths.forEach((path, index) => {
        path.setAttribute('fill', colors[index])
        path.removeAttribute('class')
      })

      wordmarkClone.removeAttribute('class')

      const serializer = new XMLSerializer()
      const wordmarkString = serializer.serializeToString(wordmarkClone)

      const blob = new Blob([wordmarkString], {
        type: 'image/svg+xml;charset=utf-8'
      })
      const url = URL.createObjectURL(blob)

      const img = new Image()

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const scale = 4

          let width = wordmark.viewBox.baseVal.width
          let height = wordmark.viewBox.baseVal.height

          if (!width || !height) {
            const bbox = wordmark.getBoundingClientRect()
            width = bbox.width || 200
            height = bbox.height || 50
          }

          width = Math.max(width, 100)
          height = Math.max(height, 25)

          canvas.width = width * scale
          canvas.height = height * scale

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            URL.revokeObjectURL(url)
            reject(new Error('Could not get canvas context'))
            return
          }

          ctx.fillStyle = 'transparent'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(pngBlob => {
            URL.revokeObjectURL(url)
            if (pngBlob) {
              resolve(pngBlob)
            } else {
              reject(new Error('Failed to create PNG blob'))
            }
          }, 'image/png')
        } catch (error) {
          URL.revokeObjectURL(url)
          reject(error)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG as image'))
      }

      img.src = url
    } catch (error) {
      reject(error)
    }
  })
}

export const handleCopyWordmarkPngLight = async () => {
  const pngBlobPromise = convertWordmarkToPng('light')

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': pngBlobPromise
    })
  ])
}

export const handleCopyWordmarkPngDark = async () => {
  const pngBlobPromise = convertWordmarkToPng('dark')

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': pngBlobPromise
    })
  ])
}
