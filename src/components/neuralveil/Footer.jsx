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

const footerLinks = ['GitHub', 'Docs', 'Tools']
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

      
      <div style={{ padding: '56px 10vw 0' }}>

      
        <div style={{ marginBottom: '52px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div className="font-bebas" style={{ fontSize: 'clamp(52px, 8vw, 96px)', letterSpacing: '0.06em', lineHeight: '0.88', color: 'rgba(200, 184, 154, 0.28)', userSelect: 'none' }}>NEURAL</div>
            <div className="font-bebas" style={{ fontSize: 'clamp(52px, 8vw, 96px)', letterSpacing: '0.06em', lineHeight: '0.88', color: 'rgba(200, 184, 154, 0.28)', userSelect: 'none' }}>VEIL</div>
          </div>
          <div style={{ maxWidth: '380px', paddingBottom: '8px' }}>
            <p className="font-mono-jb" style={{ fontSize: '12px', lineHeight: '1.8', color: 'rgba(200, 184, 154, 0.65)', letterSpacing: '0.04em', margin: 0 }}>
              Built for the ML engineer who opens the source, reads the paper, and asks why the loss curve looks like that at step 4,000. Not for dashboards. Not for demos. For understanding.
            </p>
          </div>
        </div>

  
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid rgba(200, 184, 154, 0.15)' }}>
          {features.map((f, i) => (
            <div
              key={f.num}
              style={{
                padding: i === 0 ? '28px 24px 28px 0' : i === 3 ? '28px 0 28px 24px' : '28px 24px',
                borderRight: i < 3 ? '1px solid rgba(200, 184, 154, 0.08)' : 'none',
                cursor: 'default',
              }}
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

    
      <div style={{ borderTop: '1px solid rgba(200, 184, 154, 0.1)', padding: '22px 10vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="font-bebas" style={{ fontSize: '14px', letterSpacing: '0.16em', color: 'rgba(200, 184, 154, 0.7)' }}>NEURALVEIL</span>
          <span className="font-mono-jb" style={{ fontSize: '9px', color: 'rgba(200, 184, 154, 0.35)', letterSpacing: '0.06em' }}>// built for the engineers who ask why.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {footerLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="font-mono-jb"
              style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'rgba(200, 184, 154, 0.7)', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ember)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(200, 184, 154, 0.7)')}
            >
              {link}
            </a>
          ))}
          <span className="font-mono-jb" style={{ fontSize: '9px', color: 'rgba(200, 184, 154, 0.28)', letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} — no rights reserved, no excuses accepted.
          </span>
        </div>
      </div>

      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </footer>
  )
}