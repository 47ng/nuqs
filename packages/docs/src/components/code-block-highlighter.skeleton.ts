export function renderCodeSkeleton(code: string) {
  return `<pre><code>${code
    .split('\n')
    .map(line => `<span class="line">${line}</span>`)
    .join('')}</code></pre>`
}
