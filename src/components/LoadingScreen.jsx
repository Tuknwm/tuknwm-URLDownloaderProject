import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

function Clock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false }))
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ position: 'absolute', top: 25, left: 25, zIndex: 10, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>{date || 'Loading...'}</div>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{time || '00:00:00'}</div>
    </div>
  )
}

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false)
  const svgRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => { if (!sessionStorage.getItem('hasVisited')) setVisible(true) }, [])

  useEffect(() => {
    if (!visible) return
    const svg = svgRef.current
    const overlay = overlayRef.current
    if (!svg || !overlay) return

    const latinStroke = svg.querySelector('#kurokyu-stroke')
    const curvePath = overlay.querySelector('#curvePath')
    const emojiEl = overlay.querySelector('#emoji-exit')
    const pathLength = (latinStroke?.getComputedTextLength?.() ?? 600) * 2 || 1200

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('hasVisited', '1')
        setVisible(false)
        window.dispatchEvent(new Event('loading-complete'))
      }
    })

    gsap.set('#text-group', { scale: 2, opacity: 0 })
    if (latinStroke) gsap.set(latinStroke, { strokeDasharray: pathLength, strokeDashoffset: pathLength, opacity: 0 })

    tl.to('#text-group', { scale: 1, opacity: 1, duration: 1.5, ease: 'expo.out' })
    tl.fromTo('.text-path', { strokeDasharray: 450, strokeDashoffset: 450 }, { strokeDashoffset: 0, duration: 1.5, stagger: 0.1, ease: 'power2.inOut' }, '-=0.5')

    const flicker = (el, delay) => gsap.timeline({ delay })
      .to(el, { opacity: 0.7, duration: 0.05 })
      .to(el, { opacity: 0.1, duration: 0.04 })
      .to(el, { opacity: 1, duration: 0.1, filter: 'drop-shadow(0 0 25px #fff)' })

    tl.addLabel('neon')
    overlay.querySelectorAll('.left-side .char-fill').forEach((el, i) => tl.add(flicker(el, i * 0.1), 'neon'))
    Array.from(overlay.querySelectorAll('.right-side .char-fill')).reverse().forEach((el, i) => tl.add(flicker(el, i * 0.1), 'neon'))

    if (latinStroke) {
      tl.addLabel('latin', '-=0.3')
      tl.to(latinStroke, { opacity: 1, duration: 0.1 }, 'latin')
      tl.to(latinStroke, { strokeDashoffset: 0, duration: 2.5, ease: 'power3.inOut' }, 'latin')
      tl.to(latinStroke, { opacity: 0.18, duration: 1.5 }, '-=0.5')
    }

    if (emojiEl) tl.to(emojiEl, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out' }, '+=0.5')

    tl.addLabel('exit', '+=1.5')
    tl.to('.bs-info, .bs-bottom-left, #emoji-exit, .loader-container', { opacity: 0, y: -20, duration: 0.5, stagger: 0.05 }, 'exit')
    if (curvePath) tl.to(curvePath, { attr: { d: 'M 0,0 L 1,0 L 1,0 Q 0.5,-0.2 0,0 Z' }, duration: 1.5, ease: 'expo.inOut' }, 'exit')

    return () => tl.kill()
  }, [visible])

  if (!visible) return null

  const chars = [
    { char: 'く', x: -180, side: 'left' },
    { char: 'ろ', x: -90, side: 'left' },
    { char: 'き', x: 0, side: 'right' },
    { char: 'ゅ', x: 90, side: 'right' },
    { char: 'う', x: 180, side: 'right' },
  ]

  return (
    <div ref={overlayRef} style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, fontFamily: 'Montserrat, sans-serif', color: '#fff', overflow: 'hidden', clipPath: 'url(#curveClip)' }}>
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <clipPath id="curveClip" clipPathUnits="objectBoundingBox">
            <path id="curvePath" d="M 0,0 L 1,0 L 1,1 Q 0.5,1 0,1 Z" />
          </clipPath>
        </defs>
      </svg>
      <Clock />
      <div className="bs-bottom-left" style={{ position: 'absolute', bottom: 25, left: 25, fontSize: 14, fontWeight: 300, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, zIndex: 10 }}>Tuknwm</div>
      <div id="emoji-exit" style={{ position: 'absolute', bottom: 25, right: 25, fontSize: 24, fontWeight: 900, opacity: 0, transform: 'translateY(20px)', zIndex: 10 }}>＞︿＜</div>
      <div className="loader-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
        <svg ref={svgRef} viewBox="0 0 1000 300" style={{ width: '100%', maxWidth: 900, overflow: 'visible' }}>
          <g id="text-group" transform="translate(500, 150)">
            {chars.map(({ char, x, side }) => (
              <g key={char} className={`char-unit ${side}-side`} transform={`translate(${x}, 0)`}>
                <text textAnchor="middle" dominantBaseline="middle" fontSize="90" fontWeight="bold" style={{ fill: 'transparent', stroke: '#333', strokeWidth: 1.5, strokeLinecap: 'round' }} className="text-path">{char}</text>
                <text textAnchor="middle" dominantBaseline="middle" fontSize="90" fontWeight="bold" style={{ fill: '#fff', opacity: 0, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }} className="char-fill">{char}</text>
              </g>
            ))}
          </g>
          <g transform="translate(500, 150) scale(1, 0.85)">
            <text id="kurokyu-stroke" textAnchor="middle" dominantBaseline="middle" style={{ fill: 'transparent', stroke: 'rgba(255,255,255,0.22)', strokeWidth: 1, fontSize: 148, fontFamily: '"DM Sans", sans-serif', fontWeight: 800, letterSpacing: 10 }}>KUROKYU</text>
          </g>
        </svg>
      </div>
    </div>
  )
}
