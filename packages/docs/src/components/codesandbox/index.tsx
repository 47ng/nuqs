'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Copy, Check, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, useSandpack } from '@codesandbox/sandpack-react'
import { INITIAL_CODE, SANDPACK_FILES } from '@/src/components/codesandbox/files'

export type CodeSandboxDependencies = Record<string, { code: string }>

interface CodeSandboxProps {
  code?: string
  syncTrigger?: number
  dependencies?: CodeSandboxDependencies
}

function CodeSync({ onCodeChange }: { onCodeChange: (code: string) => void }) {
  const { sandpack } = useSandpack()
  const lastCode = useRef('')

  // Sync code changes from Sandpack editor to parent component state
  useEffect(() => {
    const file = sandpack.files['/Demo.tsx']
    if (file?.code && file.code !== lastCode.current) {
      lastCode.current = file.code
      onCodeChange(file.code)
    }
  }, [sandpack.files, onCodeChange])

  return null
}

export function CodeSandbox({ code: initialCode = INITIAL_CODE, syncTrigger, dependencies }: CodeSandboxProps) {
  const [code, setCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const getSearch = useCallback(() => new URLSearchParams(window.location.search).toString(), [])
  const getTheme = useCallback(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light', [])

  // Reset code to initial value when initialCode prop changes
  useEffect(() => setCode(initialCode), [initialCode])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const handleReset = useCallback(() => setCode(initialCode), [initialCode])

  const postToIframes = useCallback((type: string, data: any) => {
    document.querySelectorAll('iframe').forEach(iframe =>
      iframe.contentWindow?.postMessage({ type, ...data }, '*')
    )
  }, [])

  const files = useMemo(() => ({
    ...dependencies,
    ...SANDPACK_FILES,
    '/Demo.tsx': { code, active: true },
  }), [code, dependencies])

  // Listen for iframe messages and sync URL state bidirectionally between parent and iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'nuqs-url-update') {
        const current = new URL(window.location.href)
        if (current.searchParams.toString() !== e.data.search) {
          window.history.replaceState({}, '', `${current.pathname}${e.data.search ? '?' + e.data.search : ''}`)
        }
      } else if (e.data?.type === 'nuqs-child-ready') {
        postToIframes('nuqs-parent-url-update', { search: getSearch() })
        postToIframes('nuqs-theme-update', { theme: getTheme() })
      }
    }

    const handlePopState = () => postToIframes('nuqs-parent-url-update', { search: getSearch() })

    window.addEventListener('message', handleMessage)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)

    const timer = setTimeout(() => postToIframes('nuqs-parent-url-update', { search: getSearch() }), 1000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [postToIframes, getSearch, getTheme])

  // Force URL sync when syncTrigger prop changes
  useEffect(() => {
    if (syncTrigger !== undefined) {
      postToIframes('nuqs-parent-url-update', { search: getSearch() })
    }
  }, [syncTrigger, postToIframes, getSearch])

  // Watch for theme changes on document element and sync to iframes
  useEffect(() => {
    postToIframes('nuqs-theme-update', { theme: getTheme() })

    const observer = new MutationObserver(() => postToIframes('nuqs-theme-update', { theme: getTheme() }))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [postToIframes, getTheme])

  // Sync URL when component becomes visible in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries[0].isIntersecting && postToIframes('nuqs-parent-url-update', { search: getSearch() }),
      { threshold: 0 }
    )

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [postToIframes, getSearch])

  const hasChanges = code !== initialCode
  const stats = { lines: code.split('\n').length, chars: code.length }

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border bg-card p-3 md:p-4">
        <div className="flex items-center gap-2">
          <span key={code} className="rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">Live</span>
          <span className="text-xs text-muted-foreground">{stats.lines} lines • {stats.chars} chars</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Reset</span>
          </Button>
          <Button size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 md:mr-2" /> : <Copy className="h-4 w-4 md:mr-2" />}
            <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border shadow-xl">
        <SandpackProvider
          template="react-ts"
          theme={{
            colors: {
              surface1: "hsl(var(--background))",
              surface2: "hsl(var(--secondary))",
              surface3: "hsl(var(--border))",
              clickable: "hsl(var(--primary))",
              base: "hsl(var(--foreground))",
              disabled: "hsl(var(--muted-foreground))",
              hover: "hsl(var(--accent))",
              accent: "hsl(var(--ring))",
            },
            syntax: {
              plain: "hsl(var(--foreground))",
              keyword: "hsl(var(--primary))",
              punctuation: "hsl(var(--muted-foreground))",
            },
          }}
          files={files}
          customSetup={{
            dependencies: {
              "nuqs": '^2.8.0',
              'react-router-dom': '^6.20.0',
              'tailwind-merge': '^2.0.0',
              'lucide-react': '^0.475.0',
              '@radix-ui/react-slot': '^1.1.0',
              'class-variance-authority': '^0.7.1',
            },
          }}
          options={{
            externalResources: ['https://cdn.tailwindcss.com'],
            autorun: true,
            autoReload: true,
            recompileMode: 'immediate',
            recompileDelay: 300,
          }}
        >
          <CodeSync onCodeChange={setCode} />
          <SandpackLayout>
            <SandpackCodeEditor
              style={{ height: '600px', minHeight: '300px' }}
              showTabs={false}
              showLineNumbers
              showInlineErrors
              wrapContent
            />
            <SandpackPreview
              style={{ height: '600px', minHeight: '300px' }}
              showOpenInCodeSandbox={false}
              showRefreshButton
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  )
}