import { CounterButton } from './components/counter-button'
import { SearchInput } from './components/search-input'

type AppProps = {
  router: string
}

export default function App({ router }: AppProps) {
  return (
    <>
      <h1>{router} + nuqs</h1>
      <div>
        <CounterButton />
        <SearchInput />
      </div>
    </>
  )
}
