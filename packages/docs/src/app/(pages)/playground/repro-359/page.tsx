// https://github.com/47ng/nuqs/issues/359

'use client'

import {
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates
} from 'nuqs'

const Component1 = () => {
  const [param] = useQueryState('param', parseAsString)
  console.dir({ _: 'Component1.render', param })
  return param ? param : 'null'
}

const Component2 = () => {
  const [param] = useQueryState('param', parseAsString)
  console.dir({ _: 'Component2.render', param })
  return param ? param : 'null'
}

enum TargetComponent {
  Comp1 = 'comp1',
  Comp2 = 'comp2'
}

export default function Home() {
  const [_param, setParam] = useQueryState('param', parseAsString)
  const [component, seComponent] = useQueryState(
    'component',
    parseAsStringEnum(Object.values(TargetComponent))
  )
  const [multiple, setMultiple] = useQueryStates({
    param: parseAsString,
    component: parseAsStringEnum(Object.values(TargetComponent))
  })
  console.dir({ _: 'Home.render', _param, component, multiple })
  return (
    <>
      <h1>
        Repro for issue{' '}
        <a href="https://github.com/47ng/nuqs/issues/359">#359</a>
      </h1>
      <div className="border p-5">
        {component === TargetComponent.Comp1 ? <Component1 /> : null}
        {component === TargetComponent.Comp2 ? <Component2 /> : null}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            setParam('Component1')
            seComponent(TargetComponent.Comp1)
          }}
          className="border p-2"
        >
          Component 1 (nuqs)
        </button>
        <button
          onClick={() => {
            console.log('aaa')
            setParam('Component2')
            seComponent(TargetComponent.Comp2)
          }}
          className="border p-2"
        >
          Component 2 (nuqs)
        </button>
        <br />
        <button
          onClick={() => {
            setMultiple({
              param: 'Component1',
              component: TargetComponent.Comp1
            })
          }}
          className="border p-2"
        >
          Component 1 (nuq+)
        </button>
        <button
          onClick={() => {
            setMultiple({
              param: 'Component2',
              component: TargetComponent.Comp2
            })
          }}
          className="border p-2"
        >
          Component 2 (nuq+)
        </button>
      </div>
      <p>
        <a href="https://github.com/47ng/nuqs/tree/next/packages/docs/src/app/(pages)/playground/repro-359/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
