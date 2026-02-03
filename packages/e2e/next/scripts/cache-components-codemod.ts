import { exec } from 'node:child_process'
import { resolve } from 'node:path'

function grepFilesWithDynamicExport(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec(
      `grep -rl "export const dynamic = " ${dir}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error executing grep: ${error.message}`))
          return
        }
        if (stderr) {
          reject(new Error(`Grep stderr: ${stderr}`))
          return
        }

        const files = stdout.split('\n').filter(Boolean)
        resolve(files)
      }
    )
  })
}

function commentDynamicExportInFile(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    exec(
      `sed -i '' 's/export const dynamic = /\\/\\/ export const dynamic = /' "${filePath}"`,
      (error, _stdout, stderr) => {
        if (error) {
          reject(
            new Error(`Error commenting line in ${filePath}: ${error.message}`)
          )
          return
        }
        if (stderr) {
          reject(new Error(`sed error for ${filePath}: ${stderr}`))
          return
        }
        console.info(`Commented dynamic export in: ${filePath}`)
        resolve()
      }
    )
  })
}

async function main() {
  try {
    const sourceDir = resolve(import.meta.dirname, '../src')
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
