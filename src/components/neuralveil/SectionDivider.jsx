export default function SectionDivider() {
  return (
    <div
      style={{
        width: '100%',
        height: '120px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--void)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <svg
        width="100%"
        height="60"
        viewBox="0 0 1400 60"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="divider-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M0,30 L180,30 L200,10 L260,10 L280,30 L520,30 L540,50 L600,50 L620,30 L820,30 L840,10 L900,10 L920,30 L1140,30 L1160,50 L1220,50 L1240,30 L1400,30"
          stroke="var(--ember)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="1400 1400"
          style={{
            animation: 'divider-signal 3s linear infinite',
            filter: 'url(#divider-glow)',
          }}
        />


        <path
          d="M0,30 L180,30 L200,10 L260,10 L280,30 L520,30 L540,50 L600,50 L620,30 L820,30 L840,10 L900,10 L920,30 L1140,30 L1160,50 L1220,50 L1240,30 L1400,30"
          stroke="rgba(232, 101, 10, 0.1)"
          strokeWidth="1"
          fill="none"
        />

        {[200, 280, 540, 620, 840, 920, 1160, 1240].map((x, i) => {
          const y = [10, 30, 50, 30, 10, 30, 50, 30][i]
          return (
            <circle
              key={i}
              cx={x} cy={y} r="4"
              fill="var(--ember)"
              style={{
                animation: `node-light 3s ease-in-out infinite`,
                animationDelay: `${(x / 1400) * 3}s`,
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
