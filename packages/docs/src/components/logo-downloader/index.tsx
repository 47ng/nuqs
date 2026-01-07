'use client'

import { FC, use, useCallback, useEffect, useRef, useState } from 'react'
import { Image, Code } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/src/components/ui/dropdown-menu'
import {
  handleCopyLogoPng,
  handleCopyLogoSvg,
  handleCopyWordmarkPngDark,
  handleCopyWordmarkPngLight,
  handleCopyWordmarkSvgDark,
  handleCopyWordmarkSvgLight
} from './handlers'

const COPIED_TIMEOUT = 1000

enum CopyFormatEnum {
  WORDMARK_SVG_LIGHT = 'wordmark_svg_light',
  WORDMARK_SVG_DARK = 'wordmark_svg_dark',
  WORDMARK_PNG_LIGHT = 'wordmark_png_light',
  WORDMARK_PNG_DARK = 'wordmark_png_dark',
  LOGO_SVG_LIGHT = 'logo_svg_light',
  LOGO_SVG_DARK = 'logo_svg_dark',
  LOGO_PNG_LIGHT = 'logo_png_light',
  LOGO_PNG_DARK = 'logo_png_dark'
}

interface INuqsLogoDownloaderProps {
  svgTextPromiseLight: Promise<string>
  svgTextPromiseDark: Promise<string>
}

type MenuItemConfig = {
  format: CopyFormatEnum
  label: string
  handler: () => Promise<void>
  icon: typeof Code | typeof Image
}

const NuqsLogoDownloader: FC<INuqsLogoDownloaderProps> = ({
  svgTextPromiseLight,
  svgTextPromiseDark
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [copiedItem, setCopiedItem] = useState<CopyFormatEnum | null>(null)
  const svgTextLight = use(svgTextPromiseLight)
  const svgTextDark = use(svgTextPromiseDark)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const clearStates = useCallback(() => {
    setIsMenuOpen(false)
    setCopiedItem(null)
  }, [])

  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault()
    setIsMenuOpen(true)
  }, [])

  useEffect(() => {
    const wordmark = document.getElementById('nuqs-wordmark')
    if (wordmark) {
      wordmark.addEventListener('contextmenu', handleContextMenu)
    }
    return () => {
      if (wordmark) {
        wordmark.removeEventListener('contextmenu', handleContextMenu)
      }
    }
  }, [handleContextMenu])

  const handleCopy = useCallback(
    async (fn: () => Promise<void>, format: CopyFormatEnum) => {
      try {
        await fn()
        setCopiedItem(format)

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          clearStates()
        }, COPIED_TIMEOUT)
      } catch (err) {
        console.error('Copy failed:', err)
        clearStates()
      }
    },
    [clearStates]
  )

  const wordmarkItems: MenuItemConfig[] = [
    {
      format: CopyFormatEnum.WORDMARK_SVG_LIGHT,
      label: 'Copy wordmark (SVG) light',
      handler: handleCopyWordmarkSvgLight,
      icon: Code
    },
    {
      format: CopyFormatEnum.WORDMARK_SVG_DARK,
      label: 'Copy wordmark (SVG) dark',
      handler: handleCopyWordmarkSvgDark,
      icon: Code
    },
    {
      format: CopyFormatEnum.WORDMARK_PNG_LIGHT,
      label: 'Copy wordmark (PNG) light',
      handler: handleCopyWordmarkPngLight,
      icon: Image
    },
    {
      format: CopyFormatEnum.WORDMARK_PNG_DARK,
      label: 'Copy wordmark (PNG) dark',
      handler: handleCopyWordmarkPngDark,
      icon: Image
    }
  ]

  const logoItems: MenuItemConfig[] = [
    {
      format: CopyFormatEnum.LOGO_SVG_LIGHT,
      label: 'Copy logo (SVG) light',
      handler: () => handleCopyLogoSvg(svgTextLight),
      icon: Code
    },
    {
      format: CopyFormatEnum.LOGO_SVG_DARK,
      label: 'Copy logo (SVG) dark',
      handler: () => handleCopyLogoSvg(svgTextDark),
      icon: Code
    },
    {
      format: CopyFormatEnum.LOGO_PNG_LIGHT,
      label: 'Copy logo (PNG) light',
      handler: () => handleCopyLogoPng(svgTextLight),
      icon: Image
    },
    {
      format: CopyFormatEnum.LOGO_PNG_DARK,
      label: 'Copy logo (PNG) dark',
      handler: () => handleCopyLogoPng(svgTextDark),
      icon: Image
    }
  ]

  const renderMenuItem = ({
    format,
    label,
    handler,
    icon: Icon
  }: MenuItemConfig) => (
    <DropdownMenuItem
      key={format}
      className="cursor-pointer"
      onClick={e => {
        e.preventDefault()
        handleCopy(handler, format)
      }}
    >
      {copiedItem === format ? 'Copied!' : label}
      <DropdownMenuShortcut>
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </DropdownMenuShortcut>
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <span />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[270px]" align="start">
        <DropdownMenuLabel>Wordmark</DropdownMenuLabel>
        <DropdownMenuGroup>
          {wordmarkItems.map(renderMenuItem)}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Logo</DropdownMenuLabel>
        <DropdownMenuGroup>{logoItems.map(renderMenuItem)}</DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NuqsLogoDownloader
