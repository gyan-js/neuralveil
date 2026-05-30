import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rawMd from "../../public/legal/PrivacyPolicy.md?raw";


const TICKER_ITEMS = [
  "PRIVACY POLICY",
  "APACHE 2.0",
  "NO WARRANTY",
  "CLIENT-SIDE ONLY",
  "GOVERNING LAW · INDIA",
  "NEURALVEIL.DEV",
  "V3.0.1",
  "ML INTROSPECTION TOOLKIT",
];

function Ticker() {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={styles.tickerWrapper}>
      <div style={styles.tickerTrack}>
        {repeated.map((item, i) => (
          <span key={i} style={styles.tickerItem}>
            <span style={styles.tickerDot}>◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}


const mdComponents = {
  h1: ({ children }) => <h1 style={styles.mdH1}>{children}</h1>,
  h2: ({ children }) => (
    <h2 style={styles.mdH2}>
      <span style={styles.mdH2Line} />
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 style={styles.mdH3}>{children}</h3>,
  p: ({ children }) => <p style={styles.mdP}>{children}</p>,
  ul: ({ children }) => <ul style={styles.mdUl}>{children}</ul>,
  li: ({ children }) => (
    <li style={styles.mdLi}>
      <span style={styles.mdLiBullet}>›</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong style={styles.mdStrong}>{children}</strong>,
  em: ({ children }) => <em style={styles.mdEm}>{children}</em>,
  hr: () => <hr style={styles.mdHr} />,
  a: ({ href, children }) => (
    <a href={href} style={styles.mdA} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote style={styles.mdBlockquote}>{children}</blockquote>
  ),
  code: ({ children }) => <code style={styles.mdCode}>{children}</code>,
};

export default function TermsOfUse() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const processedMd = rawMd
    .replace(/\*\*Last Updated:\*\* .+/,    `**Last Updated:** ${today}`);
  return (
    <div style={styles.root}>
      {/* Ambient background grid */}
      <div style={styles.gridOverlay} />
      {/* Glow blobs */}
      <div style={{ ...styles.glowBlob, ...styles.glowBlob1 }} />
      <div style={{ ...styles.glowBlob, ...styles.glowBlob2 }} />

     

      {/* ── Ticker ── */}
      <Ticker />

      {/* ── Hero header ── */}
      <header
        style={{
          ...styles.hero,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <div style={styles.heroLabel}>LEGAL · NEURALVEIL.DEV</div>
        <h1 style={styles.heroTitle}>
          PRIVACY<br />
          <span style={styles.heroTitleAccent}>POLICY</span>
        </h1>
        <p style={styles.heroSub}>
          Plain language. No dark patterns. No hidden data collection.
          <br />
          <span style={styles.heroSubMono}>Effective: May 30, 2026 · Apache 2.0 · Client-side first</span>
        </p>
      </header>


      {/* ── Markdown body ── */}
      <main
        style={{
          ...styles.main,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease 0.2s",
        }}
      >
        <div style={styles.mdWrapper}>
          <ReactMarkdown components={mdComponents}>{processedMd}</ReactMarkdown>
        </div>
      </main>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function NavPill({ color, label }) {
  return (
    <span style={{ ...styles.navPill }}>
      <span style={{ ...styles.navPillDot, background: color }} />
      {label}
    </span>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#080C14",
  bgCard: "#0D1220",
  bgCardHover: "#111827",
  border: "#1a2235",
  borderAccent: "#1e2d45",
  cyan: "#00E5FF",
  green: "#39FF14",
  gold: "#F5C542",
  goldDim: "#c9a035",
  text: "#c8d4e8",
  textDim: "#5a6a85",
  textMid: "#8a9ab5",
  error: "#FF6B35",
  white: "#e8f0ff",
};

const MONO = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const DISPLAY = "'Bebas Neue', 'Impact', 'Arial Narrow', sans-serif";
const BODY = "'IBM Plex Mono', 'JetBrains Mono', monospace";

const styles = {
  root: {
    background: C.bg,
    minHeight: "100vh",
    fontFamily: BODY,
    color: C.text,
    position: "relative",
    overflowX: "hidden",
  },
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px)
    `,
    backgroundSize: "48px 48px",
    pointerEvents: "none",
    zIndex: 0,
  },
  glowBlob: {
    position: "fixed",
    borderRadius: "50%",
    filter: "blur(120px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  glowBlob1: {
    width: 500,
    height: 500,
    background: "rgba(0,229,255,0.04)",
    top: -100,
    right: -100,
  },
  glowBlob2: {
    width: 400,
    height: 400,
    background: "rgba(245,197,66,0.03)",
    bottom: 200,
    left: -150,
  },

  // Nav
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    gap: 24,
    padding: "0 28px",
    height: 56,
    background: "rgba(8,12,20,0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: `1px solid ${C.border}`,
  },
  navLeft: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.1,
    marginRight: "auto",
  },
  navLogo: {
    fontFamily: DISPLAY,
    fontSize: 20,
    letterSpacing: "0.12em",
    color: C.white,
  },
  navSubtitle: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: "0.18em",
    color: C.textDim,
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  navBadge: {
    fontFamily: MONO,
    fontSize: 11,
    color: C.textDim,
    border: `1px solid ${C.border}`,
    padding: "2px 8px",
    borderRadius: 2,
  },
  navPill: {
    fontFamily: MONO,
    fontSize: 10,
    color: C.textMid,
    display: "flex",
    alignItems: "center",
    gap: 5,
    letterSpacing: "0.1em",
  },
  navPillDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginLeft: 16,
  },
  navLink: {
    fontFamily: MONO,
    fontSize: 11,
    color: C.textMid,
    textDecoration: "none",
    letterSpacing: "0.1em",
  },
  navCta: {
    fontFamily: MONO,
    fontSize: 11,
    color: C.bg,
    background: C.gold,
    padding: "6px 14px",
    textDecoration: "none",
    letterSpacing: "0.1em",
    fontWeight: 700,
  },

  // Ticker
  tickerWrapper: {
    position: "relative",
    zIndex: 10,
    overflow: "hidden",
    background: C.bgCard,
    borderBottom: `1px solid ${C.border}`,
    height: 28,
    display: "flex",
    alignItems: "center",
  },
  tickerTrack: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    animation: "ticker 28s linear infinite",
    gap: 0,
  },
  tickerItem: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: "0.14em",
    color: C.textDim,
    padding: "0 24px",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  },
  tickerDot: {
    color: C.gold,
    fontSize: 7,
  },

  // Hero
  hero: {
    position: "relative",
    zIndex: 10,
    padding: "72px 60px 48px",
    borderBottom: `1px solid ${C.border}`,
  },
  heroLabel: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.22em",
    color: C.gold,
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: DISPLAY,
    fontSize: "clamp(64px, 10vw, 120px)",
    lineHeight: 0.9,
    letterSpacing: "0.04em",
    color: C.gold,
    margin: "0 0 24px",
  },
  heroTitleAccent: {
    color: C.white,
    WebkitTextStroke: `1px ${C.gold}`,
  },
  heroSub: {
    fontFamily: MONO,
    fontSize: 13,
    color: C.textMid,
    lineHeight: 1.7,
    margin: 0,
    maxWidth: 560,
  },
  heroSubMono: {
    color: C.textDim,
    fontSize: 11,
  },

  // Stats strip
  statsStrip: {
    position: "relative",
    zIndex: 10,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    borderBottom: `1px solid ${C.border}`,
  },
  statCard: {
    padding: "20px 28px",
    borderRight: `1px solid ${C.border}`,
  },
  statLabel: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: "0.2em",
    color: C.textDim,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: DISPLAY,
    fontSize: 22,
    letterSpacing: "0.08em",
  },

  // Main markdown
  main: {
    position: "relative",
    zIndex: 10,
    maxWidth: 860,
    margin: "0 auto",
    padding: "64px 40px 100px",
  },
  mdWrapper: {
    // wrapper for all markdown
  },

  // Markdown element styles
  mdH1: {
    fontFamily: DISPLAY,
    fontSize: 56,
    letterSpacing: "0.06em",
    color: C.gold,
    marginBottom: 8,
    lineHeight: 1,
  },
  mdH2: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.22em",
    color: C.gold,
    marginTop: 56,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 14,
    textTransform: "uppercase",
  },
  mdH2Line: {
    display: "inline-block",
    width: 28,
    height: 1,
    background: C.gold,
    flexShrink: 0,
  },
  mdH3: {
    fontFamily: MONO,
    fontSize: 12,
    color: C.textMid,
    letterSpacing: "0.14em",
    marginTop: 28,
    marginBottom: 10,
  },
  mdP: {
    fontFamily: BODY,
    fontSize: 13,
    lineHeight: 1.85,
    color: C.text,
    marginBottom: 16,
    maxWidth: 720,
  },
  mdUl: {
    listStyle: "none",
    padding: 0,
    margin: "16px 0 24px",
    borderLeft: `2px solid ${C.borderAccent}`,
    paddingLeft: 20,
  },
  mdLi: {
    fontFamily: BODY,
    fontSize: 13,
    lineHeight: 1.8,
    color: C.text,
    marginBottom: 8,
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  mdLiBullet: {
    color: C.gold,
    fontFamily: MONO,
    fontSize: 14,
    lineHeight: 1.8,
    flexShrink: 0,
  },
  mdStrong: {
    color: C.white,
    fontWeight: 700,
  },
  mdEm: {
    color: C.gold,
    fontStyle: "normal",
    fontFamily: MONO,
    fontSize: "0.9em",
  },
  mdHr: {
    border: "none",
    borderTop: `1px solid ${C.border}`,
    margin: "40px 0",
  },
  mdA: {
    color: C.gold,
    textDecoration: "none",
    borderBottom: `1px solid rgba(0,229,255,0.3)`,
  },
  mdBlockquote: {
    borderLeft: `3px solid ${C.gold}`,
    margin: "20px 0",
    padding: "12px 20px",
    background: "rgba(245,197,66,0.04)",
    color: C.textMid,
    fontStyle: "italic",
  },
  mdCode: {
    fontFamily: MONO,
    fontSize: 11,
    background: "rgba(0,229,255,0.06)",
    color: C.gold,
    padding: "2px 6px",
    border: `1px solid rgba(0,229,255,0.15)`,
  },

  // Footer
  footer: {
    position: "relative",
    zIndex: 10,
    borderTop: `1px solid ${C.border}`,
    padding: "20px 40px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: C.bgCard,
  },
  footerLogo: {
    fontFamily: DISPLAY,
    fontSize: 16,
    letterSpacing: "0.12em",
    color: C.gold,
  },
  footerSep: {
    color: C.textDim,
  },
  footerText: {
    fontFamily: MONO,
    fontSize: 11,
    color: C.textDim,
    letterSpacing: "0.06em",
  },
  footerLink: {
    fontFamily: MONO,
    fontSize: 11,
    color: C.cyan,
    textDecoration: "none",
    letterSpacing: "0.06em",
    marginLeft: "auto",
  },
};

// Inject ticker keyframes once
if (typeof document !== "undefined" && !document.getElementById("nv-ticker-style")) {
  const s = document.createElement("style");
  s.id = "nv-ticker-style";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');
    @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #080C14; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #080C14; }
    ::-webkit-scrollbar-thumb { background: #1a2235; border-radius: 3px; }
  `;
  document.head.appendChild(s);
}

