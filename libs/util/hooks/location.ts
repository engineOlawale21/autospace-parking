import { useEffect, useState } from 'react'
import { LocationInfo } from '../types'
import { useDebounce } from './async'

type MapboxFeature = {
  place_name?: string
  center?: [number, number]
}

type MapboxGeocodingResponse = {
  features?: MapboxFeature[]
}

export const useSearchLocation = (initialSearchText = '') => {
  const [searchText, setSearchText] = useState(initialSearchText)
  const [loading, setLoading] = useState(false)
  const [locationInfo, setLocationInfo] = useState<LocationInfo[]>(() => [])

  const [debouncedSearchText] = useDebounce(searchText, 400)

  useEffect(() => {
    if (!debouncedSearchText.trim()) {
      setLocationInfo([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setLocationInfo([])
      setLoading(false)
      return
    }

    setLoading(true)

    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        debouncedSearchText,
      )}.json?fuzzyMatch=true&access_token=${token}`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) throw new Error('Location search failed')
        return response.json() as Promise<MapboxGeocodingResponse>
      })
      .then((data) => {
        const filtered = data.features?.flatMap((feature) => {
          if (!feature.place_name || !feature.center) return []

          return [
            {
              placeName: feature.place_name,
              latLng: [feature.center[1], feature.center[0]] as [
                number,
                number,
              ],
            },
          ]
        })

        setLocationInfo(filtered ?? [])
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          setLocationInfo([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedSearchText])
  return { loading, searchText, setSearchText, locationInfo }
}
