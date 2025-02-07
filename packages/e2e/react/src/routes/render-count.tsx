import { RenderCount } from 'e2e-shared/specs/render-count'
import { loadParams } from 'e2e-shared/specs/render-count.params'
import { useMemo } from 'react'

export default function Page() {
  const params = useMemo(() => {
    const [_, hook, shallow, history, startTransition] =
      location.pathname.split('/')
    return loadParams({ hook, shallow, history, startTransition })
  }, [])
  return <RenderCount {...params} />
}
