'use client'

// Shared glassmorphic panel component
export function Panel({
  children,
  style = {},
  padding = '24px',
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  padding?: string
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(48px)',
      WebkitBackdropFilter: 'blur(48px)',
      border: '1px solid rgba(255,255,255,0.95)',
      borderRadius: '16px',
      boxShadow: '0 4px 32px rgba(5,28,44,0.07), inset 0 1px 0 rgba(255,255,255,1)',
      padding,
      ...style,
    }}>
      {children}
    </div>
  )
}

// Section label — small mono uppercase
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '9px',
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: '14px',
    }}>
      {children}
    </div>
  )
}

// Empty state — powerful brand copy, no data yet
export function EmptyState({
  icon,
  headline,
  sub,
  action,
  onAction,
}: {
  icon: string
  headline: string
  sub: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '56px 32px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '28px',
        marginBottom: '16px',
        opacity: 0.25,
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '18px',
        fontWeight: '500',
        color: '#051C2C',
        marginBottom: '8px',
        letterSpacing: '-0.01em',
      }}>
        {headline}
      </div>
      <div style={{
        fontSize: '13px',
        color: '#94A3B8',
        lineHeight: 1.6,
        maxWidth: '280px',
        marginBottom: action ? '24px' : '0',
      }}>
        {sub}
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '9px 20px',
            background: '#051C2C',
            color: 'white',
            border: 'none',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '-0.01em',
          }}
        >
          {action}
        </button>
      )}
    </div>
  )
}

// Stat card — metric display
export function StatCard({
  label,
  value,
  sub,
  color = '#051C2C',
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <Panel padding="20px">
      <div style={{
        fontSize: '9px',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: '10px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '28px',
        fontWeight: '500',
        color,
        lineHeight: 1,
        marginBottom: sub ? '6px' : '0',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{sub}</div>
      )}
    </Panel>
  )
}

// Loading spinner
export function Spinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px',
    }}>
      <div style={{
        width: '24px', height: '24px',
        border: '2px solid rgba(5,28,44,0.08)',
        borderTop: '2px solid #051C2C',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

// Format pence to GBP string
export function formatGBP(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100)
}

// Format date to readable string
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
