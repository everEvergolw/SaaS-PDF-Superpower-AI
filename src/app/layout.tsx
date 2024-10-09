import Navbar from '@/components/Navbar'
import { cn, constructMetadata } from '@/lib/utils'
import { Inter } from 'next/font/google'
import './globals.css'

import 'react-loading-skeleton/dist/skeleton.css'
import 'simplebar-react/dist/simplebar.min.css'

import { Toaster } from '@/components/ui/toaster'
import Providers from '@/components/Provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = constructMetadata() 

export const themeColor = '#FFF';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className='light'>
      <Providers>
        <body
          className={cn(
            'min-h-screen font-sans antialiased grainy',
            inter.className
          )}>
          <Toaster />
          <Navbar />
          {children}
        </body>
      </Providers>
    </html>
  )
}