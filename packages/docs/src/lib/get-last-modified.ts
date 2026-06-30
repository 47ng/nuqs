import { getGithubLastEdit } from 'fumadocs-core/content/github'
import { github } from './utils'

export async function getLastModified(
  path: string,
  branch = github.branch
): Promise<Date> {
  try {
    const lastEdit = await getGithubLastEdit({
      owner: github.owner,
      repo: github.repo,
      path: `packages/docs${path}`,
      sha: branch,
      token: `Bearer ${process.env.GITHUB_TOKEN}`
    })
    return lastEdit ?? new Date()
  } catch (error) {
    console.error(`Error fetching last modification date for ${path}:`, error)
    return new Date()
  }
}
