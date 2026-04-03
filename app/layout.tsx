import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets:  ['latin'],
  variable: '--font-outfit',
  display:  'swap',
  weight:   ['300', '400', '500', '600', '700', '800'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

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
    <html lang="en" data-theme="light" className={outfit.variable} suppressHydrationWarning>
      <head>
        {/*
          Blocking script — runs synchronously before first CSS paint.
          Reads localStorage + system preference and sets data-theme on <html>
          so CSS variables (background, theme-bar colour) resolve correctly
          from the very first pixel. Without this, SSR always emits data-theme="light"
          and Safari paints the safe-area zones white before JS hydrates.
        */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('foundry-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){}})();` }} />

        {/* Theme colour — matches pageBg per mode for Dynamic Island / status bar */}
        <meta name="theme-color" content="#07101e" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#fdf5ec" media="(prefers-color-scheme: light)" />

        {/* PWA / home screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tax Foundry" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
