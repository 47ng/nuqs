import { getGithubLastEdit } from 'fumadocs-core/content/github'

export async function getLastModified(
  path: string,
  branch = 'master'
): Promise<Date> {
  try {
    const lastEdit = await getGithubLastEdit({
      owner: '47ng',
      repo: 'nuqs',
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
