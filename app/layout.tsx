import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets:  ['latin'],
  variable: '--font-outfit',
  display:  'swap',
  weight:   ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title:       'Tax Foundry',
  description: 'Financial platform for sole traders',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="light" className={outfit.variable}>
      <body>
        {children}
      </body>
    </html>
  )
}
