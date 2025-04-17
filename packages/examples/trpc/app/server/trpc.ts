import { initTRPC } from '@trpc/server'
import { validateCoordinates } from '~/search-params.ts'

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create()

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router
export const publicProcedure = t.procedure

export const appRouter = router({
  invert: publicProcedure.input(validateCoordinates).query(async options => {
    const { latitude, longitude } = options.input
    const inverted = {
      latitude: latitude * -1,
      longitude: longitude * -1
    }
    return {
      time: new Date().toISOString(),
      inverted
    }
  })
})

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
