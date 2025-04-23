import {
  createLoader,
  createStandardSchemaV1,
  parseAsFloat,
  useQueryStates,
  type UrlKeys
} from 'nuqs'

export const coordinates = {
  latitude: parseAsFloat.withDefault(45),
  longitude: parseAsFloat.withDefault(5)
}
export const coordinatesUrlKeys: UrlKeys<typeof coordinates> = {
  latitude: 'lat',
  longitude: 'lng'
}

export const loadCoordinates = createLoader(coordinates, {
  urlKeys: coordinatesUrlKeys
})
export const validateCoordinates = createStandardSchemaV1(coordinates, {
  urlKeys: coordinatesUrlKeys
})

export function useCoordinates() {
  const [{ latitude, longitude }, setCoordinates] = useQueryStates(
    coordinates,
    {
      urlKeys: coordinatesUrlKeys
    }
  )
  return {
    latitude,
    longitude,
    setCoordinates
  }
}
