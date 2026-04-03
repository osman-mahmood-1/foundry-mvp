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
        {/* Tell Safari the supported color schemes before it creates the canvas — prevents white FOUC */}
        <meta name="color-scheme" content="dark light" />
        {/* CSS pre-paint: browser CSS parser runs before JS engine — pins dark canvas before script fires */}
        <style dangerouslySetInnerHTML={{ __html: `
          html { background-color: #000000; }
          [data-theme='light'] { background-color: #ffffff; }
        `}} />
        {/* Blocking theme-color injection — must be first in <head>, before any CSS */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){
  try {
    var key = 'foundry-theme';
    var stored = localStorage.getItem(key);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    var theme = isDark ? 'dark' : 'light';
    var color = isDark ? '#000000' : '#ffffff';
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach(function(el){ el.remove(); });
    var m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = color;
    document.head.appendChild(m);
  } catch(e) {}
})();`}} />
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
