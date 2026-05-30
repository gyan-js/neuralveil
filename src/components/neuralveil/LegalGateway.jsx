import { useState, useEffect } from 'react'
import { Link } from 'react-router'


const G = {
  gold:        '#c9a84c',   
  goldDim:     '#a07c30',  
  goldGlow:    'rgba(201,168,76,0.18)',
  goldBorder:  'rgba(201,168,76,0.28)',
  goldBorderLo:'rgba(201,168,76,0.12)',
  goldText:    '#d4b86a',  
  goldFaint:   'rgba(201,168,76,0.06)',
  bg:          '#090805',   
  bgPanel:     '#0e0c08',
  bgBlock:     'rgba(0,0,0,0.35)',
  ink:         '#ede8d8',   
  inkDim:      '#8a7d60',   
  inkFaint:    '#4a4230',  
  divider:     'rgba(160,140,90,0.1)',
}

export default function LegalGateway({ tool, onClose, onAccept }) {
  const [tosChecked,     setTosChecked]     = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [hoverAccept,    setHoverAccept]    = useState(false)
  const [hoverDecline,   setHoverDecline]   = useState(false)

  
  useEffect(() => {
    localStorage.setItem('isTermOfUseAccepted', JSON.stringify(tosChecked))
  }, [tosChecked])

  useEffect(() => {
    localStorage.setItem('isPrivacyPolicyAccepted', JSON.stringify(privacyChecked))
  }, [privacyChecked])


  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const bothAccepted = tosChecked && privacyChecked

  const toolMeta = tool === 'shape'
    ? { label: 'SHAPE TRACER',   route: '/nvtsd' }
    : { label: 'VRAM ESTIMATOR', route: '/nvgme' }

  function handleAccept() {
    if (!bothAccepted) return
    onAccept(toolMeta.route)
  }

  return (

    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(4,3,1,0.9)',
        backdropFilter: 'blur(7px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
     
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: '520px',
          backgroundColor: G.bgPanel,
          border: `1px solid ${G.goldBorder}`,
          borderRadius: '3px',
          overflow: 'hidden',
          boxShadow: `0 0 80px ${G.goldGlow}, 0 40px 80px rgba(0,0,0,0.7)`,
        }}
      >
    
        <CornerAccent pos="tl" />
        <CornerAccent pos="br" />

    
        <div style={{
          borderBottom: `1px solid ${G.divider}`,
          padding: '22px 28px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div className="font-mono-jb" style={{
              fontSize: '9px', letterSpacing: '0.18em',
              color: G.goldDim, marginBottom: '5px',
            }}>
              // ACCESS GATEWAY
            </div>
            <div className="font-bebas" style={{
              fontSize: '24px', letterSpacing: '0.06em',
              color: G.ink, lineHeight: 1,
            }}>
              {toolMeta.label}
            </div>
          </div>

          <div className="font-mono-jb" style={{
            fontSize: '9px', letterSpacing: '0.14em',
            color: G.gold,
            border: `1px solid ${G.goldBorder}`,
            padding: '3px 10px', borderRadius: '2px',
          }}>
            LEGAL REVIEW
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '26px 28px 28px' }}>

          {/* Intro */}
          <p className="font-mono-jb" style={{
            fontSize: '11px', color: G.inkDim, lineHeight: 1.8,
            marginBottom: '24px',
            borderLeft: `2px solid ${G.goldBorderLo}`,
            paddingLeft: '12px',
          }}>
            Before accessing this tool, confirm you have read and agreed to both
            legal documents. Each link opens in a new tab.
          </p>

          {/* ── ToS row ── */}
          <AgreementRow
            index="01"
            section="TERMS OF USE"
            checked={tosChecked}
            onChange={v => setTosChecked(v)}
            docRoute="/termsofuse"
            docLabel="Terms of Use"
          />

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: G.divider, margin: '12px 0' }} />

          {/* ── Privacy row ── */}
          <AgreementRow
            index="02"
            section="PRIVACY POLICY"
            checked={privacyChecked}
            onChange={v => setPrivacyChecked(v)}
            docRoute="/privacypolicy"
            docLabel="Privacy Policy"
          />

          {/* ── Status bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            margin: '22px 0 20px',
            padding: '10px 14px',
            backgroundColor: G.bgBlock,
            border: `1px solid ${G.divider}`,
            borderRadius: '2px',
          }}>
            <StatusPip active={tosChecked} label="ToS" />
            <div style={{ width: '16px', height: '1px', backgroundColor: G.divider }} />
            <StatusPip active={privacyChecked} label="Privacy" />
            <div style={{ flex: 1 }} />
            <span className="font-mono-jb" style={{
              fontSize: '9px', letterSpacing: '0.1em',
              color: bothAccepted ? G.gold : G.inkFaint,
              transition: 'color 0.25s ease',
            }}>
              {bothAccepted
                ? '✓ all clear — ready to proceed'
                : !tosChecked && !privacyChecked
                  ? '2 agreements pending'
                  : !tosChecked ? 'Terms of Use pending' : 'Privacy Policy pending'}
            </span>
          </div>

          {/* ── Action row ── */}
          <div style={{ display: 'flex', gap: '10px' }}>

            {/* Decline */}
            <button
              className="font-mono-jb"
              onClick={onClose}
              onMouseEnter={() => setHoverDecline(true)}
              onMouseLeave={() => setHoverDecline(false)}
              style={{
                flex: '0 0 auto',
                backgroundColor: 'transparent',
                color: hoverDecline ? G.inkDim : G.inkFaint,
                border: `1px solid ${hoverDecline ? 'rgba(160,140,90,0.22)' : 'rgba(160,140,90,0.1)'}`,
                padding: '12px 20px',
                fontSize: '10px', letterSpacing: '0.12em',
                cursor: 'pointer', borderRadius: '2px',
                transition: 'all 0.2s ease',
              }}
            >
              DECLINE
            </button>

            {/* Accept */}
            <button
              className="font-mono-jb"
              onClick={handleAccept}
              disabled={!bothAccepted}
              onMouseEnter={() => setHoverAccept(true)}
              onMouseLeave={() => setHoverAccept(false)}
              style={{
                flex: 1,
                backgroundColor: bothAccepted
                  ? (hoverAccept ? '#d4b86a' : G.gold)
                  : G.bgBlock,
                color: bothAccepted ? '#09080a' : G.inkFaint,
                border: bothAccepted
                  ? 'none'
                  : `1px solid ${G.goldBorderLo}`,
                padding: '12px 22px',
                fontSize: '11px', letterSpacing: '0.12em', fontWeight: '700',
                cursor: bothAccepted ? 'pointer' : 'not-allowed',
                borderRadius: '2px',
                transition: 'all 0.2s ease',
                transform: bothAccepted && hoverAccept ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: bothAccepted && hoverAccept
                  ? `0 4px 20px rgba(201,168,76,0.3)`
                  : 'none',
              }}
            >
              {bothAccepted
                ? `I ACCEPT — LAUNCH ${toolMeta.label} →`
                : 'I ACCEPT  (ACCEPT BOTH ABOVE FIRST)'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

/**
 * AgreementRow
 * One section: index label + section title + checkbox + "I have read…" text
 * with a clickable doc link that opens in a new tab.
 */
function AgreementRow({ index, section, checked, onChange, docRoute, docLabel }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '14px',
      padding: '14px 16px',
      backgroundColor: checked ? `rgba(201,168,76,0.04)` : G.bgBlock,
      border: `1px solid ${checked ? G.goldBorder : G.divider}`,
      borderRadius: '3px',
      transition: 'all 0.25s ease',
      cursor: 'pointer',
    }}
      onClick={() => onChange(!checked)}
    >
      {/* Custom checkbox */}
      <div style={{
        marginTop: '1px',
        width: '15px', height: '15px', flexShrink: 0,
        border: `1px solid ${checked ? G.gold : 'rgba(160,140,90,0.3)'}`,
        borderRadius: '2px',
        backgroundColor: checked ? `rgba(201,168,76,0.15)` : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease',
      }}>
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke={G.gold} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Text block */}
      <div style={{ flex: 1 }}>
        <div className="font-mono-jb" style={{
          fontSize: '8px', color: G.goldDim,
          letterSpacing: '0.16em', marginBottom: '5px',
        }}>
          SECTION {index} — {section}
        </div>

        {/* The actual label — plain text + clickable link span */}
        <div className="font-mono-jb" style={{
          fontSize: '12px',
          color: checked ? G.inkDim : G.inkFaint,
          lineHeight: 1.7,
          transition: 'color 0.2s ease',
          userSelect: 'none',
        }}>
          I have read and accept the{' '}
          <Link
            to={docRoute}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()} // don't toggle checkbox when clicking the link
            style={{
              color: G.goldText,
              textDecoration: 'underline',
              textDecorationColor: `rgba(201,168,76,0.4)`,
              textUnderlineOffset: '3px',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = G.gold }}
            onMouseLeave={e => { e.currentTarget.style.color = G.goldText }}
          >
            {docLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Small glowing dot + label for the status bar */
function StatusPip({ active, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        backgroundColor: active ? G.gold : 'rgba(160,140,90,0.18)',
        boxShadow: active ? `0 0 7px ${G.gold}` : 'none',
        transition: 'all 0.3s ease',
      }} />
      <span className="font-mono-jb" style={{
        fontSize: '9px',
        color: active ? G.goldText : G.inkFaint,
        letterSpacing: '0.1em',
        transition: 'color 0.2s ease',
      }}>
        {label}
      </span>
    </div>
  )
}

/** Decorative corner L-bracket */
function CornerAccent({ pos }) {
  const isTop = pos === 'tl'
  return (
    <div style={{
      position: 'absolute',
      ...(isTop ? { top: 0, left: 0 } : { bottom: 0, right: 0 }),
      width: '32px', height: '32px',
      borderTop:    isTop ? `2px solid ${G.gold}` : 'none',
      borderLeft:   isTop ? `2px solid ${G.gold}` : 'none',
      borderBottom: !isTop ? `1px solid ${G.goldBorderLo}` : 'none',
      borderRight:  !isTop ? `1px solid ${G.goldBorderLo}` : 'none',
      opacity: isTop ? 0.65 : 0.4,
    }} />
  )
}