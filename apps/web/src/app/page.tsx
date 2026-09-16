'use client'

import {
  IconArrowRight,
  IconCalendarEvent,
  IconCar,
  IconCheck,
  IconClock,
  IconMapPin,
  IconShieldCheck,
  IconSparkles,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'

const modes = [
  ['hourly-daily', 'Hourly / daily', 'Book from 30 minutes to several days.'],
  ['monthly', 'Monthly', 'Reserve a regular space with one monthly payment.'],
  ['airport', 'Airport', 'Compare airport spaces and transfer options.'],
] as const

const benefits = [
  [
    IconShieldCheck,
    'Space guaranteed',
    'Your confirmed space is held for the full booking window.',
  ],
  [
    IconSparkles,
    'Clear, upfront prices',
    'See the complete price before you reserve—without surprises.',
  ],
  [
    IconClock,
    'Manage it anywhere',
    'View instructions, manage bookings, and get support online.',
  ],
] as const

const popularPlaces = [
  'City centres',
  'Airports',
  'Train stations',
  'Stadiums',
  'Hospitals',
  'Universities',
]

const providerUrl =
  process.env.NEXT_PUBLIC_PROVIDER_URL ?? 'http://localhost:3002/new-garage'

export default function Home() {
  const [mode, setMode] = useState<(typeof modes)[number][0]>('hourly-daily')
  const activeMode = modes.find(([id]) => id === mode)!

  return (
    <main className="pb-20">
      <section className="relative isolate overflow-hidden bg-gray-900 px-4 py-12 text-white sm:px-8 sm:py-20 lg:rounded-b-[3rem] lg:px-16">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary opacity-90 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full border-[4rem] border-white/5"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              <IconCar className="h-5 w-5 text-primary" /> Parking that fits
              your journey
            </p>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              Park closer.
              <span className="block text-primary">Move easier.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-200">
              Find and reserve trusted parking for a few hours, a month, or your
              next flight—all from one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-100">
              {['Secure checkout', 'Flexible options', 'Trusted spaces'].map(
                (item) => (
                  <span key={item} className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-black">
                      <IconCheck className="h-3.5 w-3.5" stroke={3} />
                    </span>
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <form
            action="/search"
            className="rounded-3xl bg-white p-4 text-gray-900 shadow-2xl sm:p-6"
          >
            <fieldset>
              <legend className="sr-only">Parking type</legend>
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-25 p-1">
                {modes.map(([id, label]) => (
                  <label
                    key={id}
                    className={`cursor-pointer rounded-xl px-2 py-3 text-center text-xs font-bold transition sm:text-sm ${
                      mode === id
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="mode"
                      value={id}
                      checked={mode === id}
                      onChange={() => setMode(id)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="mt-4 text-sm text-gray-500">{activeMode[2]}</p>

            <label
              className="mt-5 block text-sm font-bold"
              htmlFor="destination"
            >
              Where do you need to park?
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border-2 border-gray-100 px-4 focus-within:border-gray-900">
              <IconMapPin className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                id="destination"
                name="destination"
                required
                className="min-w-0 flex-1 bg-transparent py-4 outline-none"
                placeholder="Address, venue, station or airport"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(['arrival', 'departure'] as const).map((field) => (
                <label
                  key={field}
                  className="block text-sm font-bold capitalize"
                >
                  {field === 'departure' ? 'Leave' : 'Arrive'}
                  <span className="mt-2 flex items-center gap-3 rounded-xl border-2 border-gray-100 px-4 focus-within:border-gray-900">
                    <IconCalendarEvent className="h-5 w-5 shrink-0 text-gray-400" />
                    <input
                      name={field}
                      type="datetime-local"
                      required
                      className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none"
                    />
                  </span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-black text-black transition hover:bg-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
            >
              Find parking <IconArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map(([Icon, title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-xl font-black">{title}</h2>
              <p className="mt-2 leading-7 text-gray-500">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div className="relative min-h-80 overflow-hidden rounded-3xl bg-primary p-8">
          <div className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full border-[3rem] border-black/10" />
          <div className="relative flex min-h-64 flex-col justify-between">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gray-900 text-white">
              <IconCar className="h-8 w-8" />
            </span>
            <div>
              <p className="text-5xl font-black tracking-tight sm:text-6xl">
                One space.
              </p>
              <p className="mt-2 text-2xl font-bold">Extra monthly income.</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">
            For space owners
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Put an empty parking space to work.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-gray-500">
            Choose when drivers can book, set your rules, and manage earnings
            from a straightforward provider dashboard.
          </p>
          <ul className="mt-6 space-y-3 font-semibold">
            {[
              'Free to create a listing',
              'Control prices and availability',
              'Track bookings and payouts',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-green" stroke={3} />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href={providerUrl}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-4 font-bold text-white hover:bg-gray-700"
          >
            List your space <IconArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="rounded-3xl bg-gray-25 p-6 sm:p-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">
                Explore
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Parking for every destination
              </h2>
            </div>
            <Link
              href="/search"
              className="font-bold underline underline-offset-4"
            >
              Browse all locations
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {popularPlaces.map((place) => (
              <Link
                key={place}
                href={`/search?category=${encodeURIComponent(
                  place.toLowerCase(),
                )}`}
                className="group flex min-h-28 items-end justify-between rounded-2xl bg-white p-5 font-black shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {place}
                <IconArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
