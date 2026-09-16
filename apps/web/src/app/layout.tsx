import type { Metadata } from 'next'
import '@autospace/ui/src/app/globals.css'
import { ApolloProvider } from '@autospace/network/src/config/apollo'
import { SessionProvider } from '@autospace/ui/src/components/molecules/SessionProvider'
import { Header } from '@autospace/ui/src/components/organisms/Header'
import { ToastContainer } from '@autospace/ui/src/components/molecules/Toast'
import { MenuItem } from '@autospace/util/types'
import { Container } from '@autospace/ui/src/components/atoms/Container'

export const metadata: Metadata = {
  title: {
    default: 'Autospace — Find parking that fits your journey',
    template: '%s | Autospace',
  },
  description:
    'Find and reserve trusted hourly, daily, monthly, and airport parking with Autospace.',
}

const MENUITEMS: MenuItem[] = [
  { label: 'Search', href: '/search' },
  { label: 'Bookings', href: '/bookings' },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <SessionProvider>
        <ApolloProvider>
          <body className="bg-gray-25 font-sans">
            <Header menuItems={MENUITEMS} />
            <Container>{children}</Container>
            <ToastContainer />
          </body>
        </ApolloProvider>
      </SessionProvider>
    </html>
  )
}
