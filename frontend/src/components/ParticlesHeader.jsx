/**
 * ParticlesHeader.jsx — Animated Particles Header with Mouse Interaction
 * Vanilla canvas — no external library needed.
 */

import { useEffect, useRef } from 'react'

export default function ParticlesHeader({ activeTab, setActiveTab, backendStatus, tabs }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const particlesRef = useRef([])
  const mouseRef = useRef({ x: null, y: null })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const COLORS = ['#0EA5C9', '#38BDF8', '#C9962C', '#7DD3FC', 'rgba(255,255,255,0.8)']
    const LINK_DIST = 130
    const MOUSE_DIST = 100

    const makeParticle = (x, y) => ({
      x: x ?? Math.random() * canvas.width,
      y: y ?? Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1.8 + 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.5 + 0.3,
    })

    const initParticles = () => {
      const count = Math.max(45, Math.floor((canvas.width * canvas.height) / 14000))
      particlesRef.current = Array.from({ length: count }, () => makeParticle())
    }

    const setSize = () => {
      canvas.width = canvas.parentElement.offsetWidth
      canvas.height = canvas.parentElement.offsetHeight
    }

    setSize()
    initParticles()

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const pts = particlesRef.current
      const mouse = mouseRef.current

      // Move particles + mouse attraction
      pts.forEach(p => {
        if (mouse.x !== null) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_DIST && dist > 0) {
            const force = (MOUSE_DIST - dist) / MOUSE_DIST * 0.05
            p.vx += dx * force * 0.1
            p.vy += dy * force * 0.1
          }
        }

        // Speed cap + friction
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 2.5) { p.vx = (p.vx / speed) * 2.5; p.vy = (p.vy / speed) * 2.5 }
        p.vx *= 0.99
        p.vy *= 0.99

        p.x += p.vx
        p.y += p.vy

        // Wrap edges
        if (p.x < -5) p.x = canvas.width + 5
        if (p.x > canvas.width + 5) p.x = -5
        if (p.y < -5) p.y = canvas.height + 5
        if (p.y > canvas.height + 5) p.y = -5
      })

      // Draw links
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            const nearMouse = mouse.x !== null && (
              Math.sqrt((pts[i].x - mouse.x) ** 2 + (pts[i].y - mouse.y) ** 2) < MOUSE_DIST ||
              Math.sqrt((pts[j].x - mouse.x) ** 2 + (pts[j].y - mouse.y) ** 2) < MOUSE_DIST
            )
            const alpha = (1 - dist / LINK_DIST) * (nearMouse ? 0.8 : 0.2)
            ctx.beginPath()
            ctx.strokeStyle = nearMouse ? `rgba(201,150,44,${alpha})` : `rgba(14,165,201,${alpha})`
            ctx.lineWidth = nearMouse ? 1.2 : 0.7
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      pts.forEach(p => {
        const nearMouse = mouse.x !== null &&
          Math.sqrt((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2) < MOUSE_DIST

        if (nearMouse) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(201,150,44,0.1)'
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, nearMouse ? p.r * 2 : p.r, 0, Math.PI * 2)
        ctx.fillStyle = nearMouse ? '#C9962C' : p.color
        ctx.globalAlpha = nearMouse ? 1 : p.opacity
        ctx.fill()
        ctx.globalAlpha = 1
      })

      // Cursor glow
      if (mouse.x !== null) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_DIST)
        grad.addColorStop(0, 'rgba(14,165,201,0.1)')
        grad.addColorStop(1, 'rgba(14,165,201,0)')
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, MOUSE_DIST, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    // Mouse events on the parent header, not just canvas
    const header = canvas.parentElement
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMouseLeave = () => { mouseRef.current = { x: null, y: null } }
    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      for (let i = 0; i < 8; i++) {
        const p = makeParticle(cx, cy)
        p.vx = (Math.random() - 0.5) * 4
        p.vy = (Math.random() - 0.5) * 4
        particlesRef.current.push(p)
      }
      if (particlesRef.current.length > 120) {
        particlesRef.current = particlesRef.current.slice(-90)
      }
    }

    header.addEventListener('mousemove', onMouseMove)
    header.addEventListener('mouseleave', onMouseLeave)
    header.addEventListener('click', onClick)

    // Handle resize
    const ro = new ResizeObserver(() => {
      setSize()
      initParticles()
    })
    ro.observe(header)

    // Start animation
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
      header.removeEventListener('mousemove', onMouseMove)
      header.removeEventListener('mouseleave', onMouseLeave)
      header.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <header
      className="relative overflow-hidden flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #060F1E 0%, #0A1628 45%, #0C2340 100%)',
        minHeight: '68px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.4)'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
      />

      <div className="relative z-10 flex items-center justify-between px-6 py-3 gap-4">

        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{
              background: 'rgba(14,165,201,0.15)',
              border: '1px solid rgba(14,165,201,0.3)',
              boxShadow: '0 0 12px rgba(14,165,201,0.2)'
            }}
          >
            <img
              src="/luca_logo.png"
              alt="Luca"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentNode.innerHTML =
                  '<span style="color:#C9962C;font-weight:bold;font-size:18px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">L</span>'
              }}
            />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight tracking-wide"
              style={{ textShadow: '0 0 20px rgba(14,165,201,0.3)' }}>
              Luca
            </h1>
            <p className="text-xs font-medium leading-tight" style={{ color: '#0EA5C9' }}>
              by Ledger AI
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 flex-wrap justify-center flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={activeTab === tab.id
                ? { background: 'rgba(14,165,201,0.25)', color: '#38BDF8', border: '1px solid rgba(14,165,201,0.4)', boxShadow: '0 0 10px rgba(14,165,201,0.15)' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid transparent' }
              }
              onMouseEnter={e => { if (activeTab !== tab.id) { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' } }}
              onMouseLeave={e => { if (activeTab !== tab.id) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent' } }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: backendStatus === 'connected' ? '#34D399' : '#F87171',
              boxShadow: backendStatus === 'connected' ? '0 0 8px rgba(52,211,153,0.7)' : '0 0 8px rgba(248,113,113,0.7)'
            }} />
          <span className="text-xs font-medium hidden sm:block"
            style={{ color: backendStatus === 'connected' ? '#34D399' : '#F87171' }}>
            {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>

      </div>
    </header>
  )
}