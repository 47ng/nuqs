import { exec } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'

function grepFilesWithDynamicExport(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec(
      'grep -rl "export const dynamic = " .',
      { cwd: dir },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error executing grep: ${error.message}`))
          return
        }
        if (stderr) {
          reject(new Error(`Grep stderr: ${stderr}`))
          return
        }

        const files = stdout
          .split('\n')
          .filter(Boolean)
          .map(file => resolvePath(dir, file))
        resolve(files)
      }
    )
  })
}

async function commentDynamicExportInFile(filePath: string) {
  try {
    const content = await readFile(filePath, 'utf-8')
    const modifiedContent = content.replace(
      /export const dynamic = /g,
      '// export const dynamic = '
    )
    await writeFile(filePath, modifiedContent, 'utf-8')
    console.info(`Commented dynamic export in: ${filePath}`)
  } catch (error) {
    throw new Error(
      `Error commenting line in ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

async function main() {
  try {
    const sourceDir = resolvePath(import.meta.dirname, '../src')
    const files = await grepFilesWithDynamicExport(sourceDir)
    console.table(files)
    for (const file of files) {
      await commentDynamicExportInFile(file)
    }
  } catch (error) {
    console.error(error)
  }
}

main()
