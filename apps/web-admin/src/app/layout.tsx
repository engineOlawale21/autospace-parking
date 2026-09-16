import type { Metadata } from 'next'
import '@autospace/ui/src/app/globals.css'
import { MenuItem } from '@autospace/util/types'
import { ApolloProvider } from '@autospace/network/src/config/apollo'
import { SessionProvider } from '@autospace/ui/src/components/molecules/SessionProvider'
import { ToastContainer } from '@autospace/ui/src/components/molecules/Toast'
import { Container } from '@autospace/ui/src/components/atoms/Container'
import { Header } from '@autospace/ui/src/components/organisms/Header'
import { IsAdmin } from '@autospace/ui/src/components/organisms/IsAdmin'


export const metadata: Metadata = {
  title: {
    default: 'Autospace Operations',
    template: '%s | Autospace Operations',
  },
  description: 'Operate Autospace users, listings, bookings, and payments.',
}

const MENUITEMS: MenuItem[] = [
  { label: 'Listings', href: '/' },
  { label: 'Admins', href: '/manageAdmins' },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-25 font-sans">
        <SessionProvider>
          <ApolloProvider>
            <Header type="admin" menuItems={MENUITEMS} />
            <Container>{children}</Container>
          </ApolloProvider>
        </SessionProvider>
        <ToastContainer />
      </body>
    </html>
  )
}
