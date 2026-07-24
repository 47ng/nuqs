'use client'

import { useLink } from '../components/link'
import { parseAsString, useQueryState } from 'nuqs'
import { Suspense, use } from 'react'

const folderParser = parseAsString.withOptions({ shallow: false })
const folders = new Map<string, Promise<string>>()

function loadFolder(id: string) {
  if (!folders.has(id)) {
    folders.set(
      id,
      new Promise(resolve => {
        setTimeout(() => resolve(`Contents of folder "${id}"`), 600)
      })
    )
  }
  return folders.get(id)!
}

function FolderPanel({ id }: { id: string }) {
  const contents = use(loadFolder(id))
  return <div data-testid="folder-panel">{contents}</div>
}

function Opener() {
  const [folderId] = useQueryState('folder', folderParser)
  return folderId ? <FolderPanel id={folderId} /> : null
}

function Status({ useRouterValue }: { useRouterValue: () => string | null }) {
  const [folderId] = useQueryState('folder', folderParser)
  const routerValue = useRouterValue()
  return (
    <>
      <div data-testid="nuqs-value">{String(folderId)}</div>
      <div data-testid="router-value">{String(routerValue)}</div>
    </>
  )
}

export function Repro1501({
  useRouterValue
}: {
  useRouterValue: () => string | null
}) {
  const Link = useLink()
  return (
    <Suspense>
      <Link href="?folder=abc">Open folder abc</Link>
      <Status useRouterValue={useRouterValue} />
      <Opener />
    </Suspense>
  )
}
