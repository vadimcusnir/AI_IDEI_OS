/**
 * Extraction Engine — the central hero visual.
 * Shows the transformation: Input Chaos → Core Extractor → Asset Multiplication
 * Built with SVG + framer-motion. Premium, precise, minimal.
 */
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const OUTPUTS = [
  { label: "Articles", y: -50 },
  { label: "Scripts", y: -25 },
  { label: "Emails", y: 0 },
  { label: "Courses", y: 25 },
  { label: "Frameworks", y: 50 },
];

const INPUT_FRAGMENTS = [
  { text: "raw audio", x: -18, y: -42, opacity: 0.55 },
  { text: "notes", x: -38, y: -18, opacity: 0.35 },
  { text: "transcript", x: -12, y: 5, opacity: 0.65 },
  { text: "ideas", x: -32, y: 28, opacity: 0.45 },
  { text: "drafts", x: -8, y: 48, opacity: 0.25 },
];

/* Stable particle positions (no Math.random in render) */
const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  cx: -145 + ((i * 31 + 11) % 45),
  cy: -48 + ((i * 23 + 5) % 96),
  r: 0.8 + ((i * 13) % 3) * 0.4,
  op: 0.1 + ((i * 11) % 5) * 0.03,
}));

export function ExtractionEngine() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full max-w-[680px] mx-auto px-2">
      <svg
        viewBox="-200 -90 400 185"
        className="w-full h-auto"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Knowledge Extraction Engine diagram: raw input transforms through the core extractor into organized asset outputs"
      >
        {/* ── INPUT ZONE (left) — chaos ── */}
        <g>
          <motion.path
            d="M-180 -28 l5 -8 l5 14 l5 -18 l5 22 l5 -11 l5 7 l5 -16 l5 20 l5 -9 l5 4"
            stroke="hsl(var(--ivory-dim))"
            strokeWidth="1"
            opacity={0.35}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: active ? 1 : 0 }}
            transition={{ duration: 1.4, delay: 0.2 }}
          />
          <motion.path
            d="M-175 12 l4 10 l6 -18 l4 14 l5 -7 l6 16 l4 -12 l5 9 l6 -5"
            stroke="hsl(var(--ivory-dim))"
            strokeWidth="0.6"
            opacity={0.2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: active ? 1 : 0 }}
            transition={{ duration: 1.6, delay: 0.35 }}
          />

          {INPUT_FRAGMENTS.map((f, i) => (
            <motion.text
              key={i}
              x={-160 + f.x}
              y={f.y}
              fontSize="5.5"
              fill="hsl(var(--ivory-dim))"
              opacity={0}
              fontFamily="var(--font-mono)"
              initial={{ opacity: 0, x: -168 + f.x }}
              animate={active ? { opacity: f.opacity, x: -160 + f.x } : {}}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
            >
              {f.text}
            </motion.text>
          ))}

          {PARTICLES.map((p, i) => (
            <motion.circle
              key={`p-${i}`}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill="hsl(var(--ivory-dim))"
              initial={{ opacity: 0 }}
              animate={active ? { opacity: p.op } : {}}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.35 }}
            />
          ))}
        </g>

        {/* ── FLOW LINES: input → core ── */}
        <motion.path
          d="M-100 -18 C-65 -18 -52 0 -40 0"
          stroke="hsl(var(--gold-oxide))"
          strokeWidth="0.7"
          opacity={0}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={active ? { opacity: 0.3, pathLength: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.7 }}
        />
        <motion.path
          d="M-108 18 C-72 18 -52 0 -40 0"
          stroke="hsl(var(--gold-oxide))"
          strokeWidth="0.7"
          opacity={0}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={active ? { opacity: 0.2, pathLength: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.7 }}
        />
        <motion.path
          d="M-95 0 L-40 0"
          stroke="hsl(var(--gold-oxide))"
          strokeWidth="0.9"
          opacity={0}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={active ? { opacity: 0.45, pathLength: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.5 }}
        />

        {/* ── CORE EXTRACTOR (center) ── */}
        <g>
          {/* Outer octagon */}
          <motion.path
            d="M-28 -14 L-14 -28 L14 -28 L28 -14 L28 14 L14 28 L-14 28 L-28 14 Z"
            stroke="hsl(var(--gold-oxide))"
            strokeWidth="1.2"
            fill="none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={active ? { scale: 1, opacity: 0.9 } : {}}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          />
          {/* Inner ring */}
          <motion.circle
            cx={0} cy={0} r={14}
            stroke="hsl(var(--gold-oxide))"
            strokeWidth="0.5"
            fill="none"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={active ? { opacity: 0.4, scale: 1 } : {}}
            transition={{ delay: 0.7, duration: 0.5 }}
          />
          {/* Core dot */}
          <motion.circle
            cx={0} cy={0} r={5}
            fill="hsl(var(--gold-oxide))"
            initial={{ opacity: 0, scale: 0 }}
            animate={active ? { opacity: 0.75, scale: 1 } : {}}
            transition={{ delay: 0.9, duration: 0.4 }}
          />
          {/* Subtle glow ring */}
          <motion.circle
            cx={0} cy={0} r={8}
            fill="hsl(var(--gold-oxide))"
            initial={{ opacity: 0, scale: 0 }}
            animate={active ? { opacity: 0.08, scale: 1 } : {}}
            transition={{ delay: 1, duration: 0.5 }}
          />
          {/* Tick marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <motion.line
              key={deg}
              x1={0} y1={-18} x2={0} y2={-22}
              stroke="hsl(var(--gold-oxide))"
              strokeWidth="0.6"
              transform={`rotate(${deg})`}
              initial={{ opacity: 0 }}
              animate={active ? { opacity: 0.3 } : {}}
              transition={{ delay: 1 + deg * 0.001, duration: 0.25 }}
            />
          ))}
          {/* Label */}
          <motion.text
            x={0} y={44}
            textAnchor="middle"
            fontSize="5"
            fill="hsl(var(--gold-oxide))"
            fontFamily="var(--font-mono)"
            letterSpacing="0.18em"
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 0.6 } : {}}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            EXTRACTION ENGINE
          </motion.text>
        </g>

        {/* ── FLOW LINES: core → outputs ── */}
        {OUTPUTS.map((o, i) => (
          <motion.line
            key={`fl-${i}`}
            x1={30} y1={0} x2={100} y2={o.y}
            stroke="hsl(var(--gold-oxide))"
            strokeWidth="0.6"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={active ? { opacity: 0.25, pathLength: 1 } : {}}
            transition={{ delay: 1.1 + i * 0.08, duration: 0.45 }}
          />
        ))}

        {/* ── OUTPUT ZONE (right) ── */}
        {OUTPUTS.map((o, i) => (
          <motion.g
            key={`out-${i}`}
            initial={{ opacity: 0, x: 92 }}
            animate={active ? { opacity: 1, x: 108 } : {}}
            transition={{ delay: 1.3 + i * 0.1, duration: 0.45 }}
          >
            <rect
              x={0} y={o.y - 8}
              width={58} height={16} rx={3}
              stroke="hsl(var(--ivory-dim))"
              strokeWidth="0.6"
              fill="hsl(var(--obsidian-light))"
              opacity={0.65}
            />
            <text
              x={29} y={o.y + 1}
              textAnchor="middle"
              fontSize="5"
              fill="hsl(var(--ivory))"
              fontFamily="var(--font-mono)"
              letterSpacing="0.1em"
              opacity={0.75}
            >
              {o.label}
            </text>
            <circle cx={6} cy={o.y} r={1.2} fill="hsl(var(--gold-oxide))" opacity={0.5} />
          </motion.g>
        ))}

        {/* ── Zone labels ── */}
        <motion.text
          x={-155} y={-72}
          fontSize="4"
          fill="hsl(var(--ivory-dim))"
          fontFamily="var(--font-mono)"
          letterSpacing="0.25em"
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 0.35 } : {}}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          RAW INPUT
        </motion.text>
        <motion.text
          x={132} y={-72}
          fontSize="4"
          fill="hsl(var(--ivory-dim))"
          fontFamily="var(--font-mono)"
          letterSpacing="0.25em"
          textAnchor="middle"
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 0.35 } : {}}
          transition={{ delay: 1.5, duration: 0.4 }}
        >
          ASSET OUTPUT
        </motion.text>
      </svg>
    </div>
  );
}
