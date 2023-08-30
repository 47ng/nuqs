import type { Router } from 'next/router'

// Next.js does not export the TransitionsOption interface,
// but we can get it from where it's used:
export type TransitionOptions = Parameters<Router['push']>[2]
