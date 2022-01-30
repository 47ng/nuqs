import { NextPage } from 'next'
import React from 'react'
import { useQueryState } from '../../../'

const IntegrationPage: NextPage = () => {
  const [state, setState] = useQueryState('key')
  return (
    <>
      <button onClick={() => setState('a')}>Set A</button>
      <button onClick={() => setState('b')}>Set B</button>
      <button onClick={() => setState(null)}>Clear</button>
      <p id="value">{state}</p>
    </>
  )
}

export default IntegrationPage
