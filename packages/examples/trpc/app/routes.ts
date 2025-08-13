import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  // prettier-ignore
  route('/api/trpc/*', 'routes/api/trpc.ts'),
  route('/', './routes/index.tsx')
] satisfies RouteConfig
