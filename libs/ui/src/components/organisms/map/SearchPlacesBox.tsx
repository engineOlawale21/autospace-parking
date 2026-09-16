import { LocationInfo, ViewState } from '@autospace/util/types'
import { useMap } from 'react-map-gl'
import { Autocomplete } from '../../atoms/Autocomplete'
import { useSearchLocation } from '@autospace/util/hooks/location'
import { majorCitiesLocationInfo } from '@autospace/util/constants'
import { useEffect, useRef } from 'react'

export const SearchPlaceBox = ({
  onLocationChange,
  onSearchTextChange,
  initialSearchText = '',
}: {
  onLocationChange?: (location: ViewState) => void
  onSearchTextChange?: (value: string) => void
  initialSearchText?: string
}) => {
  const { current: map } = useMap()
  const { loading, locationInfo, searchText, setSearchText } =
    useSearchLocation(initialSearchText)
  const hasAppliedInitialLocation = useRef(false)

  useEffect(() => {
    const firstResult = locationInfo[0]

    if (
      !initialSearchText ||
      hasAppliedInitialLocation.current ||
      !firstResult ||
      !map
    ) {
      return
    }

    hasAppliedInitialLocation.current = true
    const [latitude, longitude] = firstResult.latLng
    void map.flyTo({ center: { lat: latitude, lng: longitude }, zoom: 12 })
    onLocationChange?.({ latitude, longitude })
  }, [initialSearchText, locationInfo, map, onLocationChange])

  return (
    <Autocomplete<LocationInfo>
      inputValue={searchText}
      options={locationInfo?.length ? locationInfo : majorCitiesLocationInfo}
      isOptionEqualToValue={(option, value) =>
        option.placeName === value.placeName
      }
      noOptionsText={searchText ? 'No options.' : 'Type something...'}
      getOptionLabel={(x) => x.placeName}
      onInputChange={(_, v) => {
        setSearchText(v)
        onSearchTextChange?.(v)
      }}
      loading={loading}
      onChange={async (_, v) => {
        if (v) {
          const { latLng, placeName } = v
          await map?.flyTo({
            center: { lat: latLng[0], lng: latLng[1] },
            zoom: 12,
            // essential: true,
          })
          if (onLocationChange) {
            onLocationChange({ latitude: latLng[0], longitude: latLng[1] })
          }
        }
      }}
    />
  )
}
