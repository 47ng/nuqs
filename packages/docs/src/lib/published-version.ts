const NPM_REGISTRY_URL = 'https://registry.npmjs.org/nuqs'

/**
 * The latest GA version of nuqs published on npm.
 *
 * Resolved once at build (`force-cache`, no time-based revalidation) and frozen
 * into the statically generated output, so the docs reveal newly-released
 * content only on the next deployment. Throws on a registry failure to fail the
 * build loudly — leaving the current deployment up — rather than ship a docs
 * site gated against a wrong version.
 */
export async function getPublishedVersion(): Promise<string> {
  const response = await fetch(NPM_REGISTRY_URL, { cache: 'force-cache' })
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
