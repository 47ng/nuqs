'use client'

import { Display } from '../components/display'
import { useLink } from '../components/link'
import { parseAsString, useQueryState } from 'nuqs'
import { Suspense, use, useEffect, useState, useSyncExternalStore } from 'react'

const folderParser = parseAsString.withOptions({ shallow: false })
const folders = new Map<string, Promise<string>>()
const loadedFolders = new Set<string>()
const loadedFolderListeners = new Set<() => void>()

function getLoadedFolders() {
  return [...loadedFolders].toSorted().join(',')
}

function subscribeToLoadedFolders(listener: () => void) {
  loadedFolderListeners.add(listener)
  return () => loadedFolderListeners.delete(listener)
}

function loadFolder(id: string) {
  if (!folders.has(id)) {
    folders.set(
      id,
      fetch(`/__mocked__/repro-1501/folders/${encodeURIComponent(id)}`).then(
        async response => {
          if (!response.ok) {
            throw new Error(`Could not load folder ${id}: ${response.status}`)
          }
          const contents = await response.text()
          loadedFolders.add(id)
          loadedFolderListeners.forEach(listener => listener())
          return contents
        }
      )
    )
  }
  return folders.get(id)!
}

function LoadedFolders() {
  const loaded = useSyncExternalStore(
    subscribeToLoadedFolders,
    getLoadedFolders,
    () => ''
  )
  return <Display environment="client" target="loaded-folders" state={loaded} />
}

function FolderPanel({ id }: { id: string }) {
  const contents = use(loadFolder(id))
  return <Display environment="client" target="folder-panel" state={contents} />
}

function FolderState() {
  const [folderId] = useQueryState('folder', folderParser)
  return (
    <>
      <Display
        environment="client"
        target="nuqs-value"
        state={String(folderId)}
      />
      {folderId ? <FolderPanel id={folderId} /> : null}
    </>
  )
}

function RouterState({
  useRouterValue
}: {
  useRouterValue: () => string | null
}) {
  const routerValue = useRouterValue()
  return (
    <Display
      environment="client"
      target="router-value"
      state={String(routerValue)}
    />
  )
}

function MountToken() {
  const [token, setToken] = useState('')
  useEffect(() => setToken(crypto.randomUUID()), [])
  return <Display environment="client" target="mount-token" state={token} />
}

function Controls() {
  const [, setFolderId] = useQueryState('folder', folderParser)
  return (
    <button onClick={() => void setFolderId('def')}>
      Set folder def with nuqs
    </button>
  )
}

export function Repro1501({
  useRouterValue,
  crossPathHref
}: {
  useRouterValue: () => string | null
  crossPathHref?: string
}) {
  const Link = useLink()
  return (
    <Suspense>
      <Link href="?folder=abc">Open folder abc</Link>
      {crossPathHref ? (
        <Link href={crossPathHref}>Open folder def on another path</Link>
      ) : null}
      <Controls />
      <RouterState useRouterValue={useRouterValue} />
      <MountToken />
      <LoadedFolders />
      <Suspense fallback={<p>Loading folder</p>}>
        <FolderState />
      </Suspense>
    </Suspense>
  )
}
