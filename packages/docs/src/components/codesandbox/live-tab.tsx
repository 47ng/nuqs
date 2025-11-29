'use client'

import { useEffect, useState } from 'react'
import { CodeSandbox, type CodeSandboxDependencies } from '@/src/components/codesandbox'
import { getDemoCode, loadCodeSandboxFiles } from '@/src/lib/get-demo-code'

interface LiveTabProps {
  demoPath: string
}

export function LiveTab({ demoPath }: LiveTabProps) {
  const [code, setCode] = useState<string>('')
  const [deps, setDeps] = useState<CodeSandboxDependencies | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([getDemoCode(demoPath), loadCodeSandboxFiles()]).then(([demoCode, dependencies]) => {
      setCode(demoCode)
      setDeps(dependencies)
      setIsLoading(false)
    })
  }, [demoPath])

  if (isLoading || !deps) {
    return <div className="flex items-center justify-center p-8 text-muted-foreground">Loading...</div>
  }

  return <CodeSandbox code={code} dependencies={deps} />
}