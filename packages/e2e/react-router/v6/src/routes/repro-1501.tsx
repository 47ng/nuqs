import { parseAsString, useQueryState } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6'
import { Suspense, use } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

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
  const [folderId] = useQueryState('folder', parseAsString)
  return folderId ? <FolderPanel id={folderId} /> : null
}

function Status() {
  const [folderId] = useQueryState('folder', parseAsString)
  const [searchParams] = useSearchParams()
  return (
    <>
      <div data-testid="nuqs-value">{String(folderId)}</div>
      <div data-testid="router-value">{String(searchParams.get('folder'))}</div>
    </>
  )
}

export default function Repro1501() {
  return (
    <NuqsAdapter defaultOptions={{ shallow: false }}>
      <Suspense>
        <Link to="?folder=abc">Open folder abc</Link>
        <Status />
        <Opener />
      </Suspense>
    </NuqsAdapter>
  )
}
