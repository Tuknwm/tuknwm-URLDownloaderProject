import { useState, useEffect, useRef } from 'react'
import RibbonGlow from './components/RibbonGlow.jsx'
import YouTubeDownloader from './components/YouTubeDownloader.jsx'
import TikTokDownloader from './components/TikTokDownloader.jsx'
import XDownloader from './components/XDownloader.jsx'
import InstagramDownloader from './components/InstagramDownloader.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'

function PaperGrain() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const cfg = { fps: 12, grainSize: 1 }
    let lastFrame = 0
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    function drawGrain() {
      const w = canvas.width, h = canvas.height
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255 | 0
        data[i] = v; data[i+1] = v; data[i+2] = v; data[i+3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
    }
    function loop(ts) {
      requestAnimationFrame(loop)
      if (ts - lastFrame < 1000 / cfg.fps) return
      lastFrame = ts; drawGrain()
    }
    loop(0)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return (
    <canvas ref={ref} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 1, opacity: 0.1,
    }} />
  )
}

function MouseTrail() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const cfg = { color: '#ffffff', maxPoints: 50, dashSize: 5, gapSize: 10, maxWidth: 5 }
    let points = [], mouseX = -999, mouseY = -999, isIdle = false, idleTimer = null
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX; mouseY = e.clientY; isIdle = false
      clearTimeout(idleTimer); idleTimer = setTimeout(() => { isIdle = true }, 150)
      points.push({ x: e.clientX, y: e.clientY, opacity: 1 })
      if (points.length > cfg.maxPoints) points.shift()
    })
    function hexToRgba(hex, a) {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
      return `rgba(${r},${g},${b},${a})`
    }
    function draw() {
      requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (isIdle && points.length > 0) {
        for (let i = 0; i < points.length; i++) {
          const d = points.length - 1 - i
          points[i].opacity -= 0.01 + (d / points.length) * 0.02
        }
        points = points.filter(p => p.opacity > 0)
      }
      if (points.length < 2) return
      for (let i = 1; i < points.length; i++) {
        const progress = i / points.length
        const alpha = progress * 0.85 * (points[i].opacity ?? 1)
        ctx.beginPath()
        ctx.setLineDash([cfg.dashSize, cfg.gapSize])
        ctx.lineDashOffset = -i * 1.5
        ctx.strokeStyle = hexToRgba(cfg.color, alpha)
        ctx.lineWidth = progress * cfg.maxWidth + 0.5
        ctx.lineCap = 'round'
        ctx.moveTo(points[i-1].x, points[i-1].y)
        ctx.lineTo(points[i].x, points[i].y)
        ctx.stroke()
      }
      if (!isIdle && points.length > 0) {
        const tip = points[points.length - 1]
        ctx.beginPath(); ctx.setLineDash([])
        ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(cfg.color, 0.9); ctx.fill()
      }
    }
    draw()
    return () => window.removeEventListener('resize', resize)
  }, [])
  return (
    <canvas ref={ref} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 9999,
    }} />
  )
}

const YT_PATH = `M117.5 13.1 C116.2 8.3 112.4 4.5 107.6 3.2 C98.2 0.7 60 0.7 60 0.7 C60 0.7 21.8 0.7 12.4 3.2 C7.6 4.5 3.8 8.3 2.5 13.1 C0 22.5 0 42 0 42 C0 42 0 61.5 2.5 70.9 C3.8 75.7 7.6 79.5 12.4 80.8 C21.8 83.3 60 83.3 60 83.3 C60 83.3 98.2 83.3 107.6 80.8 C112.4 79.5 116.2 75.7 117.5 70.9 C120 61.5 120 42 120 42 C120 42 120 22.5 117.5 13.1Z`
const TT_PATH = `M78.4 27.6 C72.1 25.4 67 20.3 65 13.9 C64.4 11.9 64.1 9.8 64.1 7.6 L64.1 7 L46.5 7 L46.5 73.2 C46.5 79.5 41.4 84.6 35.1 84.6 C28.8 84.6 23.7 79.5 23.7 73.2 C23.7 66.9 28.8 61.8 35.1 61.8 C36.4 61.8 37.6 62 38.8 62.4 L38.8 44.4 C37.6 44.2 36.4 44.1 35.1 44.1 C19.1 44.1 6.1 57.2 6.1 73.2 C6.1 89.2 19.1 102.3 35.1 102.3 C51.1 102.3 64.1 89.2 64.1 73.2 L64.1 39.4 C70.5 44 78.3 46.7 86.7 46.7 L86.7 29.1 C83.1 29.1 80.6 28.5 78.4 27.6Z`
const X_PATH = `M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z`
const IG_PATH = `M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z`

const HEAD_STYLES = `
/* "Instagram" is ~6.6em wide; info panel content is 34vw on desktop, 100vw-56px on mobile */
.info-title { font-size: clamp(36px, 5vw, 88px) !important; }
@media (max-width: 768px) { .info-title { font-size: clamp(36px, 12vw, 64px) !important; } }
.info-email { font-size: 15px !important; }
.col-title { font-size: 12px !important; }
.col-links a { font-size: 13px !important; }
.col-desc { font-size: 13px !important; }
.deco-logo {
  position: fixed; right: -100px; top: 50%; transform: translateY(-50%);
  width: 220px; height: 220px; z-index: 1; pointer-events: none;
  opacity: 0; transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1); overflow: visible;
}
@media (max-width: 768px) { .deco-logo { z-index: -1; } }
.deco-logo.visible { opacity: 1; }
.deco-logo svg { width:100%;height:100%;fill:none;stroke:var(--text);stroke-width:3px;opacity:0.08; }
.deco-logo.visible svg path, .deco-logo.visible svg .deco-path {
  stroke-dasharray: 2000; stroke-dashoffset: 2000;
  animation: decoStroke 1.8s cubic-bezier(0.4,0,0.2,1) 0.3s forwards;
}
@keyframes decoStroke { to { stroke-dashoffset: 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner { display:inline-block;width:14px;height:14px;border:2px solid var(--border);border-top-color:var(--text);border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle; }
.title-stroke-wrap { display:inline-block;line-height:1.15;position:relative;padding-bottom:0.12em; }
.title-stroke-layer { display:block;white-space:nowrap;color:transparent;-webkit-text-stroke:1.8px var(--text);animation:strokeAppear 0.7s cubic-bezier(0.22,1,0.36,1) forwards;position:relative;visibility:visible; }
.title-fill-layer { display:block;color:var(--text);-webkit-text-stroke:0px transparent;clip-path:inset(0 100% 0 0);animation:fillReveal 0.9s cubic-bezier(0.76,0,0.24,1) 0.55s forwards;position:absolute;inset:0;white-space:nowrap; }
@keyframes strokeAppear { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes fillReveal { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0% 0 0)} }
`

export default function App() {
  const [page, setPage] = useState('yt')
  const [navReady, setNavReady] = useState(() => !!sessionStorage.getItem('hasVisited'))

  useEffect(() => {
    const handler = () => setNavReady(true)
    window.addEventListener('loading-complete', handler)
    return () => window.removeEventListener('loading-complete', handler)
  }, [])

function navigateTo(p) {
    setPage(p)
  }

  return (
    <>
      <LoadingScreen />
      <style>{HEAD_STYLES}</style>

      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <RibbonGlow background="#0a0608" color1="#2872A1" color2="#CBDDE9" angle={0} />
      </div>
      <PaperGrain />
      {navReady && !('ontouchstart' in window) && <MouseTrail />}
      <nav className="navbar" style={{ opacity: navReady ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <button className={`nav-item${page === 'yt' ? ' active' : ''}`} onClick={() => navigateTo('yt')}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          YouTube
        </button>
        <div className="nav-sep" />
        <button className={`nav-item${page === 'tt' ? ' active' : ''}`} onClick={() => navigateTo('tt')}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
          </svg>
          TikTok
        </button>
        <div className="nav-sep" />
        <button className={`nav-item${page === 'x' ? ' active' : ''}`} onClick={() => navigateTo('x')}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X
        </button>
        <div className="nav-sep" />
        <button className={`nav-item${page === 'ig' ? ' active' : ''}`} onClick={() => navigateTo('ig')}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
          </svg>
          Instagram
        </button>
        <div className="nav-sep" />
        <button className="nav-item" style={{ opacity: 0.4, cursor: 'default' }}>Soon</button>
      </nav>

      <div style={{ position: 'relative', zIndex: 2, opacity: navReady ? 1 : 0, transform: navReady ? 'translateY(0)' : 'translateY(28px)', transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s' }}>
      <div className={`page${page === 'yt' ? ' page-active' : ''}`}>
        <YouTubeDownloader />
      </div>
      <div className={`page${page === 'tt' ? ' page-active' : ''}`}>
        <TikTokDownloader />
      </div>
      <div className={`page${page === 'x' ? ' page-active' : ''}`}>
        <XDownloader />
      </div>
      <div className={`page${page === 'ig' ? ' page-active' : ''}`}>
        <InstagramDownloader />
      </div>
      <div className={`deco-logo${page === 'yt' ? ' visible' : ''}`}>
        <svg viewBox="0 0 120 84" xmlns="http://www.w3.org/2000/svg">
          <path className="deco-path" d={YT_PATH} />
          <path className="deco-path" d="M48 30 L80 42 L48 54 Z" />
        </svg>
      </div>
      <div className={`deco-logo${page === 'tt' ? ' visible' : ''}`}>
        <svg viewBox="0 0 96 110" xmlns="http://www.w3.org/2000/svg">
          <path className="deco-path" d={TT_PATH} />
        </svg>
      </div>
      <div className={`deco-logo${page === 'x' ? ' visible' : ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ fill: 'var(--text)', stroke: 'none', opacity: 0.08 }}>
          <path d={X_PATH} />
        </svg>
      </div>
      <div className={`deco-logo${page === 'ig' ? ' visible' : ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ fill: 'var(--text)', stroke: 'none', opacity: 0.08 }}>
          <path d={IG_PATH} />
        </svg>
      </div>
      </div>
    </>
  )
}
