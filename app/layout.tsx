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
    <html lang="en" className={outfit.variable}>
      <head>
        {/* color-scheme MUST be first — Safari resolves its internal canvas color at hardware
            level before executing any script or parsing any CSS. Without this at the top,
            the canvas defaults to white for the microseconds before our script runs. */}
        <meta name="color-scheme" content="dark light" />
        {/* ── FOUC Nuclear Option ────────────────────────────────────────────────
            Blocking script (no async/defer): sets backgroundColor on documentElement
            before browser paints a pixel, overriding server-rendered data-theme="light".
        ──────────────────────────────────────────────────────────────────────── */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){
  try {
    var e = localStorage.getItem('foundry-theme');
    var isDark = e === 'dark' || (!e && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var color = isDark ? '#000000' : '#ffffff';

    // FOUC SHIELD: inject a <style> into the CSSOM immediately — faster than d.style
    // because the browser owns it internally without waiting for any .css download.
    // transition:none kills the sub-frame white→black animation that looks like a flash.
    var s = document.createElement('style');
    s.id = 'fouc-shield';
    s.innerHTML = 'html,body{background-color:' + color + '!important;transition:none!important;}';
    document.head.appendChild(s);

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Update theme-color meta
    document.querySelectorAll('meta[name="theme-color"]').forEach(function(el){ el.remove(); });
    var m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = color;
    document.head.appendChild(m);
  } catch(e) {}
})();`}} />
        {/* CSS pre-paint fallback — browser CSS parser catches any gap before script runs */}
        <style dangerouslySetInnerHTML={{ __html: `
          html { background-color: #000000; }
          html[data-theme='light'] { background-color: #ffffff; }
        `}} />
        {/* Static fallback theme-color — browser reads this before the script can inject a dynamic one */}
        <meta name="theme-color" content="#000000" />
        {/* Static fallback theme-color — browser reads this before the script can inject a dynamic one */}
        <meta name="theme-color" content="#000000" />
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
