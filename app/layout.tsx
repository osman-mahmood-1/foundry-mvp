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
      <head>
        {/* Blocking theme-color injection — must be first in <head>, before any CSS */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var stored = null;
  try { stored = localStorage.getItem('foundry-theme'); } catch(e){}
  var dark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var m = document.createElement('meta');
  m.name = 'theme-color';
  m.content = dark ? '#000000' : '#fdf5ec';
  document.head.appendChild(m);
})();
        `}} />
        {/* Viewport — viewport-fit=cover lets background bleed into safe areas for bottom bar sampling */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* PWA / home screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* "default" = Automatic in modern iOS — follows theme-color meta reliably */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
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
