import { useId } from "react";
import { Hatch } from "./hatch";

const NUMERALS = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/**
 * Plate I: the pocket watch recovered at the scene, hands set to the case's
 * recorded time, with an examining lens — the case's frontispiece engraving.
 */
export function WatchPlate({ time, className }: { time: string; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const [hh, mm] = time.split(":").map(Number);
  const hourDeg = ((hh % 12) + mm / 60) * 30;
  const minuteDeg = mm * 6;
  const cx = 190;
  const cy = 236;
  const ink = "var(--ink)";
  const paper = "var(--surface)";

  return (
    <svg viewBox="0 0 400 480" className={className} role="img" aria-labelledby={`t-${uid}`}>
      <title id={`t-${uid}`}>{`Engraving: a pocket watch with its hands at ${time}, an examining lens resting across the case.`}</title>
      <defs>
        <Hatch id={`a-${uid}`} color={ink} gap={2.4} angle={45} weight={0.55} />
        <Hatch id={`b-${uid}`} color={ink} gap={3.2} angle={-30} weight={0.4} />
        <Hatch id={`c-${uid}`} color={ink} gap={2} angle={90} weight={0.5} />
        <clipPath id={`k-${uid}`}>
          <circle cx={cx} cy={cy} r="120" />
        </clipPath>
      </defs>

      {/* plate margin */}
      <rect x="1" y="1" width="398" height="478" fill={paper} stroke={ink} strokeWidth="1.2" />
      <rect x="9" y="9" width="382" height="462" fill="none" stroke={ink} strokeWidth="0.5" />
      <text x="22" y="32" fontFamily="var(--font-plex-mono)" fontSize="10" letterSpacing="2" fill={ink}>PL. I</text>
      <text x="378" y="32" textAnchor="end" fontFamily="var(--font-plex-mono)" fontSize="10" letterSpacing="2" fill={ink}>FIG. 1</text>

      {/* chain */}
      <path d={`M ${cx - 14} ${cy - 146} C 120 60 46 70 36 150 C 28 214 64 250 54 330 C 48 380 70 410 96 440`} fill="none" stroke={ink} strokeWidth="5" strokeDasharray="8 4" strokeLinecap="round" />
      <path d={`M ${cx - 14} ${cy - 146} C 120 60 46 70 36 150 C 28 214 64 250 54 330 C 48 380 70 410 96 440`} fill="none" stroke={paper} strokeWidth="1.6" strokeDasharray="8 4" />

      {/* bow and crown */}
      <circle cx={cx} cy={cy - 148} r="17" fill="none" stroke={ink} strokeWidth="5" />
      <rect x={cx - 12} y={cy - 134} width="24" height="16" fill={`url(#c-${uid})`} stroke={ink} strokeWidth="1.5" />

      {/* case with engraved shading */}
      <circle cx={cx} cy={cy} r="120" fill={paper} stroke={ink} strokeWidth="2.5" />
      <g clipPath={`url(#k-${uid})`}>
        <rect x={cx - 120} y={cy - 120} width="240" height="240" fill={`url(#a-${uid})`} />
        <circle cx={cx - 12} cy={cy - 12} r="118" fill={paper} />
      </g>
      <circle cx={cx} cy={cy} r="110" fill="none" stroke={ink} strokeWidth="1" />
      <circle cx={cx} cy={cy} r="101" fill={paper} stroke={ink} strokeWidth="1.5" />

      {/* chapter ring */}
      {Array.from({ length: 60 }, (_, i) => {
        const long = i % 5 === 0;
        const p1 = polar(cx, cy, long ? 86 : 91, i * 6);
        const p2 = polar(cx, cy, 97, i * 6);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ink} strokeWidth={long ? 1.6 : 0.7} />;
      })}
      {NUMERALS.map((n, i) => {
        const p = polar(cx, cy, 72, i * 30);
        return (
          <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display)" fontSize="15" fontWeight="600" fill={ink}>
            {n}
          </text>
        );
      })}

      {/* seconds sub-dial */}
      <circle cx={cx} cy={cy + 40} r="17" fill="none" stroke={ink} strokeWidth="0.8" />
      <line x1={cx} y1={cy + 40} x2={cx + 8} y2={cy + 30} stroke={ink} strokeWidth="1" />

      {/* hands */}
      <g transform={`rotate(${hourDeg} ${cx} ${cy})`}>
        <path d={`M ${cx - 3} ${cy + 10} L ${cx - 2.5} ${cy - 36} L ${cx - 8} ${cy - 46} L ${cx} ${cy - 58} L ${cx + 8} ${cy - 46} L ${cx + 2.5} ${cy - 36} L ${cx + 3} ${cy + 10} Z`} fill={ink} />
      </g>
      <g transform={`rotate(${minuteDeg} ${cx} ${cy})`}>
        <path d={`M ${cx - 1.6} ${cy + 14} L ${cx - 1.2} ${cy - 84} L ${cx} ${cy - 90} L ${cx + 1.2} ${cy - 84} L ${cx + 1.6} ${cy + 14} Z`} fill={ink} />
      </g>
      <circle cx={cx} cy={cy} r="5" fill={ink} />
      <circle cx={cx} cy={cy} r="1.6" fill={paper} />

      {/* examining lens */}
      <g transform="rotate(38 312 372)">
        <rect x="305" y="430" width="14" height="40" fill={ink} />
        <rect x="302" y="424" width="20" height="10" fill={paper} stroke={ink} strokeWidth="1.5" />
      </g>
      <circle cx="312" cy="372" r="58" fill={paper} fillOpacity="0.88" stroke={ink} strokeWidth="7" />
      <circle cx="312" cy="372" r="52" fill={`url(#b-${uid})`} opacity="0.35" />
      <path d="M 276 350 A 44 44 0 0 1 300 326" fill="none" stroke={ink} strokeWidth="1" />

      {/* annotation leaders */}
      <g fontFamily="var(--font-display)" fontStyle="italic" fontSize="16" fill={ink}>
        <line x1={cx + 14} y1={cy - 126} x2="276" y2="70" stroke={ink} strokeWidth="0.6" />
        <circle cx={cx + 14} cy={cy - 126} r="1.6" />
        <text x="282" y="74">a</text>
        <line x1="120" y1="166" x2="70" y2="116" stroke={ink} strokeWidth="0.6" />
        <circle cx="120" cy="166" r="1.6" />
        <text x="58" y="112">b</text>
        <line x1="352" y1="330" x2="372" y2="294" stroke={ink} strokeWidth="0.6" />
        <circle cx="352" cy="330" r="1.6" />
        <text x="372" y="288">c</text>
      </g>
    </svg>
  );
}

/** The Bureau's seal, stamped in oxblood. */
export function Seal({ caseNumber, className }: { caseNumber: string; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const c = "var(--accent)";
  return (
    <svg viewBox="0 0 140 140" className={className} aria-hidden="true">
      <defs>
        <path id={`p-${uid}`} d="M 70 70 m -50 0 a 50 50 0 1 1 100 0 a 50 50 0 1 1 -100 0" />
      </defs>
      <circle cx="70" cy="70" r="67" fill="var(--surface)" stroke={c} strokeWidth="2.5" />
      {Array.from({ length: 72 }, (_, i) => {
        const a = polar(70, 70, 60, i * 5);
        const b = polar(70, 70, 64, i * 5);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth="0.8" />;
      })}
      <circle cx="70" cy="70" r="58" fill="none" stroke={c} strokeWidth="1" />
      <circle cx="70" cy="70" r="40" fill="none" stroke={c} strokeWidth="1" />
      <text fontFamily="var(--font-plex-mono)" fontSize="8.6" letterSpacing="1.9" fill={c}>
        <textPath href={`#p-${uid}`}>BUREAU OF FORENSIC RECORD ✦ CASE OPEN ✦</textPath>
      </text>
      <text x="70" y="70" textAnchor="middle" fontFamily="var(--font-display)" fontSize="19" fontWeight="700" letterSpacing="2" fill={c}>
        ALIBI
      </text>
      <text x="70" y="86" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="9" letterSpacing="1.5" fill={c}>
        Nº {caseNumber}
      </text>
    </svg>
  );
}

/** Typographic rule with a centred lozenge, used once per section break. */
export function Fleuron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 12" className={className} aria-hidden="true">
      <line x1="0" y1="6" x2="104" y2="6" stroke="currentColor" strokeWidth="0.8" />
      <line x1="136" y1="6" x2="240" y2="6" stroke="currentColor" strokeWidth="0.8" />
      <path d="M 120 1 L 126 6 L 120 11 L 114 6 Z" fill="currentColor" />
      <circle cx="108" cy="6" r="1.6" fill="currentColor" />
      <circle cx="132" cy="6" r="1.6" fill="currentColor" />
    </svg>
  );
}
