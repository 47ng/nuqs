'use client'

import { CheckIcon, CopyIcon, DownloadIcon, TypeIcon } from 'lucide-react'
import { type ReactElement, useRef, useState } from 'react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/src/components/ui/context-menu'
import { cn } from '@/src/lib/utils'

import type { BrandAsset, DownloadableBrandAsset } from './brand-assets-menu'

export type BrandAssetsMenuClientProps = {
  assets: Array<BrandAsset>
  downloadableAssets: Array<DownloadableBrandAsset>
  children: ReactElement
}

export function BrandAssetsMenuClient({
  assets,
  downloadableAssets,
  children
}: BrandAssetsMenuClientProps) {
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null)
  const copyingAssetId = useRef<string | null>(null)

  const copyAsset = async (asset: BrandAsset) => {
    if (copyingAssetId.current === asset.id) {
      return
    }
    copyingAssetId.current = asset.id
    setCopiedAssetId(asset.id)
    await copyText(asset.svg)
    window.setTimeout(() => {
      copyingAssetId.current = null
      setCopiedAssetId(null)
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
    }, 450)
  }

  const downloadBrandAssets = () => {
    const zip = createZip(
      downloadableAssets.map(asset => ({
        filename: asset.filename,
        content: asset.svg
      }))
    )
    const url = URL.createObjectURL(zip)
    const link = document.createElement('a')
    link.href = url
    link.download = 'nuqs-brand-assets.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <ContextMenu onOpenChange={open => !open && setCopiedAssetId(null)}>
      <ContextMenuTrigger asChild>
        <span className="inline-flex items-center">{children}</span>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-fit">
        {assets.map(asset => (
          <ContextMenuItem
            key={asset.id}
            onClick={() => void copyAsset(asset)}
            onSelect={event => {
              event.preventDefault()
              void copyAsset(asset)
            }}
          >
            {asset.preview === 'logotype' ? (
              <TypeIcon />
            ) : (
              <span
                className={cn(
                  'overflow-hidden rounded-full [&>svg]:h-full [&>svg]:w-full [&>svg]:object-contain',
                  asset.previewClassName
                )}
                dangerouslySetInnerHTML={{ __html: asset.svg }}
              />
            )}
            <span>{asset.actionLabel}</span>
            {copiedAssetId === asset.id ? (
              <CheckIcon className="ml-auto text-green-600 dark:text-green-400" />
            ) : (
              <CopyIcon className="ml-auto" />
            )}
          </ContextMenuItem>
        ))}

        <ContextMenuSeparator />

        <ContextMenuItem onClick={downloadBrandAssets}>
          <DownloadIcon />
          Download Brand Assets
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // The icon feedback is intentionally local-only; browsers may deny clipboard access.
  }
}

function createZip(files: Array<{ filename: string; content: string }>) {
  const encoder = new TextEncoder()
  const records: Array<{
    crc: number
    data: Uint8Array
    filename: Uint8Array
    offset: number
  }> = []
  const chunks: Array<Uint8Array> = []
  let offset = 0

  for (const file of files) {
    const filename = encoder.encode(file.filename)
    const data = encoder.encode(file.content)
    const crc = crc32(data)
    const header = new Uint8Array(30 + filename.length)
    const view = new DataView(header.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint32(14, crc, true)
    view.setUint32(18, data.length, true)
    view.setUint32(22, data.length, true)
    view.setUint16(26, filename.length, true)
    header.set(filename, 30)
    chunks.push(header, data)
    records.push({ crc, data, filename, offset })
    offset += header.length + data.length
  }

  const centralDirectoryOffset = offset
  for (const record of records) {
    const header = new Uint8Array(46 + record.filename.length)
    const view = new DataView(header.buffer)
    view.setUint32(0, 0x02014b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 20, true)
    view.setUint32(16, record.crc, true)
    view.setUint32(20, record.data.length, true)
    view.setUint32(24, record.data.length, true)
    view.setUint16(28, record.filename.length, true)
    view.setUint32(42, record.offset, true)
    header.set(record.filename, 46)
    chunks.push(header)
    offset += header.length
  }

  const end = new Uint8Array(22)
  const view = new DataView(end.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, records.length, true)
  view.setUint16(10, records.length, true)
  view.setUint32(12, offset - centralDirectoryOffset, true)
  view.setUint32(16, centralDirectoryOffset, true)
  chunks.push(end)

  return new Blob(chunks.map(toArrayBuffer), { type: 'application/zip' })
}

function toArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ byte) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

const crc32Table = new Uint32Array(
  Array.from({ length: 256 }, (_, index) => {
    let crc = index
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    }
    return crc >>> 0
  })
)
