import { useQueryState } from 'nuqs'
import { useLink } from '../../components/link'

export function FogOfWarStartPage({ resultHref }: { resultHref: string }) {
  const [, setState] = useQueryState('test')
  // const [, setState] = useState('init')
  const Link = useLink()
  return (
    <>
      <button id="set" onClick={() => setState('pass')}>
        Set
      </button>
      <Link id="navigate" href={resultHref}>
        Navigate
      </Link>
    </>
  )
}

export function FogOfWarResultPage() {
  return <div id="result">pass</div>
}
