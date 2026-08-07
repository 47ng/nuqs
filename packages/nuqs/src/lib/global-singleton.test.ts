import { afterEach, describe, expect, it } from 'vitest'
import { globalSingleton, globalWeakSingleton } from './global-singleton'
import { version } from './version'

const registry = globalThis as { [key: symbol]: unknown }
const usedScopes: string[] = []

function testScope(name: string): string {
  usedScopes.push(name)
  return name
}

afterEach(() => {
  for (const scope of usedScopes.splice(0)) {
    delete registry[Symbol.for(`nuqs.${version}.${scope}`)]
  }
})

describe('globalSingleton', () => {
  it('creates the instance once and reuses it', () => {
    const scope = testScope('singleton-memo')
    let creations = 0
    const create = () => {
      creations++
      return { creations }
    }
    const first = globalSingleton(scope, create)
    const second = globalSingleton(scope, create)
    expect(second).toBe(first)
    expect(creations).toBe(1)
  })

  it('isolates instances across scopes', () => {
    const scopeA = testScope('singleton-scope-a')
    const scopeB = testScope('singleton-scope-b')
    expect(globalSingleton(scopeA, () => ({}))).not.toBe(
      globalSingleton(scopeB, () => ({}))
    )
  })

  it('stores instances under a version-keyed global symbol', () => {
    const scope = testScope('singleton-key-format')
    const instance = globalSingleton(scope, () => ({}))
    expect(registry[Symbol.for(`nuqs.${version}.${scope}`)]).toBe(instance)
  })
})

describe('globalWeakSingleton', () => {
  it('creates the instance once per key identity', () => {
    const scope = testScope('weak-memo')
    const key = new (class KeyA {})()
    const first = globalWeakSingleton(scope, key, () => ({}))
    const second = globalWeakSingleton(scope, key, () => ({}))
    expect(second).toBe(first)
  })

  it('isolates instances across key identities', () => {
    const scope = testScope('weak-isolation')
    const keyA = new (class KeyA {})()
    const keyB = new (class KeyB {})()
    expect(globalWeakSingleton(scope, keyA, () => ({}))).not.toBe(
      globalWeakSingleton(scope, keyB, () => ({}))
    )
  })
})
