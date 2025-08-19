import { useQueryState } from 'nuqs'

type Repro839Props = {
  useNavigate: () => (url: string, options: { state: unknown }) => void
  useLocation: () => { state: unknown }
}

export function Repro839({ useNavigate, useLocation }: Repro839Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [, setShallow] = useQueryState('shallow', {
    shallow: true
  })
  const [, setDeep] = useQueryState('deep', {
    shallow: false
  })
  return (
    <>
      <button
        id="setup"
        onClick={() => navigate('.', { state: { test: 'pass' } })}
      >
        Setup
      </button>
      <button id="shallow" onClick={() => setShallow('pass')}>
        Test shallow
      </button>
      <button id="deep" onClick={() => setDeep('pass')}>
        Test deep
      </button>
      <pre id="state">{JSON.stringify(location.state)}</pre>
    </>
  )
}
