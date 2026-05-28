import { useState, useEffect, useRef } from 'react'
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID  = 'service_axab7nw'
const EMAILJS_TEMPLATE_ID = 'template_n4einpl'
const EMAILJS_PUBLIC_KEY  = '1EjrU_TEcsUbX1bbe'


const CONTACT_REASONS = [
  { id: 'early-access',  label: 'EARLY ACCESS',     icon: '⬡' },
  { id: 'feedback',    label: 'FEEDBACK',        icon: '◈' },
  { id: 'bug',           label: 'BUG REPORT',        icon: '◉' },
  { id: 'collab',        label: 'COLLAB / RESEARCH', icon: '◎' },
  { id: 'other',         label: 'OTHER',             icon: '○' },
]

function buildEmailHtml({ name, email, message, reason }) {
  const reasonLabel = CONTACT_REASONS.find(r => r.id === reason)?.label ?? reason ?? 'GENERAL'
  const reasonIcon  = CONTACT_REASONS.find(r => r.id === reason)?.icon  ?? '○'
  const ts = new Date().toLocaleString('en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NeuralVeil – Incoming Transmission</title>
</head>
<body style="margin:0;padding:0;background:#080604;font-family:'Courier New',Courier,monospace;">

<!-- outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080604;padding:40px 0;">
<tr><td align="center">

  <!-- card -->
  <table width="600" cellpadding="0" cellspacing="0"
         style="max-width:600px;background:#0d0a07;border:1px solid rgba(232,101,10,0.25);border-radius:4px;overflow:hidden;">

    <!-- top ember bar -->
    <tr>
      <td style="height:3px;background:linear-gradient(90deg,#e8650a 0%,#ff8c38 50%,#e8650a 100%);"></td>
    </tr>

    <!-- header -->
    <tr>
      <td style="padding:36px 40px 24px;background:linear-gradient(135deg,rgba(232,101,10,0.08) 0%,transparent 60%);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <!-- wordmark -->
              <div style="display:inline-block;border:1px solid rgba(232,101,10,0.35);border-radius:2px;padding:5px 14px;
                           font-size:10px;letter-spacing:0.2em;color:#ffffff;background:rgba(232,101,10,0.06);">
                ● &nbsp;NEURALVEIL TRANSMISSION
              </div>
              <h1 style="margin:20px 0 4px;font-size:42px;letter-spacing:0.04em;line-height:1;color:#ede8e0;">
                NEW MESSAGE
              </h1>
              <p style="margin:0;font-size:11px;letter-spacing:0.14em;
                         background:linear-gradient(90deg,#e8650a,#ff8c38,#ffe0b2);
                         -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                         background-clip:text;">
                REACH THE FORGE
              </p>
            </td>
            <td align="right" valign="top" style="padding-top:4px;">
              <div style="width:60px;height:60px;border-radius:50%;
                           background:rgba(232,101,10,0.1);border:1px solid rgba(232,101,10,0.4);
                           text-align:center;line-height:60px;font-size:26px;">
                ${reasonIcon}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- divider -->
    <tr>
      <td style="padding:0 40px;">
        <div style="height:1px;background:linear-gradient(90deg,rgba(232,101,10,0.3),transparent);"></div>
      </td>
    </tr>

    <!-- reason badge -->
    <tr>
      <td style="padding:24px 40px 0;">
        <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.2em;color:rgba(138,117,96,0.6);text-transform:uppercase;">
          Reason
        </p>
        <div style="display:inline-block;border:1px solid rgba(232,101,10,0.5);border-radius:2px;
                     padding:6px 16px;background:rgba(232,101,10,0.1);
                     font-size:11px;letter-spacing:0.14em;color:#e8650a;">
          ${reasonIcon}&nbsp;&nbsp;${reasonLabel}
        </div>
      </td>
    </tr>

    <!-- sender details -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid rgba(138,117,96,0.12);border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid rgba(138,117,96,0.08);
                         background:rgba(232,101,10,0.03);">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.16em;color:rgba(138,117,96,0.5);">NAME</p>
              <p style="margin:0;font-size:14px;color:#ede8e0;letter-spacing:0.04em;">${name}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;background:rgba(232,101,10,0.02);">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.16em;color:rgba(138,117,96,0.5);">EMAIL</p>
              <a href="mailto:${email}" style="color:#e8650a;text-decoration:none;font-size:13px;letter-spacing:0.04em;">
                ${email}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- message body -->
    <tr>
      <td style="padding:24px 40px 0;">
        <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.2em;color:rgba(138,117,96,0.6);text-transform:uppercase;">
          Message
        </p>
        <div style="border:1px solid rgba(138,117,96,0.14);border-radius:2px;
                     padding:20px;background:rgba(8,6,4,0.5);
                     border-left:3px solid rgba(232,101,10,0.5);">
          <p style="margin:0;font-size:13px;color:#b8a890;line-height:1.8;white-space:pre-wrap;">
${message}
          </p>
        </div>
      </td>
    </tr>

    <!-- metadata row -->
    <tr>
      <td style="padding:20px 40px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:10px;color:rgba(138,117,96,0.35);letter-spacing:0.08em;">
              nvc.send() &rarr; ${ts}
            </td>
            <td align="right" style="font-size:10px;color:rgba(138,117,96,0.35);letter-spacing:0.08em;">
              developer@neuralveil.dev
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- bottom ember bar -->
    <tr>
      <td style="height:2px;background:linear-gradient(90deg,transparent,rgba(232,101,10,0.3),transparent);"></td>
    </tr>

  </table>
  <!-- /card -->

</td></tr>
</table>

</body>
</html>`
}



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


  const [formData, setFormData] = useState({
    name:    '',
    email:   '',
    message: '',
    reason:  null,   
  })

  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  // Convenience helpers so child onChange stays identical to before
  const setForm   = (patch) => setFormData(prev => ({ ...prev, ...patch }))
  const setReason = (id)    => setFormData(prev => ({ ...prev, reason: id }))

  const handleSubmit = async () => {
    const { name, email, message, reason } = formData
    if (!name.trim() || !email.trim() || !message.trim()) return

    setStatus('sending')
    setErrorMsg('')

    const reasonLabel = CONTACT_REASONS.find(r => r.id === reason)?.label ?? 'GENERAL'

    try {
     
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:  'developer@neuralveil.dev',
          subject:   reasonLabel,            
          from_name:  name,
          from_email: email,
          html_body:  buildEmailHtml({ name, email, message, reason }),
         
          message,
        },
        EMAILJS_PUBLIC_KEY
      )

      setStatus('sent')
    } catch (err) {
      console.error('[ContactUs] EmailJS error:', err)
      setErrorMsg('Transmission failed. Please try again or email us directly.')
      setStatus('error')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', message: '', reason: null })
    setStatus('idle')
    setErrorMsg('')
  }

  const anim = (delay) => ({
    opacity: hasIntersected ? 1 : 0,
    transform: hasIntersected ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  })

  const { name, email, message, reason } = formData
  const formReady = name.trim() && email.trim() && message.trim()

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

      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          opacity: 0.25, zIndex: 0,
        }}
      />

   
      <div
        style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '2px',
          background: 'linear-gradient(to bottom, transparent, rgba(232,101,10,0.4) 30%, rgba(232,101,10,0.4) 70%, transparent)',
          pointerEvents: 'none',
        }}
      />


      <div
        style={{
          position: 'absolute', top: '64px', left: '8vw', right: '8vw', height: '1px',
          background: 'linear-gradient(to right, rgba(232,101,10,0.3), transparent)',
          pointerEvents: 'none',
        }}
      />


      <div style={{ position: 'absolute', top: '72px', left: '8vw', pointerEvents: 'none' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M0 24 L0 0 L24 0" stroke="rgba(232,101,10,0.3)" strokeWidth="1" fill="none" />
        </svg>
      </div>

  
      <div style={{ position: 'absolute', bottom: '72px', right: '8vw', pointerEvents: 'none' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M24 0 L24 24 L0 24" stroke="rgba(232,101,10,0.3)" strokeWidth="1" fill="none" />
        </svg>
      </div>

      <div
        style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: '1100px',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '80px', alignItems: 'start',
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Badge */}
          <div style={anim(0)}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                border: '1px solid rgba(232, 101, 10, 0.35)', borderRadius: '2px',
                padding: '5px 14px', fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px', letterSpacing: '0.2em', color: '#fff',
                backgroundColor: 'rgba(232, 101, 10, 0.06)',
              }}
            >
              <span
                style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  backgroundColor: '#4caf80', boxShadow: '0 0 6px #4caf80', display: 'inline-block',
                }}
              />
              CHANNEL OPEN
            </div>
          </div>


          <div style={anim(0.1)}>
            <h2
              className="font-bebas"
              style={{ fontSize: 'clamp(52px, 6.5vw, 96px)', lineHeight: '0.91', letterSpacing: '0.02em', margin: 0 }}
            >
              <span style={{ color: '#ede8e0', display: 'block' }}>REACH</span>
              <span
                style={{
                  background: 'linear-gradient(90deg, var(--hot) 0%, var(--flame) 40%, var(--spark) 80%, #fff5e0 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text', display: 'block',
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
              style={{ fontSize: '13px', lineHeight: '1.8', color: '#7a6a58', margin: 0, maxWidth: '420px' }}
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
              { label: '// github/neuralveil',   href: '#' },
              { label: '// @neuralveil',          href: '#' },
            ].map(({ label, href }) => (
              <a
                key={label} href={href}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
                  color: 'rgba(138, 117, 96, 0.5)', letterSpacing: '0.06em',
                  textDecoration: 'none', transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ember)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(138, 117, 96, 0.5)')}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div style={anim(0.25)}>
          {status === 'sent' ? (

            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '480px', gap: '20px',
                border: '1px solid rgba(232, 101, 10, 0.3)',
                borderRadius: '4px',
                backgroundColor: 'rgba(10, 7, 4, 0.7)',
                padding: '48px', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
              }}
            >

              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(232,101,10,0.08) 0%, transparent 70%)',
              }} />


              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(232,101,10,0.6), transparent)',
              }} />

          
              <div
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(232, 101, 10, 0.1)',
                  border: '1px solid rgba(232, 101, 10, 0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px', color: 'var(--ember)',
                  boxShadow: '0 0 24px rgba(232,101,10,0.2)',
                  position: 'relative', zIndex: 1,
                }}
              >
                ⬡
              </div>

              <h3
                className="font-bebas"
                style={{
                  fontSize: '40px',
                  background: 'linear-gradient(90deg, var(--ember) 0%, #ff8c38 50%, #ffe0b2 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '0.06em', margin: 0, position: 'relative', zIndex: 1,
                }}
              >
                TRANSMISSION SENT
              </h3>

              <p
                className="font-mono-jb"
                style={{
                  fontSize: '12px', color: 'rgba(138,117,96,0.7)',
                  letterSpacing: '0.08em', margin: 0, lineHeight: 1.7,
                  position: 'relative', zIndex: 1,
                }}
              >
                nvc.send() → 200 OK
                <br />
                <span style={{ color: 'rgba(138,117,96,0.45)' }}>we'll be in touch within 24h</span>
              </p>

         
              <div
                style={{
                  width: '100%', border: '1px solid rgba(138,117,96,0.12)',
                  borderRadius: '2px', padding: '14px 18px',
                  background: 'rgba(8,6,4,0.5)',
                  position: 'relative', zIndex: 1,
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}
              >
                {[
                  { k: 'FROM',    v: `${name} <${email}>` },
                  { k: 'SUBJECT', v: CONTACT_REASONS.find(r => r.id === reason)?.label ?? 'GENERAL' },
                ].map(({ k, v }) => (
                  <div key={k} style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '9px',
                                   letterSpacing: '0.16em', color: 'rgba(138,117,96,0.45)', minWidth: '56px' }}>
                      {k}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11px',
                                   color: '#b8a890', letterSpacing: '0.04em' }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="font-mono-jb"
                onClick={resetForm}
                style={{
                  marginTop: '4px', background: 'none',
                  border: '1px solid rgba(232, 101, 10, 0.25)', borderRadius: '2px',
                  padding: '10px 28px', fontSize: '11px', letterSpacing: '0.12em',
                  color: 'rgba(232, 101, 10, 0.5)', cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                  position: 'relative', zIndex: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(232, 101, 10, 0.6)'
                  e.currentTarget.style.color = 'var(--ember)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(232, 101, 10, 0.25)'
                  e.currentTarget.style.color = 'rgba(232, 101, 10, 0.5)'
                }}
              >
                SEND ANOTHER
              </button>
            </div>
          ) : (
        
            <div
              style={{
                display: 'flex', flexDirection: 'column', gap: '24px',
                backgroundColor: 'rgba(10, 7, 4, 0.6)',
                border: '1px solid rgba(138, 117, 96, 0.12)',
                borderRadius: '4px', padding: '36px',
                backdropFilter: 'blur(8px)',
              }}
            >
       
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  className="font-mono-jb"
                  style={{ fontSize: '10px', letterSpacing: '0.18em', color: 'rgba(138, 117, 96, 0.6)', textTransform: 'uppercase' }}
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
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 14px', fontSize: '10px', letterSpacing: '0.12em',
                          border: `1px solid ${active ? 'rgba(232,101,10,0.6)' : 'rgba(138,117,96,0.2)'}`,
                          borderRadius: '2px',
                          backgroundColor: active ? 'rgba(232,101,10,0.1)' : 'transparent',
                          color: active ? 'var(--ember)' : 'rgba(138,117,96,0.5)',
                          cursor: 'pointer', transition: 'all 0.15s ease',
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

          
              <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(232,101,10,0.15), transparent)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InputField
                  label="Name" id="name" value={name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  placeholder="Ada Lovelace" required
                />
                <InputField
                  label="Email" id="email" type="email" value={email}
                  onChange={(e) => setForm({ email: e.target.value })}
                  placeholder="ada@lab.ai" required
                />
              </div>

          
              <TextAreaField
                label="Message" id="message" value={message}
                onChange={(e) => setForm({ message: e.target.value })}
                placeholder="// what's on your mind..." required
              />

              {status === 'error' && errorMsg && (
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
                    color: 'rgba(232,80,60,0.85)', letterSpacing: '0.06em',
                    border: '1px solid rgba(232,80,60,0.2)', borderRadius: '2px',
                    padding: '10px 14px', background: 'rgba(232,80,60,0.05)',
                  }}
                >
                  ⚠ {errorMsg}
                </div>
              )}

              {/* Submit */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <span className="font-mono-jb" style={{ fontSize: '10px', color: 'rgba(138,117,96,0.35)', letterSpacing: '0.06em' }}>
                  no tracking. no crm. just us.
                </span>
                <button
                  className="font-mono-jb"
                  onClick={handleSubmit}
                  disabled={status === 'sending' || !formReady}
                  style={{
                    backgroundColor: status === 'sending' ? 'rgba(232,101,10,0.5)' : 'var(--ember)',
                    color: 'var(--void)', border: 'none',
                    padding: '13px 32px', fontSize: '11px', letterSpacing: '0.12em',
                    fontWeight: '700',
                    cursor: status === 'sending' || !formReady ? 'not-allowed' : 'pointer',
                    borderRadius: '2px',
                    opacity: !formReady ? 0.45 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: formReady ? '0 0 20px rgba(232, 101, 10, 0.3)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (formReady && status !== 'sending') {
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
                          width: '8px', height: '8px', borderRadius: '50%',
                          border: '1.5px solid var(--void)', borderTopColor: 'transparent',
                          display: 'inline-block', animation: 'spin 0.7s linear infinite',
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

    
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(to bottom, transparent, var(--void))',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder {
          color: rgba(138, 117, 96, 0.28);
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </section>
  )
}