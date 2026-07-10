import { afterEach, describe, expect, it, vi } from 'vitest'

describe('queue reset mutex across duplicate library copies', () => {
  afterEach(async () => {
    const { setQueueResetMutex } = await import('./reset')
    setQueueResetMutex(0)
  })

  it('suppresses resets spun from another copy', async () => {
    const copyA = await import('./reset')
    vi.resetModules()
    const copyB = await import('./reset')
    expect(copyB.spinQueueResetMutex).not.toBe(copyA.spinQueueResetMutex)
    const onReset = vi.fn()
    copyA.setQueueResetMutex(2)
    copyB.spinQueueResetMutex(onReset)
    expect(onReset).not.toHaveBeenCalled()
    copyB.spinQueueResetMutex(onReset)
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
