import { useState, useRef, useEffect } from 'react'

export default function CustomSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options[value] ?? options[0]

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="cselect" ref={ref}>
      <button className={`cselect-trigger${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} type="button">
        <span>{selected?.label || selected?.height + 'p'}</span>
        <svg viewBox="0 0 10 6" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
      </button>
      {open && (
        <ul className="cselect-list">
          {options.map((f, i) => (
            <li
              key={i}
              className={`cselect-item${i === value ? ' active' : ''}`}
              onClick={() => { onChange(i); setOpen(false) }}
            >
              {f.label || f.height + 'p'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
