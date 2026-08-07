import fs from 'node:fs'
import path from 'node:path'
import type { ReactElement } from 'react'

import { BrandAssetsMenuClient } from './brand-assets-menu.client'

export type BrandAssetsMenuProps = {
  children: ReactElement
}

export type BrandAsset = {
  id: string
  actionLabel: string
  filename: string
  preview: 'logomark' | 'logotype'
  previewClassName: string
  svg: string
}

export type DownloadableBrandAsset = {
  filename: string
  svg: string
}

const assetsDir = path.resolve(process.cwd(), '../res')

const assets = [
  {
    id: 'logomark',
    actionLabel: 'Copy Logomark as SVG',
    filename: 'logo.dark.svg',
    preview: 'logomark',
    previewClassName: 'size-4'
  },
  {
    id: 'logotype',
    actionLabel: 'Copy Logotype as SVG',
    filename: 'wordmark.svg',
    preview: 'logotype',
    previewClassName: 'size-4'
  }
] satisfies Array<Omit<BrandAsset, 'svg'>>

export function BrandAssetsMenu({ children }: BrandAssetsMenuProps) {
  const svgAssets = assets.map(asset => ({
    ...asset,
    svg: fs.readFileSync(path.join(assetsDir, asset.filename), 'utf8')
  }))
  const downloadableAssets = fs
    .readdirSync(assetsDir)
    .filter(filename => filename.endsWith('.svg'))
    .sort()
    .map(filename => ({
      filename,
      svg: fs.readFileSync(path.join(assetsDir, filename), 'utf8')
    }))
  return (
    <BrandAssetsMenuClient
      assets={svgAssets}
      downloadableAssets={downloadableAssets}
    >
      {children}
    </BrandAssetsMenuClient>
  )
}
