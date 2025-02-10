import type { LimitUrlUpdates } from '../../defs'

// edit: Safari 17 now allows 100 calls per 10 seconds, a bit better.
function getDefaultThrottle() {
  if (typeof window === 'undefined') return 50
  // https://stackoverflow.com/questions/7944460/detect-safari-browser
  // @ts-expect-error
  const isSafari = Boolean(window.GestureEvent)
  if (!isSafari) {
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

export const defaultRateLimit = throttle(getDefaultThrottle())
