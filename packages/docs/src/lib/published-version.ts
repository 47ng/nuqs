const NPM_REGISTRY_URL = 'https://registry.npmjs.org/nuqs'

/**
 * The latest GA version of nuqs published on npm.
 *
 * Cached indefinitely (`force-cache`, no TTL) under the `npm-version` tag in the
 * Data Cache, which persists across deployments. The version gate compares
 * against this value, so a release reveals its newly-published (already-deployed
 * but gated) content by busting the `npm-version` tag from release-finalize.yml
 * — not by waiting for a redeploy. Throws on a registry failure rather than
 * serve docs gated against a wrong version: at build it fails loudly (leaving
 * the current deployment up); during on-demand regeneration after a bust, Next
 * keeps serving the last good page.
 */
export async function getPublishedVersion(): Promise<string> {
  const response = await fetch(NPM_REGISTRY_URL, {
    cache: 'force-cache',
    next: { tags: ['npm-version'] }
  })
  if (!response.ok) {
    throw new Error(
      `Failed to resolve the latest nuqs version from npm (${response.status} ${response.statusText})`
    )
  }
  const { 'dist-tags': distTags } = (await response.json()) as {
    'dist-tags'?: { latest?: string }
  }
  if (!distTags?.latest) {
    throw new Error('npm registry response is missing dist-tags.latest for nuqs')
  }
  return distTags.latest
}

/**
 * Whether a feature introduced in `version` has shipped to the published GA.
 * Pure and environment-agnostic — the production-truth check, used by both
 * `isPublished` and the preview affordance.
 */
export function isReleased(version: string, published: string): boolean {
  return compareVersions(version, published) <= 0
}

/**
 * Whether content introduced in `version` should be visible.
 *
 * Preview & local deployments show everything (`VERCEL_ENV` is a Vercel system
 * variable, available at both build and runtime); production gates on the
 * published GA version.
 */
export function isPublished(version: string, published: string): boolean {
  if (process.env.VERCEL_ENV !== 'production') {
    return true
  }
  return isReleased(version, published)
}

/**
 * Compares two GA semver strings (`major.minor.patch`), returning a negative
 * number when `a < b`, zero when equal, and a positive number when `a > b`.
 * Prerelease tags are ignored — betas never move the `latest` dist-tag.
 */
function compareVersions(a: string, b: string): number {
  const parse = (version: string) =>
    version.split('.').map(segment => parseInt(segment, 10) || 0)
  const left = parse(a)
  const right = parse(b)
  for (let i = 0; i < 3; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) {
      return diff
    }
  }
  return 0
}
