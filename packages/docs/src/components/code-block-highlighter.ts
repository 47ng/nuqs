import { rehypeCodeOptions } from '@/rehype-code.config'
import type { BundledLanguage } from 'shiki/bundle/web'
import { codeToHtml } from 'shiki/bundle/web'

export async function highlight(code: string, lang: BundledLanguage) {
  return await codeToHtml(code, { ...rehypeCodeOptions, lang })
}

export function renderCodeSkeleton(code: string) {
  return `<pre><code>${code
    .split('\n')
    .map(line => `<span class="line">${line}</span>`)
    .join('')}</code></pre>`
}
