import { useQuery } from '@tanstack/react-query'
import { useCoordinates } from '~/search-params'
import { useTRPC } from '~/utils/trpc'

export function InvertedCoordinates() {
  const { latitude, longitude } = useCoordinates()
  const tprc = useTRPC()
  const { data } = useQuery(
    tprc.invert.queryOptions({
      latitude,
      longitude
    })
  )
  return (
    <>
      <p>Inverted coordinates: (last updated at: {data?.time ?? null})</p>
      <pre>{JSON.stringify(data?.inverted, null, 2)}</pre>
    </>
  )
}
