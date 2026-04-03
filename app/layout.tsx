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
          Sets data-theme on <html> AND writes a dynamic theme-color meta.
          Static theme-color metas are read from cached HTML at navigation time,
          so a user with OS-light + app-dark always gets the wrong colour.
          A dynamically-appended meta written before first paint is read correctly.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var stored = localStorage.getItem('foundry-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (!stored && prefersDark);
    var theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = isDark ? '#07101e' : '#fdf5ec';
    document.head.appendChild(meta);
  } catch(e) {}
})();`,
          }}
        />

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
