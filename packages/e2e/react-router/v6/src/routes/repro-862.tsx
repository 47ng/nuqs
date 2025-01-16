import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useNavigate } from 'react-router-dom'

type Repro862Props = {
  targetPath: string
}

export function Repro862UseQueryState({ targetPath }: Repro862Props) {
  const navigate = useNavigate()
  const [state, setState] = useQueryState('test')
  return (
    <>
      <button id="setup" onClick={() => setState('pass')}>
        Setup
      </button>
      <button id="navigate-clear" onClick={() => navigate(targetPath)}>
        Navigate to {targetPath}
      </button>
      <button
        id="navigate-persist"
        onClick={() => navigate(targetPath + '?test=pass')}
      >
        Navigate to {targetPath + '?test=pass'}
      </button>
      <pre id="state">{state}</pre>
    </>
  )
}

export function Repro862UseQueryStates({ targetPath }: Repro862Props) {
  const navigate = useNavigate()
  const [{ state }, setState] = useQueryStates(
    {
      state: parseAsString
    },
    { urlKeys: { state: 'test' } }
  )
  return (
    <>
      <button id="setup" onClick={() => setState({ state: 'pass' })}>
        Setup
      </button>
      <button id="navigate-clear" onClick={() => navigate(targetPath)}>
        Navigate to {targetPath}
      </button>
      <button
        id="navigate-persist"
        onClick={() => navigate(targetPath + '?test=pass')}
      >
        Navigate to {targetPath + '?test=pass'}
      </button>
      <pre id="state">{state}</pre>
    </>
  )
}
