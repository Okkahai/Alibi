import { useId } from "react";
import { Hatch, hashString } from "./hatch";

/**
 * Procedural Victorian silhouette portraits (the cut-paper "shade" portrait
 * genre), drawn as identification views for the Bertillon-style suspect
 * record. A character's id seeds the features, so a suspect always looks the
 * same. Original artwork — no external images.
 */

type View = "profile" | "front";

interface Features {
  hair: number; // 0 crop, 1 bun, 2 top hat, 3 bowler, 4 long, 5 pompadour
  beard: boolean;
  moustache: boolean;
  collar: number; // 0 plain, 1 high points, 2 ruff
  spectacles: boolean;
  nose: number; // tip offset 0..6
  build: number; // shoulder width scale
}

export function featuresFor(seed: string): Features {
  const h = hashString(seed);
  const hair = (h >>> 20) % 6;
  const hatted = hair === 2 || hair === 3;
  return {
    hair,
    beard: (h >> 3) % 4 === 0 && hair !== 1 && hair !== 4,
    moustache: (h >> 5) % 3 === 0 && hair !== 1 && hair !== 4,
    collar: (h >> 7) % 3,
    spectacles: !hatted && (h >> 9) % 4 === 0,
    nose: (h >> 11) % 7,
    build: [0.9, 1, 1.1][(h >>> 16) % 3],
  };
}

/*
 * "Bronzed" highlights: Victorian silhouettists painted fine gold lines over
 * the black shape for hair, ear and coat. These give each figure detail
 * without breaking the cut-paper silhouette.
 */
function ProfileDetail({ f, line }: { f: Features; line: string }) {
  const bare = f.hair !== 2 && f.hair !== 3;
  return (
    <g fill="none" stroke={line} strokeWidth="0.9" strokeLinecap="round" opacity="0.9">
      {bare && (
        <>
          <path d="M 60 92 C 70 74 88 64 110 62" />
          <path d="M 57 106 C 68 86 90 74 118 71" />
          <path d="M 62 120 C 72 102 86 90 102 86" />
        </>
      )}
      <path d="M 86 104 C 79 100 77 113 84 117" strokeWidth="1.1" />
      <path d="M 122 99 L 128 100" />
      <path d="M 100 176 L 112 200 L 130 182" strokeWidth="1.2" />
      <path d="M 44 186 C 58 179 74 177 88 179" />
      {f.collar === 0 && <path d="M 112 174 L 122 170 L 120 180 Z M 112 174 L 104 168 L 106 178 Z" />}
    </g>
  );
}

function FrontDetail({ f, line }: { f: Features; line: string }) {
  return (
    <g fill="none" stroke={line} strokeWidth="0.9" strokeLinecap="round" opacity="0.9">
      {(f.hair === 0 || f.hair === 5) && <path d="M 82 60 C 78 68 75 74 72 80" />}
      {f.hair === 4 && <path d="M 80 64 L 80 76 M 60 90 C 56 120 50 140 44 160 M 100 90 C 104 120 110 140 116 160" />}
      <path d="M 52 96 C 49 99 50 104 53 106 M 108 96 C 111 99 110 104 107 106" />
      <path d="M 64 160 L 80 188 L 96 160" strokeWidth="1.2" />
      <circle cx="80" cy="195" r="1.4" fill={line} />
      <path d="M 36 180 C 44 186 48 192 50 200 M 124 180 C 116 186 112 192 110 200" />
      {f.collar === 0 && <path d="M 80 166 L 70 160 L 70 172 Z M 80 166 L 90 160 L 90 172 Z" />}
    </g>
  );
}

function ProfileShape({ f }: { f: Features }) {
  const n = f.nose;
  return (
    <g>
      <path
        d={`M 30 200 C 34 182 50 172 70 168 L 72 152 C 56 144 48 122 50 100 C 52 72 72 54 98 54 C 118 55 130 68 132 84 C 133 90 134 94 136 97 C 135 100 134 101 134 103 L ${142 + n} 118 C ${140 + n} 121 138 122 135 122 C 136 125 137 127 134 129 C 133 131 134 133 135 134 C 133 137 131 139 130 140 C 132 145 131 150 126 153 C 120 156 114 156 110 157 C 110 162 111 166 112 170 C 124 174 140 180 146 186 C 150 190 152 195 153 200 Z`}
      />
      {f.hair === 1 && <circle cx="50" cy="90" r="15" />}
      {f.hair === 2 && (
        <>
          <path d="M 58 66 L 138 60 L 139 54 L 60 59 Z" />
          <path d="M 72 60 L 70 14 L 122 10 L 126 58 Z" />
        </>
      )}
      {f.hair === 3 && (
        <>
          <ellipse cx="94" cy="60" rx="31" ry="17" />
          <ellipse cx="98" cy="68" rx="42" ry="4" transform="rotate(-4 98 68)" />
        </>
      )}
      {f.hair === 4 && <path d="M 62 66 C 34 92 34 146 44 176 L 72 170 C 62 140 62 106 72 84 Z" />}
      {f.hair === 5 && <ellipse cx="98" cy="54" rx="32" ry="13" transform="rotate(-8 98 54)" />}
      {f.beard && <path d="M 104 150 C 112 170 132 166 136 140 L 128 136 Z" />}
      {f.moustache && <ellipse cx="136" cy="123" rx="7" ry="3" />}
      {f.spectacles && <path d="M 124 96 L 138 98 L 138 102 L 124 100 Z" />}
      {f.collar === 1 && <path d="M 106 164 L 136 158 L 128 178 Z" />}
      {f.collar === 2 &&
        [108, 116, 124, 132, 140].map((x, i) => <circle key={x} cx={x} cy={172 + i * 2} r="6" />)}
    </g>
  );
}

function FrontShape({ f }: { f: Features }) {
  return (
    <g>
      <path d="M 10 200 C 14 176 40 164 66 158 L 94 158 C 120 164 146 176 150 200 Z" transform={`translate(${80 * (1 - f.build)} 0) scale(${f.build} 1)`} />
      <rect x="67" y="124" width="26" height="38" />
      <ellipse cx="80" cy="96" rx="30" ry="37" />
      <ellipse cx="50" cy="100" rx="4" ry="8" />
      <ellipse cx="110" cy="100" rx="4" ry="8" />
      {f.hair === 0 && <ellipse cx="80" cy="76" rx="32" ry="22" />}
      {f.hair === 1 && (
        <>
          <ellipse cx="80" cy="76" rx="33" ry="23" />
          <circle cx="80" cy="50" r="14" />
        </>
      )}
      {f.hair === 2 && (
        <>
          <rect x="50" y="64" width="60" height="7" />
          <rect x="60" y="18" width="40" height="48" />
        </>
      )}
      {f.hair === 3 && (
        <>
          <ellipse cx="80" cy="68" rx="32" ry="20" />
          <rect x="42" y="70" width="76" height="5" rx="2.5" />
        </>
      )}
      {f.hair === 4 && <path d="M 48 80 C 44 114 40 140 34 166 L 126 166 C 120 140 116 114 112 80 C 108 52 52 52 48 80 Z" />}
      {f.hair === 5 && <ellipse cx="80" cy="66" rx="34" ry="18" />}
      {f.beard && <path d="M 56 108 C 58 142 102 142 104 108 C 98 134 62 134 56 108 Z" />}
      {f.collar === 1 && <path d="M 66 150 L 80 162 L 94 150 L 96 166 L 64 166 Z" />}
      {f.collar === 2 && [58, 69, 80, 91, 102].map((x) => <circle key={x} cx={x} cy="158" r="7" />)}
    </g>
  );
}

export function Portrait({
  seed,
  view,
  ink = "var(--ink)",
  ground = "var(--brass)",
  framed = true,
  highlight = "var(--brass-light)",
  className,
  title,
}: {
  seed: string;
  view: View;
  ink?: string;
  ground?: string;
  framed?: boolean;
  highlight?: string;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const f = featuresFor(seed);
  return (
    <svg viewBox="0 0 160 200" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <Hatch id={`h-${uid}`} color={ground} gap={2.6} angle={0} weight={0.5} />
      </defs>
      {framed && (
        <>
          <rect x="0" y="0" width="160" height="200" fill={`url(#h-${uid})`} opacity="0.55" />
          {/* Bertillon height rule along the left edge */}
          {Array.from({ length: 19 }, (_, i) => (
            <line key={i} x1="0" x2={i % 5 === 0 ? 10 : 5} y1={10 + i * 10} y2={10 + i * 10} stroke={ink} strokeWidth="0.8" />
          ))}
        </>
      )}
      <g fill={ink}>{view === "profile" ? <ProfileShape f={f} /> : <FrontShape f={f} />}</g>
      {view === "profile" ? <ProfileDetail f={f} line={highlight} /> : <FrontDetail f={f} line={highlight} />}
      {framed && <rect x="0.5" y="0.5" width="159" height="199" fill="none" stroke={ink} strokeWidth="1" />}
    </svg>
  );
}
