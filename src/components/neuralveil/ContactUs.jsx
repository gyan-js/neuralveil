import { useState, useEffect, useRef } from 'react'

const CONTACT_REASONS = [
  { id: 'early-access', label: 'EARLY ACCESS', icon: '⬡' },
  { id: 'enterprise', label: 'ENTERPRISE', icon: '◈' },
  { id: 'bug', label: 'BUG REPORT', icon: '◉' },
  { id: 'collab', label: 'COLLAB / RESEARCH', icon: '◎' },
  { id: 'other', label: 'OTHER', icon: '○' },
]

function useIntersectionObserver({ threshold = 0.15 } = {}) {
  const ref = useRef(null)
  const [hasIntersected, setHasIntersected] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasIntersected(true) },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, hasIntersected }
}


function InputField({ label, id, type = 'text', value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          letterSpacing: '0.18em',
          color: focused ? 'var(--ember)' : 'rgba(138, 117, 96, 0.6)',
          textTransform: 'uppercase',
          transition: 'color 0.2s ease',
        }}
      >
        {label}{required && <span style={{ color: 'var(--ember)', marginLeft: '4px' }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: 'rgba(8, 6, 4, 0.8)',
          border: `1px solid ${focused ? 'rgba(232, 101, 10, 0.5)' : 'rgba(138, 117, 96, 0.18)'}`,
          borderRadius: '2px',
          padding: '12px 16px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          color: '#ede8e0',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: focused ? '0 0 0 1px rgba(232, 101, 10, 0.12), inset 0 0 20px rgba(232, 101, 10, 0.02)' : 'none',
          width: '100%',
        }}
      />
    </div>
  )
}

function TextAreaField({ label, id, value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          letterSpacing: '0.18em',
          color: focused ? 'var(--ember)' : 'rgba(138, 117, 96, 0.6)',
          textTransform: 'uppercase',
          transition: 'color 0.2s ease',
        }}
      >
        {label}{required && <span style={{ color: 'var(--ember)', marginLeft: '4px' }}>*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={5}
        style={{
          backgroundColor: 'rgba(8, 6, 4, 0.8)',
          border: `1px solid ${focused ? 'rgba(232, 101, 10, 0.5)' : 'rgba(138, 117, 96, 0.18)'}`,
          borderRadius: '2px',
          padding: '12px 16px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          color: '#ede8e0',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: focused ? '0 0 0 1px rgba(232, 101, 10, 0.12), inset 0 0 20px rgba(232, 101, 10, 0.02)' : 'none',
          width: '100%',
          lineHeight: '1.6',
        }}
      />
    </div>
  )
}

export default function ContactUs() {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 })

  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [reason, setReason] = useState(null)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setStatus('sending')
    setTimeout(() => setStatus('sent'), 1800)
  }

  const anim = (delay) => ({
    opacity: hasIntersected ? 1 : 0,
    transform: hasIntersected ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  })

  return (
    <section
      id="contact"
      ref={ref}
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 8vw 80px',
        background: `
          radial-gradient(ellipse 50% 70% at 80% 30%, rgba(232, 101, 10, 0.07) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 10% 80%, rgba(232, 101, 10, 0.04) 0%, transparent 55%),
          var(--void)
        `,
      }}
    >
      {/* Scan-line overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          opacity: 0.25,
          zIndex: 0,
        }}
      />

      {/* Left edge accent */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: '2px',
          background:
            'linear-gradient(to bottom, transparent, rgba(232,101,10,0.4) 30%, rgba(232,101,10,0.4) 70%, transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Top accent rule */}
      <div
        style={{
          position: 'absolute',
          top: '64px',
          left: '8vw',
          right: '8vw',
          height: '1px',
          background: 'linear-gradient(to right, rgba(232,101,10,0.3), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Corner bracket — top left */}
      <div style={{ position: 'absolute', top: '72px', left: '8vw', pointerEvents: 'none' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M0 24 L0 0 L24 0" stroke="rgba(232,101,10,0.3)" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Corner bracket — bottom right */}
      <div style={{ position: 'absolute', bottom: '72px', right: '8vw', pointerEvents: 'none' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M24 0 L24 24 L0 24" stroke="rgba(232,101,10,0.3)" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Main content grid */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1100px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'start',
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Badge */}
          <div style={anim(0)}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(232, 101, 10, 0.35)',
                borderRadius: '2px',
                padding: '5px 14px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: '#fff',
                backgroundColor: 'rgba(232, 101, 10, 0.06)',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: '#4caf80',
                  boxShadow: '0 0 6px #4caf80',
                  display: 'inline-block',
                }}
              />
              CHANNEL OPEN
            </div>
          </div>

          {/* Heading */}
          <div style={anim(0.1)}>
            <h2
              className="font-bebas"
              style={{
                fontSize: 'clamp(52px, 6.5vw, 96px)',
                lineHeight: '0.91',
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              <span style={{ color: '#ede8e0', display: 'block' }}>REACH</span>
              <span
                style={{
                  background:
                    'linear-gradient(90deg, var(--hot) 0%, var(--flame) 40%, var(--spark) 80%, #fff5e0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'block',
                }}
              >
                THE FORGE
              </span>
            </h2>
          </div>

          {/* Description */}
          <div style={anim(0.2)}>
            <p
              className="font-mono-jb"
              style={{
                fontSize: '13px',
                lineHeight: '1.8',
                color: '#7a6a58',
                margin: 0,
                maxWidth: '420px',
              }}
            >
              Questions about the runtime? Want early access?{' '}
              <span style={{ color: '#b8a890' }}>
                We're a small team — your message goes directly to the engineers who built this.
              </span>{' '}
              No ticketing system, no black holes.
            </p>
          </div>

          {/* Meta links */}
          <div style={{ ...anim(0.45), display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: '// docs.neuralveil.dev', href: '#' },
              { label: '// github/neuralveil', href: '#' },
              { label: '// @neuralveil', href: '#' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: 'rgba(138, 117, 96, 0.5)',
                  letterSpacing: '0.06em',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ember)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(138, 117, 96, 0.5)')}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN — FORM ── */}
        <div style={anim(0.25)}>
          {status === 'sent' ? (
            /* Success state */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '480px',
                gap: '20px',
                border: '1px solid rgba(76, 175, 128, 0.25)',
                borderRadius: '4px',
                backgroundColor: 'rgba(76, 175, 128, 0.03)',
                padding: '48px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(76, 175, 128, 0.12)',
                  border: '1px solid rgba(76, 175, 128, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: '#4caf80',
                }}
              >
                ✓
              </div>
              <h3
                className="font-bebas"
                style={{
                  fontSize: '36px',
                  color: '#4caf80',
                  letterSpacing: '0.06em',
                  margin: 0,
                }}
              >
                MESSAGE RECEIVED
              </h3>
              <p
                className="font-mono-jb"
                style={{ fontSize: '12px', color: '#5a6470', letterSpacing: '0.06em', margin: 0 }}
              >
                nvc.send() → 200 OK — we'll be in touch within 24h
              </p>
              <button
                className="font-mono-jb"
                onClick={() => setStatus('idle')}
                style={{
                  marginTop: '8px',
                  background: 'none',
                  border: '1px solid rgba(138, 117, 96, 0.25)',
                  borderRadius: '2px',
                  padding: '10px 24px',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: 'rgba(138, 117, 96, 0.6)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(232, 101, 10, 0.4)'
                  e.currentTarget.style.color = 'var(--ember)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(138, 117, 96, 0.25)'
                  e.currentTarget.style.color = 'rgba(138, 117, 96, 0.6)'
                }}
              >
                SEND ANOTHER
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                backgroundColor: 'rgba(10, 7, 4, 0.6)',
                border: '1px solid rgba(138, 117, 96, 0.12)',
                borderRadius: '4px',
                padding: '36px',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Reason chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  className="font-mono-jb"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.18em',
                    color: 'rgba(138, 117, 96, 0.6)',
                    textTransform: 'uppercase',
                  }}
                >
                  Reason
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CONTACT_REASONS.map(({ id, label, icon }) => {
                    const active = reason === id
                    return (
                      <button
                        key={id}
                        onClick={() => setReason(id)}
                        className="font-mono-jb"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          fontSize: '10px',
                          letterSpacing: '0.12em',
                          border: `1px solid ${active ? 'rgba(232,101,10,0.6)' : 'rgba(138,117,96,0.2)'}`,
                          borderRadius: '2px',
                          backgroundColor: active ? 'rgba(232,101,10,0.1)' : 'transparent',
                          color: active ? 'var(--ember)' : 'rgba(138,117,96,0.5)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.borderColor = 'rgba(232,101,10,0.35)'
                            e.currentTarget.style.color = 'rgba(232,101,10,0.7)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.borderColor = 'rgba(138,117,96,0.2)'
                            e.currentTarget.style.color = 'rgba(138,117,96,0.5)'
                          }
                        }}
                      >
                        <span style={{ fontSize: '11px' }}>{icon}</span>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  background: 'linear-gradient(to right, rgba(232,101,10,0.15), transparent)',
                }}
              />

              {/* Name + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InputField
                  label="Name"
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ada Lovelace"
                  required
                />
                <InputField
                  label="Email"
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ada@lab.ai"
                  required
                />
              </div>

              {/* Message */}
              <TextAreaField
                label="Message"
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="// what's on your mind..."
                required
              />

              {/* Submit */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <span
                  className="font-mono-jb"
                  style={{ fontSize: '10px', color: 'rgba(138,117,96,0.35)', letterSpacing: '0.06em' }}
                >
                  no tracking. no crm. just us.
                </span>
                <button
                  className="font-mono-jb"
                  onClick={handleSubmit}
                  disabled={status === 'sending' || !form.name || !form.email || !form.message}
                  style={{
                    backgroundColor: status === 'sending' ? 'rgba(232,101,10,0.5)' : 'var(--ember)',
                    color: 'var(--void)',
                    border: 'none',
                    padding: '13px 32px',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    fontWeight: '700',
                    cursor: status === 'sending' || !form.name || !form.email || !form.message ? 'not-allowed' : 'pointer',
                    borderRadius: '2px',
                    opacity: !form.name || !form.email || !form.message ? 0.45 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: form.name && form.email && form.message
                      ? '0 0 20px rgba(232, 101, 10, 0.3)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (form.name && form.email && form.message && status !== 'sending') {
                      e.currentTarget.style.backgroundColor = 'var(--flame)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--ember)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {status === 'sending' ? (
                    <>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--void)',
                          borderTopColor: 'transparent',
                          display: 'inline-block',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />
                      TRANSMITTING
                    </>
                  ) : (
                    'TRANSMIT →'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(to bottom, transparent, var(--void))',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder, textarea::placeholder {
          color: rgba(138, 117, 96, 0.28);
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </section>
  )
}