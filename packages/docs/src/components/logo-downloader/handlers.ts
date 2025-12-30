const LOGO_ADDRESS_URL = '/icon.svg'

export const handleCopyLogoSvg = async (svgText: string) => {
  await navigator.clipboard.write([
    new ClipboardItem({
      "text/plain": new Blob([svgText], { type: "text/plain" }),
    }),
  ]);
};

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

export const handleCopyWordmarkSvg = async () => {
    const wordmark = document.getElementById('nuqs-wordmark')
    if (!wordmark) return

    const wordmarkClone = wordmark.cloneNode(true) as SVGElement

    const originalPaths = wordmark.querySelectorAll('path')
    const clonedPaths = wordmarkClone.querySelectorAll('path')

    originalPaths.forEach((originalPath, index) => {
      const computedStyle = window.getComputedStyle(originalPath)
      const fillColor = computedStyle.fill

      if (fillColor && fillColor !== 'none') {
        clonedPaths[index].setAttribute('fill', fillColor)
      }
      clonedPaths[index].removeAttribute('class')
    })

    wordmarkClone.removeAttribute('class')

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(wordmarkClone)

    await navigator.clipboard.writeText(svgString)
}

export const handleCopyWordmarkPng = async () => {
    const wordmark = document.getElementById(
      'nuqs-wordmark'
    ) as SVGSVGElement | null
    if (!wordmark) return

    const pngBlobPromise = new Promise<Blob>((resolve, reject) => {
      try {
        const wordmarkClone = wordmark.cloneNode(true) as SVGElement

        const originalPaths = wordmark.querySelectorAll('path')
        const clonedPaths = wordmarkClone.querySelectorAll('path')

        originalPaths.forEach((originalPath, index) => {
          const computedStyle = window.getComputedStyle(originalPath)
          const fillColor = computedStyle.fill

          if (fillColor && fillColor !== 'none') {
            clonedPaths[index].setAttribute('fill', fillColor)
          }
          clonedPaths[index].removeAttribute('class')
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

        img.onerror = err => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load SVG as image'))
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