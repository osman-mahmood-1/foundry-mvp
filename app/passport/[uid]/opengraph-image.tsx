import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase-server'

export const runtime = 'edge'
export const alt = 'TaxFoundry Founding Member Passport'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: { uid: string }
}

export default async function OGImage({ params }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_passport', { p_uid: params.uid })
  const passport = data?.[0]

  const name = passport?.name ?? 'Founding Member'
  const memberNumber = passport?.member_number ?? '001'
  const uid = passport?.unique_id ?? params.uid

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        background: '#08080f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'serif',
        position: 'relative',
      }}>
        {/* Background orb coral */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          top: -200, left: -100,
          background: 'radial-gradient(circle,rgba(255,100,60,0.3) 0%,transparent 70%)',
          display: 'flex',
        }} />
        {/* Background orb violet */}
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          bottom: -150, right: -100,
          background: 'radial-gradient(circle,rgba(160,60,255,0.25) 0%,transparent 70%)',
          display: 'flex',
        }} />

        {/* Passport card */}
        <div style={{
          width: 480, background: 'rgba(12,8,18,0.92)',
          border: '1px solid rgba(194,232,226,0.4)',
          borderRadius: 32, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 80px rgba(194,232,226,0.15)',
        }}>
          {/* Top */}
          <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Tax</span>
              <span style={{ fontSize: 26, fontWeight: 400, color: '#ffffff', lineHeight: 1 }}>Foundry</span>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 10, letterSpacing: '0.13em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', display: 'flex' }}>
              Founding Member
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px', display: 'flex', gap: 24 }}>
            {/* Seal */}
            <div style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid rgba(194,232,226,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', flexShrink: 0, background: 'rgba(194,232,226,0.04)' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#c2e8e2', lineHeight: 1 }}>
                {String(memberNumber).padStart(3, '0')}
              </span>
              <span style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 4 }}>Member</span>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>Name</span>
                <span style={{ fontSize: 16, color: '#ffffff' }}>{name}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>Unique ID</span>
                <span style={{ fontSize: 12, color: '#7bbdcc', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{uid}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 28px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace', letterSpacing: '0.07em' }}>
              {`TF<${name.toUpperCase().replace(/\s+/g, '<')}<<<<<<<<`.substring(0, 20)}
            </span>
            <span style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Valid · Lifetime</span>
          </div>
        </div>

        {/* Right side text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginLeft: 60, maxWidth: 280 }}>
          <span style={{ fontSize: 13, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>taxfoundry.co.uk</span>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Accounting,<br/>reimagined<br/>for MTD.</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6 }}>Join the founding hundred — price locked forever.</span>
        </div>
      </div>
    ),
    { ...size }
  )
}