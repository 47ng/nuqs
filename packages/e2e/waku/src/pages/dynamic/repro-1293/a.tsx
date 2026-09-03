import { Repro1293PageA } from 'e2e-shared/specs/repro-1293'

export default function Page() {
  return <Repro1293PageA linkHref="/dynamic/repro-1293/b" />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
