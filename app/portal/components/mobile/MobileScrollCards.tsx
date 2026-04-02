'use client'

/**
 * app/portal/components/mobile/MobileScrollCards.tsx
 *
 * Three snap-scroll stat cards: Yours to Spend · Income YTD · Tax Pot.
 * CSS snap — no JS library. Count-up animation via requestAnimationFrame.
 */

import { useState, useEffect, useRef } from 'react'
import { useColours }   from '@/styles/ThemeContext'
import { fonts, fontWeight } from '@/styles/tokens/typography'
import { radius }        from '@/styles/tokens'

interface CardData {
  label:    string
  value:    number   // pence
  subLabel: string
  colour:   string
}

interface Props {
  incomePence:   number
  expensesPence: number
  estTaxPence:   number
}

function formatPence(pence: number): string {
  const pounds = pence / 100
  if (pounds >= 1000) return `£${(pounds / 1000).toFixed(1)}k`
  return `£${pounds.toFixed(0)}`
}

function useCountUp(target: number, duration = 600): number {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start     = performance.now()
    const startVal  = 0
    function tick(now: number) {
      const elapsed  = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      setCurrent(Math.round(startVal + eased * (target - startVal)))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return current
}

function StatCardMobile({ label, value, subLabel, colour }: CardData) {
  const colours  = useColours()
  const animated = useCountUp(value)

  return (
    <div
      className="stat-card-mobile"
      style={{
        height:       '110px',
        borderRadius: radius.lg,
        background:   colours.cardBg,
        border:       `1px solid ${colours.cardBorder}`,
        borderTop:    `1px solid ${colours.cardBorderTop}`,
        padding:      '16px 18px',
        display:      'flex',
        flexDirection:'column',
        justifyContent:'space-between',
        boxShadow:    colours.cardShadow,
      }}
    >
      <div style={{
        fontSize:      '10px',
        fontWeight:    fontWeight.medium,
        color:         colours.textMuted,
        fontFamily:    fonts.sans,
        letterSpacing: '0.10em',
        textTransform: 'uppercase' as const,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:           fonts.sans,
        fontSize:             '36px',
        fontWeight:           fontWeight.semibold,
        color:                colour,
        lineHeight:           1,
        fontVariantNumeric:   'tabular-nums',
      }}>
        {formatPence(animated)}
      </div>
      <div style={{
        fontSize:   '12px',
        fontWeight: 300,
        color:      colours.textMuted,
        fontFamily: fonts.sans,
      }}>
        {subLabel}
      </div>
    </div>
  )
}

export default function MobileScrollCards({ incomePence, expensesPence, estTaxPence }: Props) {
  const colours = useColours()
  const yoursToSpend = Math.max(0, incomePence - expensesPence - estTaxPence)

  const cards: CardData[] = [
    {
      label:    'Yours to Spend',
      value:    yoursToSpend,
      subLabel: 'after estimated tax',
      colour:   colours.income,
    },
    {
      label:    'Income YTD',
      value:    incomePence,
      subLabel: 'this tax year',
      colour:   colours.textPrimary,
    },
    {
      label:    'Tax Pot',
      value:    estTaxPence,
      subLabel: 'estimated liability',
      colour:   colours.warning,
    },
  ]

  return (
    <div className="card-scroll" style={{ paddingTop: '12px', paddingBottom: '4px' }}>
      {cards.map(card => (
        <StatCardMobile key={card.label} {...card} />
      ))}
    </div>
  )
}
