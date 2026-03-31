import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserRole, homeForRole } from '@/lib/roles'

/**
 * Route guard middleware.
 *
 * Routing logic:
 *   No session              → redirect to /login (for protected routes)
 *   role = client (default) → /portal/* allowed; /accountant/* and /admin/* redirect to /portal
 *   role = accountant       → /accountant/* allowed; /admin/* redirects to /accountant
 *                             /portal/* redirects to /accountant (accountants have their own portal)
 *   role = platform_editor  → /admin/*, /accountant/*, /portal/* all allowed
 *   /login (authed)         → redirect to role's home
 *   /invite/*               → always public; token validation is handled at the page level
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path    = request.nextUrl.pathname
  const role    = getUserRole(user)
  const isAuthed = user !== null

  // ─── Unauthenticated ─────────────────────────────────────────────────────────
  if (!isAuthed) {
    const protectedPrefixes = ['/portal', '/accountant', '/admin']
    if (protectedPrefixes.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // ─── /login — redirect authenticated users to their home ─────────────────────
  if (path === '/login') {
    return NextResponse.redirect(new URL(homeForRole(role), request.url))
  }

  // ─── /admin/* — platform_editor only ─────────────────────────────────────────
  if (path.startsWith('/admin')) {
    if (role !== 'platform_editor') {
      return NextResponse.redirect(new URL(homeForRole(role), request.url))
    }
    return supabaseResponse
  }

  // ─── /accountant/* — accountant or platform_editor ───────────────────────────
  if (path.startsWith('/accountant')) {
    if (role !== 'accountant' && role !== 'platform_editor') {
      return NextResponse.redirect(new URL(homeForRole(role), request.url))
    }
    return supabaseResponse
  }

  // ─── /portal/* — client (or platform_editor for impersonation) ───────────────
  // Accountants have their own portal; redirect them away.
  if (path.startsWith('/portal')) {
    if (role === 'accountant') {
      return NextResponse.redirect(new URL('/accountant', request.url))
    }
    // platform_editor is allowed through for impersonation (every access is audit logged)
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/portal/:path*', '/accountant/:path*', '/admin/:path*', '/login'],
}
