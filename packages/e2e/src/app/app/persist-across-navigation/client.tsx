import {
  createSerializer,
  parseAsBoolean,
  parseAsString,
  useQueryStates
} from 'nuqs'

type Page = 'a' | 'b'

type ClientProps = {
  page: Page
  target: Page
}

const searchParams = {
  q: parseAsString.withDefault(''),
  checked: parseAsBoolean.withDefault(false)
}
const serialize = createSerializer(searchParams)

export function Client({ page, target }: ClientProps) {
  const [{ q, checked }, setParams] = useQueryStates(searchParams)
  const href = serialize(`/app/persist-across-navigation/${target}`, {
    q,
    checked
  })
  return (
    <>
      <h1>Page {page}</h1>
      <input
        type="text"
        value={q}
        onChange={e => setParams({ q: e.target.value })}
      />
      <input
        type="checkbox"
        checked={checked}
        onChange={e => setParams({ checked: e.target.checked })}
      />
      <a href={href}>Go to page {target}</a>
    </>
  )
}
