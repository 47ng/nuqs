'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SiGooglephotos, SiSvg } from '@icons-pack/react-simple-icons'
import {
  handleCopyLogoPng,
  handleCopyLogoSvg,
  handleCopyWordmarkPng,
  handleCopyWordmarkSvg
} from './handlers'

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

  const handleCopy = async (
    fn: () => Promise<void>,
    format: CopyFormatEnum
  ) => {
    try {
      await fn()
      handleCopySuccess(format)
    } catch (err) {
      console.error(err)
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
                onClick={() =>
                  handleCopy(handleCopyWordmarkSvg, CopyFormatEnum.WORDMARK_SVG)
                }
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
                onClick={() =>
                  handleCopy(handleCopyWordmarkPng, CopyFormatEnum.WORDMARK_PNG)
                }
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
                onClick={() =>
                  handleCopy(handleCopyLogoSvg, CopyFormatEnum.LOGO_SVG)
                }
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
                onClick={() =>
                  handleCopy(handleCopyLogoPng, CopyFormatEnum.LOGO_PNG)
                }
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

export default NuqsLogoDownloader;