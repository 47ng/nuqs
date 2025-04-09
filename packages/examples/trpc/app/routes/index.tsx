import { InvertedCoordinates } from '~/components/inverted-coordinates'
import { RandomCoordinates } from '~/components/random-coordinates'

export default function Page() {
  return (
    <>
      <RandomCoordinates />
      <hr />
      <InvertedCoordinates />
    </>
  )
}
