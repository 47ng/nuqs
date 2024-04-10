import { CodeBlock } from '@/src/components/code-block'
import { FileCode2 } from 'lucide-react'
import fs from 'node:fs/promises'

type SourceOnGitHubProps = {
  path: string
}

export async function SourceOnGitHub({ path }: SourceOnGitHubProps) {
  const localPath = path.replace(process.cwd(), '')
  const source = await fs.readFile(path, 'utf8')
  return (
    <footer className="mt-2 space-y-2 border-t py-4">
      <div className="flex items-baseline">
        <span className="flex items-center gap-1 text-zinc-500">
          <FileCode2 size={16} />
          {localPath.split('/').slice(1).join('/')}
        </span>
        <a
          href={`https://github.com/47ng/nuqs/tree/next/packages/docs${localPath}`}
          className="ml-auto text-sm"
        >
          Source on GitHub
        </a>
      </div>
      <div className="not-prose overflow-hidden">
        <CodeBlock code={source} />
      </div>
    </footer>
  )
}
