'use client'
import { useCallback } from 'react'
import { Map } from '../organisms/map/Map'
import { Panel } from '../organisms/map/Panel'
import { DefaultZoomControls } from '../organisms/map/ZoomControls'
import { ViewStateChangeEvent } from 'react-map-gl'
import { initialViewState } from '@autospace/util/constants'
import { SearchPlaceBox } from '../organisms/map/SearchPlacesBox'
import { useFormContext } from 'react-hook-form'
import { FormTypeSearchGarage } from '@autospace/forms/src/searchGarages'
import { IconType } from '../molecules/IconTypes'
import { IconArrowDown } from '@tabler/icons-react'
import { HtmlInput } from '../atoms/HtmlInput'
import { toLocalISOString } from '@autospace/util/date'
import { ShowGarages } from '../organisms/search/ShowGarages'
import { FilterSidebar } from '../organisms/search/FilterSidebar'

const searchModes = [
  { value: 'hourly-daily', label: 'Hourly & daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'airport', label: 'Airport' },
] as const

export const SearchPage = () => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useFormContext<FormTypeSearchGarage>()
  const formData = watch()

  const handleMapChange = useCallback(
    (target: ViewStateChangeEvent['target']) => {
      const bounds = target.getBounds()
      const locationFilter = {
        ne_lat: bounds?.getNorthEast().lat || 0,
        ne_lng: bounds?.getNorthEast().lng || 0,
        sw_lat: bounds?.getSouthWest().lat || 0,
        sw_lng: bounds?.getSouthWest().lng || 0,
      }
      setValue('locationFilter', locationFilter)
    },
    [setValue],
  )

  return (
    <Map
      onLoad={(e) => handleMapChange(e.target)}
      onDragEnd={(e) => handleMapChange(e.target)}
      onZoomEnd={(e) => handleMapChange(e.target)}
      initialViewState={initialViewState}
    >
      <ShowGarages />
      <Panel position="left-top">
        <div className="flex w-[calc(100vw-1rem)] max-w-md flex-col items-stretch rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur sm:w-[25rem]">
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
            {searchModes.map((mode) => (
              <button
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                  formData.productMode === mode.value
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                key={mode.value}
                onClick={() => setValue('productMode', mode.value)}
                type="button"
              >
                {mode.label}
              </button>
            ))}
          </div>
          <SearchPlaceBox
            initialSearchText={formData.destination}
            onSearchTextChange={(destination) =>
              setValue('destination', destination)
            }
          />
          <div className="relative mt-2 flex flex-col items-center gap-1 rounded-xl bg-gray-25 pl-1">
            <div className=" absolute left-[1px] top-1/2 -translate-y-1/2 ">
              <IconArrowDown className="p-1" />
            </div>
            <div className="flex gap-1 items-center">
              <IconType time={formData.startTime} />
              <HtmlInput
                type="datetime-local"
                className="w-full border-0 bg-transparent p-2 text-sm font-medium"
                min={toLocalISOString(new Date()).slice(0, 16)}
                {...register('startTime', {
                  onChange(event) {
                    trigger('startTime')
                    trigger('endTime')
                  },
                })}
              />
            </div>
            <div className="flex gap-1 items-center">
              <IconType time={formData.endTime} />
              <HtmlInput
                min={toLocalISOString(new Date()).slice(0, 16)}
                type="datetime-local"
                className="w-full border-0 bg-transparent p-2 text-sm font-medium"
                {...register('endTime', {
                  onChange(event) {
                    trigger('endTime')
                  },
                })}
              />
            </div>
          </div>
        </div>
      </Panel>
      <Panel position="right-center">
        <DefaultZoomControls />
      </Panel>
      {errors ? (
        <Panel position="center-bottom">
          {Object.entries(errors).map(([key, value]) => {
            return (
              <div className="text-red-800 p-2 shadow bg-white" key={key}>
                {key}: {value.message}
              </div>
            )
          })}
        </Panel>
      ) : null}
      <Panel position="right-top">
        <div className="rounded-xl bg-white/95 shadow backdrop-blur">
          <FilterSidebar />
        </div>
      </Panel>
    </Map>
  )
}
