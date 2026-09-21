/** Decorative artwork only; independent of the product catalog. */
export default function HeroArtwork() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-orbit" />
      <span className="hero-spark spark-one">✳</span>
      <span className="hero-spark spark-two">✦</span>
      <div className="showcase-card showcase-audio">
        <div className="showcase-label"><span>DALE PLAY A TU DÍA</span><span>↗</span></div>
        <svg viewBox="0 0 240 220" fill="none">
          <defs>
            <linearGradient id="headphone-body" x1="50" y1="40" x2="200" y2="190" gradientUnits="userSpaceOnUse"><stop stopColor="#7794ff" /><stop offset="1" stopColor="#193FE0" /></linearGradient>
          </defs>
          <ellipse cx="120" cy="198" rx="70" ry="10" fill="#193FE0" opacity=".1" />
          <path d="M51 134V100a69 69 0 0 1 138 0v34" stroke="#122b89" strokeWidth="22" strokeLinecap="round" />
          <path d="M51 114v-14a69 69 0 0 1 138 0v14" stroke="url(#headphone-body)" strokeWidth="15" strokeLinecap="round" />
          <rect x="34" y="112" width="43" height="70" rx="20" fill="url(#headphone-body)" transform="rotate(-9 34 112)" />
          <rect x="160" y="106" width="43" height="70" rx="20" fill="url(#headphone-body)" transform="rotate(9 160 106)" />
          <path d="M65 125v39M174 125v39" stroke="#112b8f" strokeWidth="13" strokeLinecap="round" />
          <path d="M76 55c22-18 49-21 73-9" stroke="#b5c5ff" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <p>Tu mundo. <strong>A tu ritmo.</strong></p>
      </div>
      <div className="showcase-card showcase-bag">
        <span className="showcase-label">ENCUENTRA TU ESTILO</span>
        <svg viewBox="0 0 180 180" fill="none">
          <ellipse cx="90" cy="162" rx="57" ry="8" fill="#624a25" opacity=".1" />
          <path d="M43 58h94l12 94H31l12-94Z" fill="#d5e47b" />
          <path d="m137 58 12 94-18-11-7-83" fill="#b0c25d" />
          <path d="M65 70V47a25 25 0 0 1 50 0v23" stroke="#6f8430" strokeWidth="8" strokeLinecap="round" />
          <path d="m74 112 12 12 23-26" stroke="#526923" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p>Algo muy <strong>tú.</strong></p>
      </div>
      <div className="hero-note"><span>✦</span><div>Grandes descubrimientos.<br /><strong>En un solo lugar.</strong></div></div>
    </div>
  );
}
