import { useState, useEffect } from 'react'

function TerminalLine({ line, type, delay, onDone }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= line.length) {
      onDone && onDone()
      return
    }
    const t = setTimeout(() => {
      setDisplayed(line.slice(0, displayed.length + 1))
    }, 22 + Math.random() * 20)
    return () => clearTimeout(t)
  }, [started, displayed, line])

  const color = type === 'error'
    ? '#ff6b6b'
    : type === 'warning'
    ? '#ffb347'
    : '#b8a890'

  const isIndented = line.startsWith('  ')

  return (
    <span
      className="font-mono-jb"
      style={{
        fontSize: '12px',
        color: isIndented ? '#8a7560' : color,
        display: 'block',
        minHeight: '18px',
        lineHeight: '1.7',
        whiteSpace: 'pre',
      }}
    >
      {displayed}
    </span>
  )
}

export default function Terminal({ errors, title, punchline, active }) {
  const [doneCount, setDoneCount] = useState(0)
  const [showPunchline, setShowPunchline] = useState(false)


  const allLines = errors.flatMap((err) =>
    err.lines.map((line, li) => ({ line, type: err.type, isLast: li === err.lines.length - 1 }))
  )

  // Compute cumulative delays
  const lineDelays = []
  let acc = 0
  allLines.forEach(({ line }) => {
    lineDelays.push(acc)
    acc += line.length * 24 + 400
  })

  useEffect(() => {
    if (!active) return
    if (doneCount >= allLines.length) {
      const t = setTimeout(() => setShowPunchline(true), 400)
      return () => clearTimeout(t)
    }
  }, [doneCount, allLines.length, active])

  if (!active) return null

  return (
    <div
      style={{
        backgroundColor: '#0d0d0d',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(138, 117, 96, 0.2)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}
    >

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          backgroundColor: '#161616',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {[{ c: '#ff5f57' }, { c: '#febc2e' }, { c: '#28c840' }].map((dot, i) => (
          <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dot.c }} />
        ))}
        <span
          className="font-mono-jb"
          style={{ fontSize: '11px', color: 'var(--ash)', marginLeft: '8px', letterSpacing: '0.06em' }}
        >
          {title}
        </span>
      </div>


      <div style={{ padding: '20px 24px', minHeight: '200px' }}>
        <div style={{ marginBottom: '8px' }}>
          {allLines.map((item, i) => (
            <TerminalLine
              key={i}
              line={item.line}
              type={item.type}
              delay={lineDelays[i]}
              onDone={() => setDoneCount((c) => Math.max(c, i + 1))}
            />
          ))}
        </div>

      
        {doneCount < allLines.length ? (
          <span
            className="animate-blink"
            style={{
              display: 'inline-block',
              width: '7px',
              height: '13px',
              backgroundColor: 'var(--ember)',
              verticalAlign: 'text-bottom',
              marginTop: '4px',
            }}
          />
        ) : showPunchline ? (
          <div
            className="font-mono-jb"
            style={{
              fontSize: '12px',
              color: 'var(--ember)',
              marginTop: '16px',
              borderTop: '1px solid rgba(232, 101, 10, 0.2)',
              paddingTop: '12px',
              animation: 'fade-up 0.5s ease forwards',
            }}
          >
            {punchline}
          </div>
        ) : null}
      </div>
    </div>
  )
}
