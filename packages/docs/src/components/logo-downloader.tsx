'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SiGooglephotos, SiSvg } from '@icons-pack/react-simple-icons'

const LOGO_ADDRESS_URL = '/icon.svg'
const COPIED_TIMEOUT = 1000

enum CopyFormatEnum {
  WORDMARK_SVG = 'wordmark_svg',
  WORDMARK_PNG = 'wordmark_png',
  LOGO_SVG = 'logo_svg',
  LOGO_PNG = 'logo_png'
}

const NuqsLogoDownloader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [copiedItem, setCopiedItem] = useState<CopyFormatEnum | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const clearStates = useCallback(() => {
    setIsMenuOpen(false)
    setCopiedItem(null)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        clearStates()
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  useEffect(() => {
    const wordmark = document.getElementById('nuqs-wordmark')
    if (wordmark) {
      wordmark.addEventListener('contextmenu', handleContextMenu as any)
    }
    return () => {
      if (wordmark) {
        wordmark.removeEventListener('contextmenu', handleContextMenu as any)
      }
    }
  }, [])

  const handleCopySuccess = useCallback(
    (format: CopyFormatEnum) => {
      setCopiedItem(format)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(clearStates, COPIED_TIMEOUT)
    },
    [clearStates]
  )

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setIsMenuOpen(true)
  }

  const handleCopyLogoSvg = async () => {
    try {
      const textPromise = fetch(LOGO_ADDRESS_URL).then(response =>
        response.text()
      )

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': textPromise.then(
            text => new Blob([text], { type: 'text/plain' })
          )
        })
      ])

      handleCopySuccess(CopyFormatEnum.LOGO_SVG)
    } catch (error) {
      console.error('Failed to copy logo SVG:', error)
      clearStates()
    }
  }

  const handleCopyLogoPng = async () => {
    try {
      const pngBlobPromise = new Promise<Blob>(async (resolve, reject) => {
        try {
          const response = await fetch(LOGO_ADDRESS_URL)
          const svgText = await response.text()

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

      handleCopySuccess(CopyFormatEnum.LOGO_PNG)
    } catch (error) {
      console.error('Failed to copy logo PNG:', error)
      clearStates()
    }
  }

  const handleCopyWordmarkSvg = async () => {
    try {
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
      handleCopySuccess(CopyFormatEnum.WORDMARK_SVG)
    } catch (error) {
      console.error('Failed to copy wordmark SVG:', error)
      clearStates()
    }
  }

  const handleCopyWordmarkPng = async () => {
    try {
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

      handleCopySuccess(CopyFormatEnum.WORDMARK_PNG)
    } catch (error) {
      console.error('Failed to copy wordmark PNG:', error)
      clearStates()
    }
  }

  return (
    <>
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50"
          style={{ left: position.x, top: position.y }}
        >
          <div className="w-[240px] overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-xl backdrop-blur-sm dark:bg-black">
            <div className="p-1">
              <button
                className="dark:hover:bg-secondary flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors duration-150 hover:bg-gray-100"
                onClick={handleCopyWordmarkSvg}
              >
                <SiSvg className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-fd-muted-foreground flex-1 text-sm font-medium">
                  {copiedItem == CopyFormatEnum.WORDMARK_SVG
                    ? 'Copied!'
                    : 'Copy wordmark (SVG)'}
                </span>
              </button>

              <button
                className="dark:hover:bg-secondary flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors duration-150 hover:bg-gray-100"
                onClick={handleCopyWordmarkPng}
              >
                <SiGooglephotos className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-fd-muted-foreground flex-1 text-sm font-medium">
                  {copiedItem == CopyFormatEnum.WORDMARK_PNG
                    ? 'Copied!'
                    : 'Copy wordmark (PNG)'}
                </span>
              </button>

              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

              <button
                className="dark:hover:bg-secondary flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors duration-150 hover:bg-gray-100"
                onClick={handleCopyLogoSvg}
              >
                <SiSvg className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-fd-muted-foreground flex-1 text-sm font-medium">
                  {copiedItem == CopyFormatEnum.LOGO_SVG
                    ? 'Copied!'
                    : 'Copy logo (SVG)'}
                </span>
              </button>

              <button
                className="dark:hover:bg-secondary flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors duration-150 hover:bg-gray-100"
                onClick={handleCopyLogoPng}
              >
                <SiGooglephotos className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-fd-muted-foreground flex-1 text-sm font-medium">
                  {copiedItem == CopyFormatEnum.LOGO_PNG
                    ? 'Copied!'
                    : 'Copy logo (PNG)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NuqsLogoDownloader
