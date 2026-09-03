import { version } from './version'

type GlobalRegistry = {
  [key: symbol]: unknown
}

const fallbackRegistry: GlobalRegistry = {}

/**
 * Store a module-level singleton on globalThis, keyed by library version,
 * so that duplicate copies of the library loaded side by side (e.g. in
 * monorepos, see issue #798) share the same instance instead of each
 * creating their own. Copies of different versions deliberately keep
 * separate instances, as internal state shapes may differ across versions.
 */
export function globalSingleton<T>(scope: string, create: () => T): T {
  const key = Symbol.for(`nuqs.${version}.${scope}`)
  const registry = globalThis as GlobalRegistry
  const target =
    registry[key] != null || Object.isExtensible(registry)
      ? registry
      : fallbackRegistry
  return (target[key] ??= create()) as T
}

/**
 * Like globalSingleton, but additionally keyed by the identity of a
 * runtime object, for singletons that must not be shared across distinct
 * runtimes (e.g. one React context per React instance).
 */
export function globalWeakSingleton<T>(
  scope: string,
  key: WeakKey,
  create: () => T
): T {
  const instances = globalSingleton(
    scope,
    () => new WeakMap<WeakKey, unknown>()
  )
  if (!instances.has(key)) {
    instances.set(key, create())
  }
  return instances.get(key) as T
}
