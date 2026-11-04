import type { Evidence } from "@/lib/schema/case-truth";

/** Small line-engraved specimen drawings, one per exhibit kind. Decorative: the type is always printed beside it. */
export function SpecimenGlyph({ type, className }: { type: Evidence["type"]; className?: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let body;
  switch (type) {
    case "fingerprint":
      body = (
        <g {...s} strokeWidth={1.1}>
          {[6, 11, 16, 21, 26].map((r) => (
            <path key={r} d={`M ${40 - r} 46 C ${40 - r} ${30 - r} ${40 + r} ${30 - r} ${40 + r} 46 C ${40 + r} ${54 + r / 3} ${40 - r / 2} ${62 + r / 3} ${40 - r / 3} ${52 + r / 2}`} />
          ))}
        </g>
      );
      break;
    case "photograph":
      body = (
        <g {...s}>
          <rect x="18" y="12" width="44" height="56" />
          <ellipse cx="40" cy="36" rx="14" ry="17" />
          <path d="M 30 50 C 32 40 48 40 50 50 M 34 30 C 34 22 46 22 46 30" />
          <path d="M 24 62 L 56 62" strokeWidth={0.8} />
        </g>
      );
      break;
    case "object":
    case "medical_report":
      body = (
        <g {...s}>
          <rect x="34" y="10" width="12" height="8" />
          <path d="M 35 18 L 35 28 C 24 32 22 40 22 52 C 22 64 30 70 40 70 C 50 70 58 64 58 52 C 58 40 56 32 45 28 L 45 18" />
          <path d="M 24 50 L 56 50" strokeWidth={0.8} />
          {[54, 58, 62, 66].map((y) => (
            <path key={y} d={`M ${28 + (y - 54) / 2} ${y} L ${52 - (y - 54) / 2} ${y}`} strokeWidth={0.6} />
          ))}
          {type === "medical_report" && <path d="M 40 36 L 40 44 M 36 40 L 44 40" />}
        </g>
      );
      break;
    case "security_log":
    case "phone_record":
      body = (
        <g {...s}>
          <rect x="16" y="14" width="48" height="52" />
          <path d="M 28 14 L 28 66" strokeWidth={0.8} />
          {[24, 32, 40, 48, 56].map((y) => (
            <path key={y} d={`M 32 ${y} L 58 ${y} M 19 ${y} L 25 ${y}`} strokeWidth={0.7} />
          ))}
        </g>
      );
      break;
    case "receipt":
      body = (
        <g {...s}>
          <path d="M 24 10 L 56 10 L 56 64 L 52 68 L 48 64 L 44 68 L 40 64 L 36 68 L 32 64 L 28 68 L 24 64 Z" />
          {[20, 28, 36, 44].map((y) => (
            <path key={y} d={`M 30 ${y} L 50 ${y}`} strokeWidth={0.7} />
          ))}
          <path d="M 30 54 L 50 54" />
        </g>
      );
      break;
    default:
      // document, message, email, witness_statement
      body = (
        <g {...s}>
          <path d="M 20 10 L 50 10 L 60 20 L 60 70 L 20 70 Z M 50 10 L 50 20 L 60 20" />
          {[30, 37, 44, 51, 58].map((y) => (
            <path key={y} d={`M 27 ${y} L ${y === 58 ? 42 : 53} ${y}`} strokeWidth={0.7} />
          ))}
          {type === "witness_statement" && <path d="M 44 62 C 48 58 52 62 56 58" />}
          {(type === "message" || type === "email") && <path d="M 20 10 L 40 26 L 60 10" strokeWidth={0.8} />}
        </g>
      );
  }
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      {body}
    </svg>
  );
}
