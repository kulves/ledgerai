/**
* ParticlesHeader.jsx — Exact LedgerPro header with particles
 * Matches the CSS spec exactly:
 *   padding:26px, title left, spacer, theme-switch, online dot, avatar right
 */
import { useEffect, useRef } from 'react'

const PAGE_TITLES = {
  dashboard:    'Dashboard',
  expenses:     'Expenses',
  mileage:      'Mileage',
  documents:    'Documents',
  reports:      'Reports',
  chat:         'Ask Luca',
  subscription: 'Subscription',
  settings:     'Settings',
  banks:        'Connected Banks',
}
const PAGE_SUBS = {
  dashboard:    "Here's what's happening with your books today.",
  expenses:     'Track and categorize your business expenses.',
  mileage:      'Log business trips and calculate IRS deductions.',
  documents:    'Uploaded receipts and financial documents.',
  reports:      'Generate financial summaries and PDF reports.',
  chat:         'Ask Luca anything about tax and bookkeeping.',
  subscription: 'Manage your Ledger AI subscription.',
  settings:     'Configure Luca and manage your data.',
  banks:        'Connect your bank accounts for automatic import.',
}

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)
const MonitorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)

export default function ParticlesHeader({ backendStatus, activeTab, theme, setTheme }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const ptsRef    = useRef([])
  const mouseRef  = useRef({ x: null, y: null })

  const title = PAGE_TITLES[activeTab] || 'Dashboard'
  const sub   = PAGE_SUBS[activeTab]   || ''

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const COLORS = ['#22D3EE','#A78BFA','#C9962C','rgba(255,255,255,0.5)']

    const mkP = (x, y) => ({
      x:  x ?? Math.random() * canvas.width,
      y:  y ?? Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r:  Math.random() * 1.6 + 0.5,
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      op: Math.random() * 0.45 + 0.2,
    })

    const init = () => {
      canvas.width  = canvas.parentElement.offsetWidth
      canvas.height = canvas.parentElement.offsetHeight
      ptsRef.current = Array.from(
        { length: Math.max(38, Math.floor(canvas.width * canvas.height / 15000)) },
        () => mkP()
      )
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const pts = ptsRef.current
      const m   = mouseRef.current

      // Move + mouse attract
      pts.forEach(p => {
        if (m.x !== null) {
          const dx = m.x - p.x, dy = m.y - p.y
          const d  = Math.sqrt(dx*dx + dy*dy)
          if (d < 95 && d > 0) {
            p.vx += dx * 0.003; p.vy += dy * 0.003
            const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy)
            if (spd > 2.2) { p.vx = p.vx/spd*2.2; p.vy = p.vy/spd*2.2 }
          }
        }
        p.vx *= 0.99; p.vy *= 0.99
        p.x  += p.vx;  p.y  += p.vy
        if (p.x < -5) p.x = canvas.width+5
        if (p.x > canvas.width+5) p.x = -5
        if (p.y < -5) p.y = canvas.height+5
        if (p.y > canvas.height+5) p.y = -5
      })

      // Lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i+1; j < pts.length; j++) {
          const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y
          const d  = Math.sqrt(dx*dx + dy*dy)
          if (d < 120) {
            const near = m.x !== null && (
              Math.hypot(pts[i].x-m.x, pts[i].y-m.y) < 95 ||
              Math.hypot(pts[j].x-m.x, pts[j].y-m.y) < 95
            )
            ctx.beginPath()
            ctx.strokeStyle = near
              ? `rgba(201,150,44,${0.75*(1-d/120)})`
              : `rgba(34,211,238,${0.2*(1-d/120)})`
            ctx.lineWidth = near ? 1.1 : 0.75
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }

      // Dots
      pts.forEach(p => {
        const near = m.x !== null && Math.hypot(p.x-m.x, p.y-m.y) < 95
        if (near) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r*4, 0, Math.PI*2)
          ctx.fillStyle = 'rgba(201,150,44,0.09)'
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, near ? p.r*2.1 : p.r, 0, Math.PI*2)
        ctx.fillStyle = near ? '#C9962C' : p.col
        ctx.globalAlpha = near ? 0.95 : p.op
        ctx.fill()
        ctx.globalAlpha = 1
      })

      // Cursor glow
      if (m.x !== null) {
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 95)
        g.addColorStop(0, 'rgba(34,211,238,0.09)')
        g.addColorStop(1, 'rgba(34,211,238,0)')
        ctx.beginPath(); ctx.arc(m.x, m.y, 95, 0, Math.PI*2)
        ctx.fillStyle = g; ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    const hdr = canvas.parentElement
    const onMove  = e => { const r=canvas.getBoundingClientRect(); mouseRef.current={x:e.clientX-r.left,y:e.clientY-r.top} }
    const onLeave = () => { mouseRef.current={x:null,y:null} }
    const onClick = e => {
      const r=canvas.getBoundingClientRect()
      for (let i=0;i<7;i++){
        const p=mkP(e.clientX-r.left, e.clientY-r.top)
        p.vx=(Math.random()-0.5)*3.8; p.vy=(Math.random()-0.5)*3.8
        ptsRef.current.push(p)
      }
      if (ptsRef.current.length>120) ptsRef.current=ptsRef.current.slice(-90)
    }

    hdr.addEventListener('mousemove',onMove)
    hdr.addEventListener('mouseleave',onLeave)
    hdr.addEventListener('click',onClick)
    const ro = new ResizeObserver(init)
    ro.observe(hdr)
    init(); draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
      hdr.removeEventListener('mousemove',onMove)
      hdr.removeEventListener('mouseleave',onLeave)
      hdr.removeEventListener('click',onClick)
    }
  }, [])

  return (
    <header
      style={{
        position:'relative', overflow:'hidden',
        background:'var(--topbar-bg)',
        borderBottom:'1px solid var(--border-soft)',
        padding:'26px 26px',
        display:'flex', alignItems:'center', gap:'16px',
        flexShrink: 0,
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:0 }}
      />

      {/* Inner — z-index:1 above canvas */}
      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:'16px', width:'100%' }}>

        {/* Title block */}
        <div>
          <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'22px', color:'var(--text-0)', margin:0, letterSpacing:'-0.01em' }}>
            {title}
          </p>
          {sub && (
            <p style={{ fontSize:'12px', color:'var(--text-2)', marginTop:'3px' }}>
              {sub}
            </p>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex:1 }} />

        {/* Theme switch */}
        <div style={{
          display:'flex', alignItems:'center', gap:'2px',
          background:'var(--card-2)', border:'1px solid var(--border)',
          borderRadius:'10px', padding:'3px',
        }}>
          {[
            { value:'light',  Icon: SunIcon },
            { value:'dark',   Icon: MoonIcon },
            { value:'system', Icon: MonitorIcon },
          ].map(({ value, Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={value}
              style={{
                display:'flex', alignItems:'center', justifyContent:'center',
                width:'30px', height:'28px', borderRadius:'7px',
                border:'none', cursor:'pointer',
                background: theme===value ? 'var(--hover)' : 'transparent',
                color:       theme===value ? '#22D3EE'     : 'var(--text-2)',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { if (theme!==value) e.currentTarget.style.color='var(--text-0)' }}
              onMouseLeave={e => { if (theme!==value) e.currentTarget.style.color='var(--text-2)' }}
            >
              <Icon />
            </button>
          ))}
        </div>

        {/* Online dot */}
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{
            width:'8px', height:'8px', borderRadius:'50%',
            background: backendStatus==='connected' ? '#34D399' : '#FB7185',
            boxShadow:  backendStatus==='connected'
              ? '0 0 7px rgba(52,211,153,0.85)'
              : '0 0 7px rgba(251,113,133,0.85)',
          }} />
          <span style={{
            fontSize:'12px', fontWeight:600,
            color: backendStatus==='connected' ? '#34D399' : '#FB7185',
          }}>
            {backendStatus==='connected' ? 'Online' : 'Offline'}
          </span>
        </div>

      </div>
    </header>
  )
}