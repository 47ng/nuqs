import { Display } from 'e2e-shared/components/display'
import { useQueryState } from 'nuqs'

export default function Page() {
  const [test] = useQueryState('test')
  const [, setOther] = useQueryState('other')
  return (
    <>
      <button onClick={() => setOther('x')}>Test</button>
      <Display environment="client" state={test} />
    </>
  )
}
