import { GaragesQuery } from '@autospace/network/src/gql/generated'
import { ReactNode } from 'react'
import { MapLink } from '../molecules/MapLink'
import { IconTypes } from '../molecules/IconTypes'

export const GarageAdminCard = ({
  children,
  garage,
}: {
  children: ReactNode
  garage: GaragesQuery['garages'][0]
}) => {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-semibold text-gray-400">#{garage.id}</p>
      <div className="flex items-start gap-2">
        <h2 className="mb-1 font-semibold">{garage.displayName}</h2>
        <div>
          {garage.verification?.verified ? (
            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-800">
              Verified
            </span>
          ) : (
            <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-800">
              Pending
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {garage.address ? (
          <MapLink
            waypoints={[garage.address]}
            className="hover:underline underline-offset-4"
          >
            <p className="text-xs text-gray-700 ">{garage.address?.address}</p>
          </MapLink>
        ) : null}
      </div>
      <div className="mt-2 mb-4 flex gap-3 ">
        {garage.slotCounts.length === 0 ? (
          <div className="text-sm ">No slots.</div>
        ) : null}
        {garage.slotCounts.map((slot, index) => (
          <div key={index} className="py-2 flex gap-1 ">
            {IconTypes[slot.type]}
            <span className="text-gray-500">{slot.count}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto">{children}</div>
    </article>
  )
}
