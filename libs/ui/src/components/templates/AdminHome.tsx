'use client'
import { useMemo, useState } from 'react'
import { useTakeSkip } from '@autospace/util/hooks/pagination'
import { useQuery } from '@apollo/client'
import { GaragesDocument } from '@autospace/network/src/gql/generated'
import { ShowData } from '../organisms/ShowData'
import { GarageAdminCard } from '../organisms/GarageAdminCard'
import { CreateVerificationButton } from '../organisms/admin/CreateVerificationButton'
import { RemoveVerificationButton } from '../organisms/admin/RemoveVerificationButton'
import { IconSearch } from '@tabler/icons-react'

type VerificationFilter = 'all' | 'pending' | 'verified'

export const AdminHome = () => {
  return (
    <div className="py-8">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">
          Marketplace operations
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          Listings command centre
        </h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Review inventory, resolve verification work, and keep bookable spaces
          trustworthy.
        </p>
      </div>
      <ShowGarages />
    </div>
  )
}

export const ShowGarages = () => {
  const [query, setQuery] = useState('')
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>('all')
  const { setSkip, setTake, skip, take } = useTakeSkip()
  const { loading, data, error } = useQuery(GaragesDocument, {
    variables: { skip, take },
  })
  const garages = useMemo(() => data?.garages ?? [], [data?.garages])
  const verifiedCount = garages.filter(
    (garage) => garage.verification?.verified,
  ).length
  const pendingCount = garages.length - verifiedCount
  const spacesOnPage = garages.reduce(
    (total, garage) =>
      total +
      garage.slotCounts.reduce(
        (garageTotal, slotType) => garageTotal + slotType.count,
        0,
      ),
    0,
  )
  const filteredGarages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return garages.filter((garage) => {
      const verified = Boolean(garage.verification?.verified)
      const matchesStatus =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && verified) ||
        (verificationFilter === 'pending' && !verified)
      const matchesQuery =
        !normalizedQuery ||
        [garage.id, garage.displayName, garage.address?.address].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(normalizedQuery),
        )

      return matchesStatus && matchesQuery
    })
  }, [garages, query, verificationFilter])

  return (
    <>
      <section
        aria-label="Listing overview"
        className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          label="Total listings"
          value={data?.garagesCount.count ?? 0}
          detail="Across the marketplace"
        />
        <MetricCard
          label="Awaiting verification"
          value={pendingCount}
          detail="On this review page"
          attention={pendingCount > 0}
        />
        <MetricCard
          label="Verified"
          value={verifiedCount}
          detail="On this review page"
        />
        <MetricCard
          label="Parking spaces"
          value={spacesOnPage}
          detail="Across visible listings"
        />
      </section>

      <section
        aria-label="Listing queue filters"
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
      >
        <label className="relative block w-full lg:max-w-md">
          <span className="sr-only">Search listings</span>
          <IconSearch
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          />
          <input
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, address, or listing ID"
            type="search"
            value={query}
          />
        </label>

        <div
          aria-label="Filter listings by verification status"
          className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1"
          role="group"
        >
          {(['all', 'pending', 'verified'] as const).map((filter) => (
            <button
              aria-pressed={verificationFilter === filter}
              className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
                verificationFilter === filter
                  ? 'bg-white text-gray-950 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              key={filter}
              onClick={() => setVerificationFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <ShowData
        error={error?.message}
        title={`Listing review queue (${filteredGarages.length} shown)`}
        loading={loading}
        pagination={{
          resultCount: filteredGarages.length,
          totalCount: data?.garagesCount.count || 0,
          setSkip,
          setTake,
          skip,
          take,
        }}
      >
        {filteredGarages.map((garage) => (
          <GarageAdminCard key={garage.id} garage={garage}>
            <div className="flex justify-end">
              {!garage?.verification?.verified ? (
                <CreateVerificationButton garageId={garage.id} />
              ) : (
                <RemoveVerificationButton garageId={garage.id} />
              )}
            </div>
          </GarageAdminCard>
        ))}
      </ShowData>
    </>
  )
}

const MetricCard = ({
  label,
  value,
  detail,
  attention = false,
}: {
  label: string
  value: number
  detail: string
  attention?: boolean
}) => (
  <article
    className={`rounded-2xl border p-5 shadow-sm ${
      attention
        ? 'border-primary-200 bg-primary-25'
        : 'border-gray-100 bg-white'
    }`}
  >
    <p className="text-sm font-bold text-gray-500">{label}</p>
    <p className="mt-2 text-3xl font-black">{value.toLocaleString()}</p>
    <p className="mt-1 text-xs text-gray-500">{detail}</p>
  </article>
)
