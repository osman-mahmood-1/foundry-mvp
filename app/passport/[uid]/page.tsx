import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ uid: string }>
}

export async function generateMetadata({ params }: Props) {
  const { uid } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.rpc('get_passport', { p_uid: uid })
  const passport = data?.[0]

  if (!passport) return { title: 'TaxFoundry — Join the Founding Hundred' }

  return {
    title: `${passport.name} is founding member #${String(passport.member_number).padStart(3, '0')} — TaxFoundry`,
    description: 'Tax and accounting reimagined for MTD. Join the founding hundred.',
    openGraph: {
      title: `${passport.name} is founding member #${String(passport.member_number).padStart(3, '0')}`,
      description: 'Tax software built by designers, technologists and accountants. Join the founding hundred.',
      url: `https://taxfoundry.co.uk/passport/${uid}`,
      siteName: 'TaxFoundry',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${passport.name} is founding member #${String(passport.member_number).padStart(3, '0')}`,
      description: 'Tax software built by designers, technologists and accountants.',
    },
  }
}

export default async function PassportPage({ params }: Props) {
  const { uid } = await params
  const supabase = createAdminClient()

  const { data: passportData, error } = await supabase.rpc('get_passport', { p_uid: uid })

  console.log('uid:', uid)
  console.log('data:', JSON.stringify(passportData))
  console.log('error:', JSON.stringify(error))

  const passport = passportData?.[0]
  if (!passport) redirect('/waitlist')

  const { count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })

  const memberCount = count ?? 1
  const firstName = passport.name.split(' ')[0]
  const issuedDate = new Date(passport.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div style={{
      position: 'relative', background: '#08080f', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 28px 52px', overflow: 'hidden',
      fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
    }}>
      {/* Orb — top right, sapphire, matches global ambient */}
      <div style={{ position: 'fixed', top: '-300px', right: '-240px', width: '1080px', height: '1080px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.20) 0%, rgba(59,130,246,0.06) 45%, transparent 72%)', filter: 'blur(90px)', pointerEvents: 'none', opacity: 0.60 }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 400 }}>

        <p style={{ fontSize: 10, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 16, fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
          taxfoundry · founding member
        </p>

        <div style={{ width: '100%', maxWidth: 340, position: 'relative', marginBottom: 24 }}>
          <div style={{ borderRadius: 28, overflow: 'hidden', position: 'relative', background: 'rgba(12,8,18,0.78)' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 28, padding: 1, background: 'linear-gradient(135deg,rgba(194,232,226,0.8) 0%,rgba(74,143,160,0.6) 50%,rgba(194,232,226,0.4) 100%)', WebkitMask: 'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: 'radial-gradient(ellipse at 10% 0%,rgba(194,232,226,0.07) 0%,transparent 50%),radial-gradient(ellipse at 90% 100%,rgba(74,143,160,0.07) 0%,transparent 50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42%', borderRadius: '28px 28px 0 0', background: 'linear-gradient(180deg,rgba(255,255,255,0.055) 0%,transparent 100%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>Tax</p>
                <p style={{ margin: 0, fontFamily: "var(--font-outfit, 'Outfit', sans-serif)", fontSize: 21, fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Foundry</p>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 11px', fontSize: 9, letterSpacing: '0.13em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
                Founding Member
              </span>
            </div>

            <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px', display: 'flex', gap: 16 }}>
              <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <defs>
                    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c2e8e2" />
                      <stop offset="100%" stopColor="#4a8fa0" />
                    </linearGradient>
                  </defs>
                  <circle cx="44" cy="44" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
                  <circle cx="44" cy="44" r="42" fill="none" stroke="url(#rg)" strokeWidth="3.5" strokeLinecap="round" transform="rotate(-90 44 44)" strokeDasharray="270" strokeDashoffset="0" />
                  <circle cx="44" cy="44" r="29" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)", fontSize: 19, fontWeight: 500, color: '#ffffff', lineHeight: 1 }}>
                    {String(passport.member_number).padStart(3, '0')}
                  </span>
                  <span style={{ fontSize: 8, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.26)', textTransform: 'uppercase', marginTop: 2 }}>Member</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {[
                  { label: 'Name', value: passport.name, mono: false },
                  { label: 'Issued', value: issuedDate, mono: false },
                  { label: 'Unique ID', value: passport.unique_id, mono: true },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase' }}>{f.label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: f.mono ? 11 : 13, color: f.mono ? 'rgba(255,255,255,0.6)' : '#ffffff', fontFamily: f.mono ? 'monospace' : 'inherit', letterSpacing: f.mono ? '0.06em' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ margin: '0 22px', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

            <div style={{ position: 'relative', zIndex: 1, padding: '14px 22px 18px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 9, letterSpacing: '0.17em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>What this gets you</p>
              {[
                ['Price locked forever', 'never goes up'],
                ['First through the door', 'before public launch'],
                ['Founding Member badge', 'on your account, always'],
              ].map(([bold, rest], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.25)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>
                    <strong style={{ color: '#ffffff', fontWeight: 500 }}>{bold}</strong> — {rest}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ position: 'relative', zIndex: 1, padding: '11px 22px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)", fontSize: 8, color: 'rgba(255,255,255,0.09)', letterSpacing: '0.07em' }}>
                {`TF<${passport.name.toUpperCase().replace(/\s+/g, '<')}<<<<<<<<<<<<<<<<<`.substring(0, 24)}
              </span>
              <span style={{ fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Valid · Lifetime</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20, maxWidth: 300 }}>
          <strong style={{ color: '#ffffff' }}>{firstName}</strong> is one of{' '}
          <strong style={{ color: '#ffffff' }}>{memberCount}</strong> founding members reimagining how UK businesses handle their finances.
        </p>

        <Link href="/waitlist" style={{
          display: 'block', width: '100%', maxWidth: 340,
          background: '#ff7a50', color: '#ffffff',
          borderRadius: 25, padding: '16px 20px',
          fontSize: 15, fontWeight: 500, textAlign: 'center',
          textDecoration: 'none', boxShadow: '0 8px 28px rgba(255,100,60,0.35)',
          boxSizing: 'border-box',
        }}>
          Join {firstName} and secure your founding price →
        </Link>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 12, textAlign: 'center' }}>
          No card required — 100 founding spots only.
        </p>
      </div>
    </div>
  )
}