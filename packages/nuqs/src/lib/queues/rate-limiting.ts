import type { LimitUrlUpdates } from '../../defs'

// 50ms between calls to the history API seems to satisfy Chrome and Firefox.
// Safari remains annoying with at most 100 calls in 30 seconds.
// edit: Safari 17 now allows 100 calls per 10 seconds, a bit better.
function getDefaultThrottle() {
  // https://stackoverflow.com/questions/7944460/detect-safari-browser
  // @ts-expect-error
  if (typeof window === 'undefined' || !window.GestureEvent) {
    return 50
  }
  try {
    const match = navigator.userAgent?.match(/version\/([\d\.]+) safari/i)
    return parseFloat(match![1]!) >= 17 ? 120 : 320
  } catch {
    return 320
  }
}

export function throttle(timeMs: number): LimitUrlUpdates {
  return { method: 'throttle', timeMs }
}

export function debounce(timeMs: number): LimitUrlUpdates {
  return { method: 'debounce', timeMs }
}

export const defaultRateLimit: LimitUrlUpdates = {
  method: 'throttle',
  timeMs: getDefaultThrottle()
}
