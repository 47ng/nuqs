import { NativeArray } from 'e2e-shared/specs/native-array'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <NativeArray />
    </Suspense>
  )
}
