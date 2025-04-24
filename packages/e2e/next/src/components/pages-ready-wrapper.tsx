import { useRouter } from 'next/router'

export function withPagesReadyWrapper(Component: React.ComponentType) {
  return function PagesReadyWrapper(props: any) {
    const router = useRouter()
    if (!router?.isReady) {
      return null
    }
    return <Component {...props} />
  }
}
