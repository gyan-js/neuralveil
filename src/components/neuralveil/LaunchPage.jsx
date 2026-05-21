import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import { useState, useEffect } from 'react'
import ForgeCircuit from '../../assets/svgs/ForgeCircuit'

const codeLines = [
  '// catch shape errors before the cluster does',
  '// no OOM surprises, no guessing',
  '// your model, fully understood',
]

function getTimeUntilLaunch() {
  const now = new Date()

  // May is month 4 because months are 0-indexed
  const launchDate = new Date(now.getFullYear(), 4, 30, 23, 59, 59)

  const diff = launchDate - now

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

function CountdownUnit({ value, label }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        minWidth: '64px',
      }}
    >
      <div
        className="font-bebas"
        style={{
          fontSize: 'clamp(32px, 4vw, 52px)',
          lineHeight: 1,
          color: 'var(--ember)',
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
          filter: 'drop-shadow(0 0 12px rgba(232, 101, 10, 0.5))',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div
        className="font-mono-jb"
        style={{
          fontSize: '9px',
          letterSpacing: '0.16em',
          color: 'rgba(138, 117, 96, 0.5)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function CountdownDivider() {
  return (
    <div
      className="font-bebas"
      style={{
        fontSize: '36px',
        color: 'rgba(232, 101, 10, 0.3)',
        lineHeight: 1,
        marginBottom: '18px',
        letterSpacing: 0,
      }}
    >
      :
    </div>
  )
}

export default function LaunchPage() {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.2 })
  const [countdown, setCountdown] = useState(getTimeUntilLaunch())
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleNotify = () => {
    if (!email.trim()) return
    setSubmitted(true)
    setEmail('')
    setTimeout(() => setSubmitted(false), 2000)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilLaunch())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
    id='launch'
      ref={ref}
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212, 175, 55, 0.18) 0%, rgba(15, 11, 7, 0.95) 55%, var(--void) 100%)
        `,
      }}
    >
     
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          filter: 'hue-rotate(30deg) saturate(1.2) brightness(1.1)',
        }}
      >
        <ForgeCircuit opacity={0.06} width={900} height={900} animate={true} />
      </div>

    
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'cta-pulse 4s ease-in-out infinite',
        }}
      />

     
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          marginBottom: '32px',
          opacity: hasIntersected ? 1 : 0,
          transform: hasIntersected ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'all 0.6s ease 0s',
        }}
      >
        <div
          className="font-mono-jb font-bold"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(232, 101, 10, 0.4)',
            borderRadius: '2px',
            padding: '6px 16px',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: '#fff',
            backgroundColor: 'rgba(232, 101, 10, 0.06)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--ember)',
              display: 'inline-block',
              animation: 'cta-pulse 1.5s ease-in-out infinite',
            }}
          />
          LAUNCHING END OF MONTH
        </div>
      </div>

  
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '0 8vw',
          maxWidth: '900px',
        }}
      >
    
        <h2
          className="font-bebas"
          style={{
            fontSize: 'clamp(60px, 8.5vw, 120px)',
            lineHeight: '0.92',
            letterSpacing: '0.02em',
            marginBottom: '48px',
            opacity: hasIntersected ? 1 : 0,
            transform: hasIntersected ? 'scale(1)' : 'scale(0.94)',
            transition: 'all 0.8s cubic-bezier(0.34, 1.2, 0.64, 1) 0.1s',
          }}
        >
          <span style={{ color: '#ede8e0', display: 'block' }}>LET'S</span>
          <span
            style={{
              background: 'linear-gradient(90deg, var(--hot) 0%, var(--flame) 30%, var(--spark) 70%, #fff5e0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'block',
            }}
          >
            CONNECT THE
          </span>
          <span style={{ color: '#ede8e0', display: 'block' }}>DOTS</span>
        </h2>

        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '56px',
          }}
        >
          {codeLines.map((line, i) => (
            <p
              key={i}
              className="font-mono-jb"
              style={{
                fontSize: '13px',
                color: hasIntersected ? 'var(--ember)' : 'var(--ash)',
                letterSpacing: '0.06em',
                margin: 0,
                opacity: hasIntersected ? 1 : 0,
                transform: hasIntersected ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.6s ease ${0.4 + i * 0.15}s`,
              }}
            >
              {line}
            </p>
          ))}
        </div>

     
        <div
          style={{
            opacity: hasIntersected ? 1 : 0,
            transform: hasIntersected ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 0.7s',
            marginBottom: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <CountdownUnit value={countdown.days} label="days" />
          <CountdownDivider />
          <CountdownUnit value={countdown.hours} label="hours" />
          <CountdownDivider />
          <CountdownUnit value={countdown.minutes} label="min" />
          <CountdownDivider />
          <CountdownUnit value={countdown.seconds} label="sec" />
        </div>

  
        <div
          style={{
            opacity: hasIntersected ? 1 : 0,
            transform: hasIntersected ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 0.85s',
            marginBottom: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0',
              border: '1px solid rgba(138, 117, 96, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <style>{`
              .notify-input::placeholder { color: rgba(138,117,96,0.5); }
              .notify-input.submitted::placeholder { color: #ffffff; }
            `}</style>
           
          </div>
        </div>

      
        <p
          className="font-mono-jb"
          style={{
            fontSize: '11px',
            color: 'var(--ash)',
            letterSpacing: '0.06em',
            opacity: hasIntersected ? 0.7 : 0,
            transition: 'opacity 0.7s ease 1.1s',
            marginBottom: '20px'
          }}
        >
          neuralveil v3.0.1 — research grade. no cloud. no telemetry.
        </p>
      </div>
    </section>
  )
}