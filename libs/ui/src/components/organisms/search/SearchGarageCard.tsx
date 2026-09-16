import { FormProviderBookSlot } from '@autospace/forms/src/bookSlot'
import { FormTypeSearchGarage } from '@autospace/forms/src/searchGarages'
import { SearchGaragesQuery } from '@autospace/network/src/gql/generated'
import { IconCar, IconMapPin, IconShieldCheck } from '@tabler/icons-react'
import { useState } from 'react'
import { useWatch } from 'react-hook-form'
import { Dialog } from '../../atoms/Dialog'
import { AutoImageChanger } from '../AutoImageChanger'
import { BookSlotPopup } from '../BookSlotPopup'

type Garage = SearchGaragesQuery['searchGarages'][number]

export const SearchGarageCard = ({ garage }: { garage: Garage }) => {
  const [bookingOpen, setBookingOpen] = useState(false)
  const { endTime, startTime } = useWatch<FormTypeSearchGarage>()
  const availableCount = garage.availableSlots.reduce(
    (total, group) => total + group.count,
    0,
  )
  const lowestPrice = garage.availableSlots.reduce<number | null>(
    (lowest, group) =>
      lowest === null || group.pricePerHour < lowest
        ? group.pricePerHour
        : lowest,
    null,
  )

  return (
    <>
      <Dialog
        title="Reserve this space"
        widthClassName="max-w-3xl"
        open={bookingOpen}
        setOpen={setBookingOpen}
      >
        <FormProviderBookSlot defaultValues={{ endTime, startTime }}>
          <BookSlotPopup garage={garage} />
        </FormProviderBookSlot>
      </Dialog>

      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-black/5">
        <div className="relative h-32 overflow-hidden bg-gray-100">
          {garage.images.length ? (
            <AutoImageChanger images={garage.images} durationPerImage={5000} />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <IconCar className="h-10 w-10" stroke={1.5} />
            </div>
          )}
          {garage.verification?.verified ? (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow">
              <IconShieldCheck className="h-4 w-4 text-green" /> Verified
            </span>
          ) : null}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-black">
                {garage.displayName || 'Parking space'}
              </h2>
              <p className="mt-1 flex items-start gap-1 text-xs text-gray-500">
                <IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">
                  {garage.address?.address || 'Address available after booking'}
                </span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-gray-500">from</p>
              <p className="text-lg font-black">
                {lowestPrice === null ? '—' : `$${lowestPrice.toFixed(2)}`}
              </p>
              <p className="text-[11px] text-gray-500">per hour</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-xs font-semibold text-gray-600">
              {availableCount} {availableCount === 1 ? 'space' : 'spaces'}{' '}
              available
            </span>
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              disabled={!availableCount}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-black text-black transition hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              View and book
            </button>
          </div>
        </div>
      </article>
    </>
  )
}
