'use server'

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * Apply a series of string replacements to the input code
 */
function applyReplacements(
  code: string,
  replacements: Array<[string | RegExp, string]>
): string {
  return replacements.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    code
  )
}

export async function getDemoCode(
  filePath: string,
  isDemoFile: boolean = true
): Promise<string> {
  // Use resolve with process.cwd() for ISR compatibility
  const fullPath = isDemoFile
    ? resolve(process.cwd(), 'src', 'app', 'playground', '(demos)', filePath)
    : resolve(process.cwd(), 'src', filePath)

  const code = await readFile(fullPath, 'utf8')

  // Skip transformations for CSS files
  if (filePath.endsWith('.css')) {
    return code
  }

  // Check if the file is in components/ui/ directory
  const isInComponentsUI = filePath.includes('/components/ui/')

  // Base transformations for JS/TS files
  const baseReplacements: Array<[RegExp | string, string]> = [
    [/^'use client'\s*\n?/m, ''],
    // For files in components/ui/, use './' for same-directory imports
    // For other files, use './components/ui/'
    isInComponentsUI
      ? [/from '@\/src\/components\/ui\//g, "from './"]
      : [/from '@\/src\/components\/ui\//g, "from './components/ui/"],
    [/from '@\/src\/lib\/utils'/g, "from '/utils'"],
    [/from "@\/src\/lib\/utils"/g, 'from "/utils"'],
    [/from '@\/src\/lib\//g, "from './lib/"],
    [/from '@\/src\/components\//g, "from './components/"],
  ]

  let transformedCode = applyReplacements(code, baseReplacements)

  // Apply demo-specific transformations only for demo files
  if (isDemoFile) {
    const demoReplacements: Array<[RegExp, string]> = [
      [/export default function \w+/g, 'export default function Demo'],
      [/export default function BuilderPatternDemoPage/g, 'export default function Demo'],
      [/export default function HexColorsDemo/g, 'export default function Demo'],
      [/export default function Client/g, 'export default function Demo'],
    ]

    transformedCode = applyReplacements(transformedCode, demoReplacements)
  }

  return transformedCode
}

export async function loadCodeSandboxDependencies() {
  const [button, input, card, utils] = await Promise.all([
    getDemoCode('components/ui/button.tsx', false),
    getDemoCode('components/ui/input.tsx', false),
    getDemoCode('components/ui/card.tsx', false),
    getDemoCode('lib/utils.ts', false),
  ])

  return {
    "/components/ui/button.tsx": button,
    "/components/ui/input.tsx": input,
    "/components/ui/card.tsx": card,
    "/utils.ts": utils,
  }
}

/**
 * Process global.css for CodeSandbox by removing imports and external dependencies
 * Returns CSS content suitable for injection into CodeSandbox preview
 */
export async function getCodeSandboxGlobalCSS(): Promise<string> {
  const cssPath = resolve(process.cwd(), 'src', 'app', 'globals.css')
  const cssContent = await readFile(cssPath, 'utf8')

  const cssReplacements: Array<[RegExp, string]> = [
    // Remove @import statements
    [/@import\s+['"]tailwindcss['"];?\s*/g, ''],
    [/@import\s+['"]fumadocs-ui\/css\/black\.css['"];?\s*/g, ''],
    [/@import\s+['"]fumadocs-ui\/css\/preset\.css['"];?\s*/g, ''],
    [/@import\s+['"]\.\/styles\/tweaks\.css['"];?\s*/g, ''],
    // Clean up multiple consecutive newlines
    [/\n{3,}/g, '\n\n'],
  ]

  const processedCSS = applyReplacements(cssContent, cssReplacements)

  return processedCSS.trim()
}

/**
 * Create a data URI for the processed CSS
 * Can be used directly in CodeSandbox's externalResources
 */
export async function getCodeSandboxGlobalCSSDataURI(): Promise<string> {
  const css = await getCodeSandboxGlobalCSS()
  return `data:text/css;charset=utf-8,${encodeURIComponent(css)}`
}

/**
 * Get all CodeSandbox files including processed global CSS
 */
export async function loadCodeSandboxFiles() {
  const [dependencies, globalCSS] = await Promise.all([
    loadCodeSandboxDependencies(),
    getCodeSandboxGlobalCSS()
  ])

  return {
    ...Object.fromEntries(
      Object.entries(dependencies).map(([path, code]) => [path, { code }])
    ),
    "/globals.css": { code: globalCSS },
  }
}