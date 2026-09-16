'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchPage } from '@autospace/ui/src/components/templates/SearchPage'
import {
  FormProviderSearchGarage,
  searchProductModes,
} from '@autospace/forms/src/searchGarages'
import type { FormTypeSearchGarage } from '@autospace/forms/src/searchGarages'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <SearchWithParameters />
    </Suspense>
  )
}

const isSearchMode = (
  value: string | null,
): value is FormTypeSearchGarage['productMode'] =>
  searchProductModes.some((mode) => mode === value)

function SearchWithParameters() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const initialValues: Partial<FormTypeSearchGarage> = {
    destination: searchParams.get('destination') ?? '',
    productMode: isSearchMode(mode) ? mode : 'hourly-daily',
  }
  const arrival = searchParams.get('arrival')
  const departure = searchParams.get('departure')

  if (arrival) initialValues.startTime = arrival
  if (departure) initialValues.endTime = departure

  return (
    <FormProviderSearchGarage initialValues={initialValues}>
      <SearchPage />
    </FormProviderSearchGarage>
  )
}
