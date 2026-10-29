import { useState, useRef, useEffect } from 'react'
import CustomSelect from './CustomSelect.jsx'

const API_BASE = 'https://api.kurokyu.web.id'

function isTikTokUrl(url) {
  return /tiktok\.com/i.test(url) || /vm\.tiktok\.com/i.test(url) || /vt\.tiktok\.com/i.test(url)
}

function formatDuration(secs) {
  if (!secs) return ''
  secs = parseInt(secs)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TikTokDownloader() {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('mp4')
  const [status, setStatus] = useState({ msg: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [progress, setProgress] = useState({ visible: false, indeterminate: true, pct: 0, label: '' })
  const [preview, setPreview] = useState(null)
  const [videoData, setVideoData] = useState(null)
  const [dlLink, setDlLink] = useState(null)
  const [resolutions, setResolutions] = useState([])
  const [selRes, setSelRes] = useState(0)
  const debounceRef = useRef(null)
  const dlRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    if (dlLink && dlRef.current) {
      const t = setTimeout(() => dlRef.current?.click(), 300)
      return () => clearTimeout(t)
    }
  }, [dlLink])

  function showProgress(indeterminate = true, pct = 0, label = 'Processing...') {
    setProgress({ visible: true, indeterminate, pct, label })
  }
  function hideProgress() {
    setProgress(p => ({ ...p, visible: false }))
  }

  async function fetchInfo(ttUrl) {
    setVideoData(null)
    setPreview(null)
    setDlLink(null)
    setStatus({ msg: '', type: '' })
    setFetching(true)
    try {
      const res = await fetch(`${API_BASE}/info?url=${encodeURIComponent(ttUrl)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVideoData({ ...data, _originalUrl: ttUrl })
      setResolutions(data.formats || [])
      setSelRes(0)
      setPreview(data)
    } catch (err) {
      setStatus({ msg: err.message, type: 'error' })
    } finally {
      setFetching(false)
    }
  }

  function handleInput(val) {
    setUrl(val)
    setDlLink(null)
    setPreview(null)
    setVideoData(null)
    clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setStatus({ msg: '', type: '' })
      return
    }
    if (isTikTokUrl(val)) {
      debounceRef.current = setTimeout(() => fetchInfo(val), 700)
    } else {
      setStatus({ msg: 'Please enter a valid TikTok URL', type: 'error' })
    }
  }

  function handlePaste(e) {
    clearTimeout(debounceRef.current)
    setTimeout(() => {
      const val = e.target.value
      if (isTikTokUrl(val)) fetchInfo(val)
    }, 50)
  }

  async function startDownload() {
    if (!isTikTokUrl(url)) {
      setStatus({ msg: 'Please enter a valid TikTok URL', type: 'error' })
      return
    }
    let data = videoData
    if (!data) {
      await fetchInfo(url)
      return
    }
    setDlLink(null)
    setLoading(true)
    if (format === 'mp4') {
      await downloadMp4(data)
    } else {
      await downloadMp3(data)
    }
    setLoading(false)
  }

  async function downloadMp4(data) {
    showProgress(true, 0, 'Preparing...')
    try {
      const safe = (data.title || 'tiktok').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 60)
      const filename = (safe || 'tiktok') + '.mp4'
      const fmt = data.formats?.[selRes] ?? data.formats?.[0]
      const fmtId = fmt?.id ? `${fmt.id}+bestaudio/best` : 'best'
      const params = new URLSearchParams({
        url: data._originalUrl,
        fmt_id: fmtId,
        title: data.title || 'tiktok',
      })
      hideProgress()
      setDlLink({ url: `${API_BASE}/download?${params}`, filename })
      setStatus({ msg: '', type: '' })
    } catch (err) {
      hideProgress()
      setStatus({ msg: err.message, type: 'error' })
    }
  }

  async function downloadMp3(data) {
    setStatus({ msg: 'Extracting audio...', type: '' })
    showProgress(true, 0, 'Converting to MP3...')
    try {
      const params = new URLSearchParams({
        url: data._originalUrl,
        title: data.title || 'tiktok_audio',
      })
      const dlUrl = `${API_BASE}/download-audio?${params}`
      const safe = (data.title || 'tiktok_audio').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 60)
      const filename = (safe || 'tiktok_audio') + '.mp3'
      hideProgress()
      setDlLink({ url: dlUrl, filename })
      setStatus({ msg: '', type: '' })
    } catch (err) {
      hideProgress()
      setStatus({ msg: 'Error: ' + err.message, type: 'error' })
    }
  }

  return (
    <div className="app">
      <aside className="info-panel">
        <div className="info-inner">
          <div className="info-top intro-animate intro-d1">
            <h1 className="info-title parallax-title">
              <span className="title-stroke-wrap">
                <span className="title-stroke-layer">Tiktok</span>
                <span className="title-fill-layer">Tiktok</span>
              </span>
            </h1>
            <p className="info-email parallax-desc">
              Save TikTok videos without watermark, or extract the audio as MP3.
              Just paste the link — no app needed, no account required.<br /><br />
              Feel free to use ＞︿＜, though some videos or audio may not be available for download.
            </p>
            <audio ref={audioRef} src="/doge.mp3" preload="auto" />
            <img
              src="/doge.jpg" alt="doge"
              className="doge-img parallax-img"
              style={{ cursor: 'pointer' }}
              onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play() } }}
            />
          </div>
          <div className="info-bottom-wrapper">
            <div className="info-col">
              <div className="col-links">
                <a href="https://github.com/Tuknwm" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18, fill: 'currentColor', flexShrink: 0 }}>
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="form-panel">
        <div className="form-inner">
          <div className="form-left">
            <h2 className="form-title intro-animate intro-d2">
              TikTok Time! (≧▽≦)<br />
              <span className="info-email">Paste your TikTok link below.</span>
            </h2>

            <div className="field intro-animate intro-d3">
              <label className="field-label" htmlFor="ttUrlInput">TikTok URL</label>
              <div className="field-input-wrap">
                <input
                  id="ttUrlInput" className="field-input" type="text"
                  placeholder="Paste your TikTok link" autoComplete="off" spellCheck="false"
                  value={url}
                  onChange={e => handleInput(e.target.value)}
                  onPaste={handlePaste}
                />
                {!url && (
                  <button className="paste-btn" type="button" onClick={async () => { try { const t = await navigator.clipboard.readText(); if (t) handleInput(t) } catch {} }}>Paste</button>
                )}
                {url && (
                  <button className="clear-btn" onClick={() => { setUrl(''); setPreview(null); setDlLink(null); setStatus({ msg: '', type: '' }); setVideoData(null) }}>✕</button>
                )}
              </div>
            </div>

            <div className="field intro-animate intro-d4 format-res-row">
              <div style={{ flex: 1 }}>
                <label className="field-label">Format</label>
                <div className="format-options">
                  <span className={`format-opt${format === 'mp4' ? ' active' : ''}`} onClick={() => { setFormat('mp4'); setDlLink(null) }}>MP4</span>
                  <span className="format-sep">|</span>
                  <span className={`format-opt${format === 'mp3' ? ' active' : ''}`} onClick={() => { setFormat('mp3'); setDlLink(null) }}>MP3</span>
                </div>
              </div>
              {format === 'mp4' && resolutions.length > 1 && (
                <div style={{ flex: 1 }}>
                  <label className="field-label">Resolution</label>
                  <CustomSelect options={resolutions} value={selRes} onChange={setSelRes} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button className="submit-btn" disabled={loading || fetching || !preview} onClick={startDownload} style={{ width: '100%' }}>
                <span className="submit-text">Download</span>
                <span className="submit-arrow">→</span>
              </button>
            </div>
          </div>

          {dlLink && <a ref={dlRef} href={dlLink.url} download={dlLink.filename} style={{ display: 'none' }} />}
          <div className="form-right">
            {fetching ? (
              <div className="form-right-status">
                <div className="fetch-dots">
                  <span /><span /><span />
                </div>
                <span className="fetch-label">Fetching...</span>
              </div>
            ) : loading ? (
              <div className="form-right-status">
                <div className="fetch-spinner" />
                <span className="fetch-label">{progress.label || 'Processing...'}</span>
              </div>
            ) : status.type === 'error' ? (
              <div className="form-right-status">
                <span className="fetch-error">{status.msg}</span>
              </div>
            ) : preview ? (
              <>
                <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <img className="preview-thumb" src={preview.thumbnail} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div className="preview-info" style={{ width: '100%' }}>
                  <p className="preview-title">{preview.title}</p>
                  <p className="preview-channel">{preview.channel}</p>
                  <p className="preview-duration">{preview.duration ? formatDuration(preview.duration) : ''}</p>
                </div>
              </>
            ) : (
              <div className="form-right-empty">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ fill: 'currentColor', stroke: 'none' }}>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                </svg>
                <span>Paste a link to preview</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
