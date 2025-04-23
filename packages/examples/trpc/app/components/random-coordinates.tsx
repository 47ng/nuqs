import { useCoordinates } from '~/search-params'

export function RandomCoordinates() {
  const { latitude, longitude, setCoordinates } = useCoordinates()
  return (
    <div>
      <button
        onClick={() =>
          setCoordinates({
            latitude: Math.random() * 90,
            longitude: Math.random() * 180
          })
        }
      >
        Set random coordinates
      </button>
      <pre>{JSON.stringify({ latitude, longitude }, null, 2)}</pre>
    </div>
  )
}
