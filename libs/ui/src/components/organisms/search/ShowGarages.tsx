import { useLazyQuery } from '@apollo/client'
import { SearchGaragesDocument } from '@autospace/network/src/gql/generated'
import { useEffect } from 'react'
import { GarageMarker } from './GarageMarker'
import { useConvertSearchFormToVariables } from '@autospace/forms/src/adapters/searchFormAdapter'
import { Panel } from '../map/Panel'
import { Loader } from '../../molecules/Loader'
import { IconInfoCircle } from '@tabler/icons-react'
import { SearchGarageCard } from './SearchGarageCard'

export const ShowGarages = () => {
  const { variables, debouncing } = useConvertSearchFormToVariables()

  const [
    searchGarages,
    { loading: garagesLoading, data, previousData, error },
  ] = useLazyQuery(SearchGaragesDocument)

  useEffect(() => {
    if (variables) {
      searchGarages({ variables })
    }
  }, [searchGarages, variables])

  const garages = data?.searchGarages || previousData?.searchGarages || []
  const loading = debouncing || garagesLoading

  if (error) {
    return (
      <Panel
        position="center-center"
        className="bg-white/50 shadow border-white border backdrop-blur-sm"
      >
        <div className="flex items-center justify-center gap-2 ">
          <IconInfoCircle /> <div>{error.message}</div>
        </div>
      </Panel>
    )
  }
  if (!loading && garages.length === 0) {
    return (
      <Panel
        position="center-center"
        className="bg-white/50 shadow border-white border backdrop-blur-sm"
      >
        <div className="flex items-center justify-center gap-2 ">
          <IconInfoCircle /> <div>No parking slots found in this area.</div>
        </div>
      </Panel>
    )
  }

  return (
    <>
      {loading ? (
        <Panel position="center-bottom">
          <Loader />
        </Panel>
      ) : null}
      {garages.map((garage) => (
        <GarageMarker key={garage.id} marker={garage} />
      ))}
      <Panel
        position="left-bottom"
        className="bottom-2 top-56 w-full max-w-md overflow-y-auto sm:w-[25rem]"
      >
        <div className="mb-2 flex w-full items-center justify-between rounded-xl bg-white/95 px-4 py-3 shadow backdrop-blur">
          <div>
            <p className="font-black">
              {loading ? 'Searching…' : `${garages.length} nearby results`}
            </p>
            <p className="text-xs text-gray-500">
              Prices are confirmed before checkout
            </p>
          </div>
        </div>
        <div className="grid w-full gap-3 pb-2">
          {garages.map((garage) => (
            <SearchGarageCard key={`card-${garage.id}`} garage={garage} />
          ))}
        </div>
      </Panel>
    </>
  )
}
