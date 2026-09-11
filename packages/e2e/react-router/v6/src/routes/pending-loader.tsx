import { PendingLoader } from 'e2e-shared/specs/react-router/pending-loader'
import { controlledLoader } from 'e2e-shared/specs/react-router/pending-loader.defs'
import { useBlocker, useLoaderData, useNavigation } from 'react-router-dom'

export const loader = controlledLoader

export default function Page() {
  const data = useLoaderData() as Awaited<ReturnType<typeof loader>>
  const navigation = useNavigation()
  return (
    <PendingLoader
      data={data}
      navigationState={navigation.state}
      useBlocker={useBlocker}
    />
  )
}
