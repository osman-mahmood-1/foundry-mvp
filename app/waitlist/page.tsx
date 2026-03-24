'use client'

import { useState, useEffect, useRef } from 'react'
import { joinWaitlist, getMemberCount } from './actions'

const orbStyles = `
  @keyframes orbFloat1 {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(40px, 30px) scale(1.15); }
    66% { transform: translate(-20px, 50px) scale(0.95); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes orbFloat2 {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-50px, -30px) scale(1.2); }
    66% { transform: translate(30px, -40px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes orbPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`

export default function WaitlistPage() {
  const [memberCount, setMemberCount] = useState(0)
  const [state, setState] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<{
    memberNumber: number
    uniqueId: string
    name: string
  } | null>(null)
  const [ringAnimating, setRingAnimating] = useState(false)
  const [ringDone, setRingDone] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    getMemberCount().then(setMemberCount)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    canvas.width = parent.offsetWidth
    canvas.height = parent.offsetHeight
    const ctx = canvas.getContext('2d')!
    const cols = Math.ceil(canvas.width / 17)
    const rows = Math.ceil(canvas.height / 17)
    const dots = Array.from({ length: rows * cols }, (_, i) => ({
      x: (i % cols) * 17 + 8,
      y: Math.floor(i / cols) * 17 + 8,
    }))
    let t = 0
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
      const w = canvas!.width, h = canvas!.height
      dots.forEach((d, i) => {
        const dx = d.x - w * 0.5, dy = d.y - h * 0.5
        const fade = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (Math.sqrt(w * w + h * h) * 0.52))
        const pulse = 0.2 + 0.16 * Math.sin(t * 0.85 + i * 0.19)
        ctx.beginPath()
        ctx.arc(d.x, d.y, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(194,232,226,${(fade * pulse).toFixed(3)})`
        ctx.fill()
      })
      t += 0.011
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (state === 'success') {
      setTimeout(() => setRingAnimating(true), 300)
      setTimeout(() => { setRingAnimating(false); setRingDone(true) }, 2700)
    }
  }, [state])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await joinWaitlist(formData)
    setLoading(false)
    if ('error' in res) {
      setError(res.error ?? 'Something went wrong')
      return
    }
    if (res.success) {
      setResult({ memberNumber: res.memberNumber, uniqueId: res.uniqueId, name: res.name })
      setMemberCount(c => c + 1)
      setState('success')
    }
  }

  function handleShare() {
  const url = `https://taxfoundry.co.uk/passport/${result?.uniqueId}`
  const text = `I just claimed founding membership at TaxFoundry (${result?.uniqueId}). Tax software reimagined for MTD — join me: ${url}`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }
}

  const pips = Array.from({ length: 10 }, (_, i) => i < Math.ceil(memberCount / 10))
  const mrz = result
    ? `TF<${result.name.toUpperCase().replace(/\s+/g, '<')}<<<<<<<<<<<<<<<<<`.substring(0, 24)
    : 'TF<<<<<<<<<<<<<<<<<<<<<<<'

  const isSuccess = state === 'success'

  return (
    <div style={{
      position: 'relative', background: '#08080f', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 28px 52px', overflow: 'hidden',
    }}>
      <style>{orbStyles}</style>

      {/* Orb 1 — top left, coral */}
      <div style={{
        position: 'absolute',
        width: isSuccess ? 520 : 400,
        height: isSuccess ? 520 : 400,
        borderRadius: '50%', top: -130, left: -90,
        background: 'radial-gradient(circle,rgba(255,100,60,0.22) 0%,transparent 68%)',
        filter: 'blur(50px)', pointerEvents: 'none',
        transition: 'width 1.5s ease, height 1.5s ease',
        animation: isSuccess ? 'orbFloat1 8s ease-in-out infinite, orbPulse 4s ease-in-out infinite' : 'none',
      }} />

      {/* Orb 2 — bottom right, violet */}
      <div style={{
        position: 'absolute',
        width: isSuccess ? 440 : 320,
        height: isSuccess ? 440 : 320,
        borderRadius: '50%', bottom: -80, right: -80,
        background: 'radial-gradient(circle,rgba(160,60,255,0.2) 0%,transparent 70%)',
        filter: 'blur(48px)', pointerEvents: 'none',
        transition: 'width 1.5s ease, height 1.5s ease',
        animation: isSuccess ? 'orbFloat2 10s ease-in-out infinite, orbPulse 5s ease-in-out infinite 1s' : 'none',
      }} />

      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.28,
      }} />

      <div style={{
        position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
        alignItems: 'center', width: '100%', maxWidth: 400,
      }}>

        {/* ── FORM STATE ── */}
        {state === 'form' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 26, maxWidth: 320 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 18, fontFamily: 'monospace' }}>
                taxfoundry · private access
              </p>
              <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 32, fontWeight: 400, color: '#ffffff', lineHeight: 1.22, letterSpacing: '-0.02em', marginBottom: 4 }}>
                Accounting,<br />reimagined for MTD.
              </h1>
              <h2 style={{
                fontFamily: 'Georgia,serif', fontSize: 32, fontWeight: 700,
                lineHeight: 1.22, letterSpacing: '-0.02em', marginBottom: 18,
                background: 'linear-gradient(180deg,#c2e8e2 0%,#4a8fa0 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Join the founding hundred.
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.72, marginBottom: 0 }}>
                Tax and accounting have been designed to feel complicated. The incumbents want it that way. We don't. TaxFoundry is what happens when product designers, technologists and accountants{' '}
                <span style={{
                  background: 'linear-gradient(135deg,#5fa8b8 0%,#4a8fa0 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 500,
                }}>
                  build something extraordinary.
                </span>
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {pips.map((on, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: on ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
                  <strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{memberCount}</strong> of 100 founding spots taken
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{
              width: '100%', maxWidth: 340,
              background: 'rgba(180,180,190,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 28, padding: '26px 22px',
              backdropFilter: 'blur(32px)',
            }}>
              <label style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                Your name
              </label>
              <input
                name="name" type="text" required
                placeholder="Your actual name (not your LLC)"
                style={{ display: 'block', width: '100%', background: 'rgba(160,165,175,0.1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 25, padding: '14px 20px', fontSize: 15, color: '#ffffff', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }}
              />
              <label style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                Email address
              </label>
              <input
                name="email" type="email" required
                placeholder="you@example.com"
                style={{ display: 'block', width: '100%', background: 'rgba(160,165,175,0.1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 25, padding: '14px 20px', fontSize: 15, color: '#ffffff', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }}
              />
              {error && (
                <p style={{ fontSize: 12, color: '#ff7a50', marginBottom: 10, textAlign: 'center' }}>{error}</p>
              )}
              <button
                type="submit" disabled={loading}
                style={{ display: 'block', width: '100%', background: loading ? 'rgba(255,122,80,0.6)' : '#ff7a50', color: '#ffffff', border: 'none', borderRadius: 25, padding: '16px 20px', fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 28px rgba(255,100,60,0.35)', boxSizing: 'border-box' }}
              >
                {loading ? 'Securing your spot...' : 'Claim your founding spot →'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 12, lineHeight: 1.6 }}>
                No card required — secure your founding fixed price before the doors open.
              </p>
            </form>
          </>
        )}

        {/* ── SUCCESS STATE ── */}
        {state === 'success' && result && (
          <>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'monospace', textAlign: 'center' }}>
              founding member {String(result.memberNumber).padStart(3, '0')} — welcome to the foundry.
            </p>

            {/* Passport card */}
            <div style={{ width: '100%', maxWidth: 340, position: 'relative', marginBottom: 16 }}>
              <div style={{ borderRadius: 28, overflow: 'hidden', position: 'relative', background: 'rgba(12,8,18,0.78)' }}>

                {/* Neon border */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: 28, padding: 1, background: 'linear-gradient(135deg,rgba(194,232,226,0.8) 0%,rgba(74,143,160,0.6) 50%,rgba(194,232,226,0.4) 100%)', WebkitMask: 'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: 'radial-gradient(ellipse at 10% 0%,rgba(194,232,226,0.07) 0%,transparent 50%),radial-gradient(ellipse at 90% 100%,rgba(74,143,160,0.07) 0%,transparent 50%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42%', borderRadius: '28px 28px 0 0', background: 'linear-gradient(180deg,rgba(255,255,255,0.055) 0%,transparent 100%)', pointerEvents: 'none' }} />

                {/* Top bar */}
                <div style={{ position: 'relative', zIndex: 1, padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Tax</p>
                    <p style={{ margin: 0, fontFamily: 'Georgia,serif', fontSize: 21, fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Foundry</p>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 11px', fontSize: 9, letterSpacing: '0.13em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    Founding Member
                  </span>
                </div>

                {/* Body */}
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
                      <circle
                        cx="44" cy="44" r="42" fill="none"
                        stroke="url(#rg)" strokeWidth="3.5" strokeLinecap="round"
                        transform="rotate(-90 44 44)"
                        strokeDasharray="270"
                        strokeDashoffset={ringDone ? 0 : ringAnimating ? 0 : 270}
                        style={{ transition: ringAnimating ? 'stroke-dashoffset 2.4s cubic-bezier(0.4,0,0.2,1)' : 'none' }}
                      />
                      <circle cx="44" cy="44" r="29" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 19, fontWeight: 500, color: '#ffffff', lineHeight: 1 }}>
                        {String(result.memberNumber).padStart(3, '0')}
                      </span>
                      <span style={{ fontSize: 8, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.26)', textTransform: 'uppercase', marginTop: 2 }}>Member</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {[
                      { label: 'Name', value: result.name, mono: false },
                      { label: 'Issued', value: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), mono: false },
                      { label: 'Unique ID', value: result.uniqueId, mono: true },
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

                {/* Benefits */}
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

                {/* Footer */}
                <div style={{ position: 'relative', zIndex: 1, padding: '11px 22px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.09)', letterSpacing: '0.07em' }}>{mrz}</span>
                  <span style={{ fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Valid · Lifetime</span>
                </div>
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              style={{
                display: 'block', width: '100%', maxWidth: 340,
                background: copied ? 'rgba(194,232,226,0.1)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 25, padding: 14, fontSize: 13,
                color: copied ? '#c2e8e2' : 'rgba(255,255,255,0.6)',
                fontWeight: 500, cursor: 'pointer', marginBottom: 8,
                transition: 'all 0.3s',
              }}
            >
              {copied ? "Copied — send it to someone who'd love this" : 'Share your passport ↗'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}