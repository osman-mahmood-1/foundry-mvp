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
    var d = document.documentElement;
    var e = localStorage.getItem('foundry-theme');
    var isDark = e === 'dark' || (!e && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var c = isDark ? '#000000' : '#ffffff';

    // 1. Set attribute immediately so all CSS selectors resolve correctly
    d.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // 2. Inject a single style tag covering both html and body —
    //    handles the black footer in light mode because the rule is ready before paint.
    //    color-scheme per-element tells the browser which UA styles to apply.
    var s = document.createElement('style');
    s.id = 'theme-shield';
    s.innerHTML = 'html,body{background-color:' + c + '!important;color-scheme:' + (isDark ? 'dark' : 'light') + ';}';
    document.head.appendChild(s);

    // 3. Update theme-color meta
    document.querySelectorAll('meta[name="theme-color"]').forEach(function(el){ el.remove(); });
    var m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = c;
    document.head.appendChild(m);
  } catch(e) {}
})();`}} />
        {/* CSS pre-paint fallback — browser CSS parser catches any gap before script runs */}
        <style dangerouslySetInnerHTML={{ __html: `
          html { background-color: #000000; }
          html[data-theme='light'] { background-color: #ffffff; }
        `}} />
        {/* Dual media-aware theme-color — iOS hardware reads these before the page loads */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
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
        {/* Body shield — SSR content never sits on a white canvas.
            Runs before any component renders; theme selector overrides once data-theme is set. */}
        <style dangerouslySetInnerHTML={{ __html: `
          body { background-color: #000000 !important; }
          [data-theme='light'] body { background-color: #ffffff !important; }
        `}} />
        {children}
      </body>
    </html>
  )
}
