// https://github.com/47ng/nuqs/issues/359

'use client'

import {
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates
} from 'nuqs'
import { useLink } from '../components/link'

const paramParser = parseAsString.withDefault('null')
const components = ['comp1', 'comp2'] as const
const componentParser = parseAsStringLiteral(components)
const searchParams = {
  param: paramParser,
  component: componentParser
}
const href = createSerializer(searchParams)

const Component = (props: React.ComponentProps<'span'>) => {
  const [param] = useQueryState('param', paramParser)
  return <span {...props}>{param}</span>
}

export function Repro359() {
  const Link = useLink()
  const [param, setParam] = useQueryState('param', paramParser)
  const [component, seComponent] = useQueryState('component', componentParser)
  const [multiple, setMultiple] = useQueryStates(searchParams)
  return (
    <>
      <div>
        {component === 'comp1' && <Component id="comp1" />}
        {component === 'comp2' && <Component id="comp2" />}
      </div>
      <div>
        <span id="nuqs-param">{param}</span>
        <span id="nuqs-component">{component}</span>
        <span id="nuqss-param">{multiple.param}</span>
        <span id="nuqss-component">{multiple.component}</span>
      </div>
      <div>
        <button
          onClick={() => {
            setParam('comp1')
            seComponent('comp1')
          }}
        >
          Component 1 (nuqs)
        </button>
        <button
          onClick={() => {
            setParam('comp2')
            seComponent('comp2')
          }}
        >
          Component 2 (nuqs)
        </button>
        <br />
        <button
          onClick={() => {
            setMultiple({
              param: 'comp1',
              component: 'comp1'
            })
          }}
        >
          Component 1 (nuq+)
        </button>
        <button
          onClick={() => {
            setMultiple({
              param: 'comp2',
              component: 'comp2'
            })
          }}
        >
          Component 2 (nuq+)
        </button>
      </div>
      <nav>
        <Link href={href({ component: 'comp1', param: 'comp1' })}>Comp 1</Link>
        <Link href={href({ component: 'comp2', param: 'comp2' })}>Comp 2</Link>
      </nav>
    </>
  )
}
