import { Repro1358RouteA } from 'e2e-shared/specs/repro-1358'

export default function Page() {
  return <Repro1358RouteA otherPageHref="/dynamic/repro-1358/b" />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
