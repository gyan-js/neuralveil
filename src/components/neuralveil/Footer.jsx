const manifestoItems = [
  'NO CLOUD', 'NO ABSTRACTION LEAKS', 'NO TELEMETRY',
  'RESEARCH GRADE', 'YOUR MODEL. FULLY YOURS.',
]

const features = [
  { num: '01', title: 'SHAPE TRACING', desc: "Parse every tensor dimension across your model's full compute graph." },
  { num: '02', title: 'MEMORY MODELLING TRACING', desc: 'Weights, activations, gradients, optimizer state. Know your footprint exactly' },
  { num: '03', title: 'PYTHON NATIVE', desc: "Drop a hook, get a self-contained report. Zero config needed." },
  { num: '04', title: 'LOCAL FIRST', desc: 'Runs on your machine. Weights stay on your disk. Nothing leaves.' },
]

const footerLinks = [
  {tag: 'GitHub', href: 'https://github.com/gyan-js'},
 { tag: "Tools", href: '#tools'}
]
const marqueeContent = [...manifestoItems, ...manifestoItems]

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--void)', overflow: 'hidden' }}>

      <div
        style={{
          borderTop: '1px solid rgba(232, 101, 10, 0.2)',
          borderBottom: '1px solid rgba(232, 101, 10, 0.1)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          padding: '14px 0',
        }}
      >
        <div style={{ display: 'inline-block', animation: 'marquee 28s linear infinite' }}>
          {marqueeContent.map((item, i) => (
            <span key={i}>
              <span className="font-bebas" style={{ fontSize: '15px', letterSpacing: '0.18em', color: 'rgba(200, 184, 154, 0.4)', padding: '0 40px' }}>
                {item}
              </span>
              <span className="font-bebas" style={{ fontSize: '15px', color: 'rgba(232, 101, 10, 0.6)', padding: '0 4px' }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="footer-main" style={{ padding: '56px 10vw 0' }}>

    
        <div className="footer-brand-row" style={{ marginBottom: '52px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div className="font-bebas footer-wordmark" style={{ fontSize: 'clamp(52px, 8vw, 96px)', letterSpacing: '0.06em', lineHeight: '0.88', color: 'rgba(200, 184, 154, 0.28)', userSelect: 'none' }}>NEURAL</div>
            <div className="font-bebas footer-wordmark" style={{ fontSize: 'clamp(52px, 8vw, 96px)', letterSpacing: '0.06em', lineHeight: '0.88', color: 'rgba(200, 184, 154, 0.28)', userSelect: 'none' }}>VEIL</div>
          </div>
          <div className="footer-tagline-wrap" style={{ maxWidth: '380px', paddingBottom: '8px' }}>
            <p className="font-mono-jb" style={{ fontSize: '12px', lineHeight: '1.8', color: 'rgba(200, 184, 154, 0.65)', letterSpacing: '0.04em', margin: 0 }}>
              Built for the ML engineer who opens the source, reads the paper, and asks why the loss curve looks like that at step 4,000. Not for dashboards. Not for demos. For understanding.
            </p>
          </div>
        </div>

   
        <div className="features-grid" style={{ borderTop: '1px solid rgba(200, 184, 154, 0.15)' }}>
          {features.map((f, i) => (
            <div
              key={f.num}
              className={`feature-cell feature-cell-${i}`}
              style={{ cursor: 'default' }}
              onMouseEnter={(e) => {
                e.currentTarget.querySelector('.feat-num').style.color = 'var(--ember)'
                e.currentTarget.querySelector('.feat-title').style.color = 'rgba(200, 184, 154, 0.9)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.querySelector('.feat-num').style.color = 'rgba(232, 101, 10, 0.5)'
                e.currentTarget.querySelector('.feat-title').style.color = 'rgba(200, 184, 154, 0.6)'
              }}
            >
              <div className="feat-num font-bebas" style={{ fontSize: '36px', color: 'rgba(232, 101, 10, 0.5)', letterSpacing: '0.04em', lineHeight: '1', marginBottom: '12px', transition: 'color 0.25s ease' }}>{f.num}</div>
              <div className="feat-title font-mono-jb" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(200, 184, 154, 0.6)', marginBottom: '8px', transition: 'color 0.25s ease' }}>{f.title}</div>
              <div className="font-mono-jb" style={{ fontSize: '11px', lineHeight: '1.7', color: 'rgba(200, 184, 154, 0.38)', letterSpacing: '0.03em' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom" style={{ borderTop: '1px solid rgba(200, 184, 154, 0.1)', padding: '22px 10vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="font-bebas" style={{ fontSize: '14px', letterSpacing: '0.16em', color: 'rgba(200, 184, 154, 0.7)' }}>NEURALVEIL</span>
          <span className="font-mono-jb footer-tagline-inline" style={{ fontSize: '9px', color: 'rgba(200, 184, 154, 0.35)', letterSpacing: '0.06em' }}>// built for the engineers who ask why.</span>
        </div>
        <div className="footer-links-row" style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
          {footerLinks.map((link) => (
            <a
              key={link.tag}
              href={link.href}
              className="font-mono-jb"
              style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'rgba(200, 184, 154, 0.7)', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ember)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(200, 184, 154, 0.7)')}
            >
              {link.tag}
            </a>
          ))}
          <span className="font-mono-jb footer-copyright" style={{ fontSize: '9px', color: 'rgba(200, 184, 154, 0.7)', letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} — All rights reserved.
          </span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

     
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .feature-cell {
          padding: 28px 24px;
        }
        .feature-cell-0 { padding-left: 0; }
        .feature-cell-3 { padding-right: 0; }
        .feature-cell-0,
        .feature-cell-1,
        .feature-cell-2 {
          border-right: 1px solid rgba(200, 184, 154, 0.08);
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {

          /* Padding adjustments */
          .footer-main {
            padding: 40px 6vw 0 !important;
          }

          /* Brand row: stack vertically */
          .footer-brand-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            margin-bottom: 36px !important;
          }

          /* Tagline block: full width */
          .footer-tagline-wrap {
            max-width: 100% !important;
            padding-bottom: 0 !important;
          }

          /* Features: 2-column grid on mobile */
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          /* Reset all cells to uniform padding */
          .feature-cell {
            padding: 24px 16px !important;
          }

          /* Left column cells get right border */
          .feature-cell-0,
          .feature-cell-2 {
            border-right: 1px solid rgba(200, 184, 154, 0.08) !important;
          }

          /* Top row cells get bottom border */
          .feature-cell-0,
          .feature-cell-1 {
            border-bottom: 1px solid rgba(200, 184, 154, 0.08);
          }

          /* Remove right border from right-column cells */
          .feature-cell-1,
          .feature-cell-3 {
            border-right: none !important;
          }

          /* Bottom bar: stack vertically */
          .footer-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 20px 6vw !important;
            gap: 12px !important;
          }

          /* Links row: tighter gap, allow wrap */
          .footer-links-row {
            gap: 20px !important;
          }

          /* Hide the inline tagline on mobile — too cramped */
          .footer-tagline-inline {
            display: none;
          }

          /* Copyright on its own line */
          .footer-copyright {
            width: 100%;
          }
        }

        /* ── Very small screens ── */
        @media (max-width: 400px) {
          .footer-links-row {
            gap: 16px !important;
          }
        }
      `}</style>
    </footer>
  )
}