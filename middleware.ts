/**
 * middleware.ts
 *
 * Edge middleware — runs before every request reaches a page.
 *
 * Responsibilities:
 * - Refresh the Supabase session cookie on every request (keeps sessions alive)
 * - Protect /portal and any future authenticated routes
 * - Redirect unauthenticated users to /login
 *
 * This runs at the Vercel edge — before the page is rendered,
 * before any data is fetched, before the user sees anything.
 * It is the correct first line of auth defence.
 *
 * Matcher: only runs on /portal and sub-paths. All other routes
 * (/, /login, /waitlist, /passport) are public and unaffected.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase client that can read and write cookies
  // via the request/response cycle — the only correct way in middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to the request first (for downstream use)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Then write to the response (so the browser receives them)
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  // IMPORTANT: Do not add any logic between createServerClient and
  // getUser(). A subtle bug can make sessions hard to reproduce.
  const { data: { user } } = await supabase.auth.getUser()

  // No session → redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Session valid → continue to the page
  return supabaseResponse
}

export const config = {
  matcher: [
    '/portal',
    '/portal/:path*',
  ],
}