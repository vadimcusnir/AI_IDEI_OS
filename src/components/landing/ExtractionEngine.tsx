/**
 * Extraction Engine — the central hero visual.
 * Shows the transformation: Input Chaos → Core Extractor → Asset Multiplication
 * Built with SVG + framer-motion. No decoration — shows the mechanism.
 * Mobile-first: scales cleanly on 430px+ viewports.
 */
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const OUTPUTS = [
  { label: "Articles", y: -52 },
  { label: "Scripts", y: -26 },
  { label: "Emails", y: 0 },
  { label: "Courses", y: 26 },
  { label: "Frameworks", y: 52 },
];

const INPUT_FRAGMENTS = [
  { text: "raw audio", x: -20, y: -45, opacity: 0.6 },
  { text: "notes", x: -40, y: -20, opacity: 0.4 },
  { text: "transcript", x: -15, y: 5, opacity: 0.7 },
  { text: "ideas", x: -35, y: 30, opacity: 0.5 },
  { text: "drafts", x: -10, y: 50, opacity: 0.3 },
];

/* Stable particle positions (no Math.random in render) */
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  cx: -140 + ((i * 37 + 13) % 40),
  cy: -50 + ((i * 29 + 7) % 100),
  r: 1 + ((i * 17) % 3) * 0.5,
  op: 0.15 + ((i * 13) % 5) * 0.04,
}));

export function ExtractionEngine() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto px-2">
      <svg
        viewBox="-200 -85 400 175"
        className="w-full h-auto"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Knowledge Extraction Engine diagram: raw input transforms through the core extractor into organized asset outputs"
      >
        {/* ── INPUT ZONE (left) — chaos ── */}
        <g>
          <motion.path
            d="M-180 -30 l5 -8 l5 15 l5 -20 l5 25 l5 -12 l5 8 l5 -18 l5 22 l5 -10 l5 5"
            stroke="hsl(var(--ivory-dim))"
            strokeWidth="1.2"
            opacity={0.4}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: active ? 1 : 0 }}
            transition={{ duration: 1.5, delay: 0.2 }}
          />
          <motion.path
            d="M-175 10 l4 12 l6 -20 l4 16 l5 -8 l6 18 l4 -14 l5 10 l6 -6"
            stroke="hsl(var(--ivory-dim))"
            strokeWidth="0.8"
            opacity={0.25}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: active ? 1 : 0 }}
            transition={{ duration: 1.8, delay: 0.4 }}
          />

          {INPUT_FRAGMENTS.map((f, i) => (
            <motion.text
              key={i}
              x={-160 + f.x}
              y={f.y}
              fontSize="6"
              fill="hsl(var(--ivory-dim))"
              opacity={0}
              fontFamily="var(--font-mono)"
              initial={{ opacity: 0, x: -170 + f.x }}
              animate={active ? { opacity: f.opacity, x: -160 + f.x } : {}}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
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
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            />
          ))}
        </g>

        {/* ── FLOW LINES: input → core ── */}
        <motion.path
          d="M-100 -20 C-60 -20 -50 0 -40 0"
          stroke="hsl(var(--gold-oxide))"
          strokeWidth="0.8"
          opacity={0}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={active ? { opacity: 0.35, pathLength: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
        />
        <motion.path
          d="M-110 20 C-70 20 -50 0 -40 0"
          stroke="hsl(var(--gold-oxide))"
          strokeWidth="0.8"
          opacity={0}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={active ? { opacity: 0.25, pathLength: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.8 }}
        />
        <motion.path
          d="M-95 0 L-40 0"
          stroke="hsl(var(--gold-oxide))"
          strokeWidth="1"
          opacity={0}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={active ? { opacity: 0.5, pathLength: 1 } : {}}
          transition={{ delay: 1, duration: 0.6 }}
        />

        {/* ── CORE EXTRACTOR (center) ── */}
        <g>
          <motion.path
            d="M-28 -15 L-15 -28 L15 -28 L28 -15 L28 15 L15 28 L-15 28 L-28 15 Z"
            stroke="hsl(var(--gold-oxide))"
            strokeWidth="1.5"
            fill="none"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={active ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
          />
          <motion.circle
            cx={0} cy={0} r={14}
            stroke="hsl(var(--gold-oxide))"
            strokeWidth="0.7"
            fill="none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={active ? { opacity: 0.5, scale: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.6 }}
          />
          <motion.circle
            cx={0} cy={0} r={6}
            fill="hsl(var(--gold-oxide))"
            initial={{ opacity: 0, scale: 0 }}
            animate={active ? { opacity: 0.8, scale: 1 } : {}}
            transition={{ delay: 1, duration: 0.5 }}
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <motion.line
              key={deg}
              x1={0} y1={-19} x2={0} y2={-23}
              stroke="hsl(var(--gold-oxide))"
              strokeWidth="0.8"
              transform={`rotate(${deg})`}
              initial={{ opacity: 0 }}
              animate={active ? { opacity: 0.4 } : {}}
              transition={{ delay: 1.1 + deg * 0.002, duration: 0.3 }}
            />
          ))}
          <motion.text
            x={0} y={42}
            textAnchor="middle"
            fontSize="5.5"
            fill="hsl(var(--gold-oxide))"
            fontFamily="var(--font-mono)"
            letterSpacing="0.15em"
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 0.7 } : {}}
            transition={{ delay: 1.3, duration: 0.5 }}
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
            strokeWidth="0.7"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={active ? { opacity: 0.3, pathLength: 1 } : {}}
            transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
          />
        ))}

        {/* ── OUTPUT ZONE (right) ── */}
        {OUTPUTS.map((o, i) => (
          <motion.g
            key={`out-${i}`}
            initial={{ opacity: 0, x: 90 }}
            animate={active ? { opacity: 1, x: 105 } : {}}
            transition={{ delay: 1.4 + i * 0.12, duration: 0.5 }}
          >
            <rect
              x={0} y={o.y - 8}
              width={60} height={16} rx={2}
              stroke="hsl(var(--ivory-dim))"
              strokeWidth="0.8"
              fill="hsl(var(--obsidian-light))"
              opacity={0.7}
            />
            <text
              x={30} y={o.y + 1}
              textAnchor="middle"
              fontSize="5.5"
              fill="hsl(var(--ivory))"
              fontFamily="var(--font-mono)"
              letterSpacing="0.08em"
              opacity={0.8}
            >
              {o.label}
            </text>
            <circle cx={6} cy={o.y} r={1.5} fill="hsl(var(--gold-oxide))" opacity={0.6} />
          </motion.g>
        ))}

        {/* ── Zone labels ── */}
        <motion.text
          x={-155} y={-70}
          fontSize="4.5"
          fill="hsl(var(--ivory-dim))"
          fontFamily="var(--font-mono)"
          letterSpacing="0.2em"
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 0.4 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          RAW INPUT
        </motion.text>
        <motion.text
          x={130} y={-70}
          fontSize="4.5"
          fill="hsl(var(--ivory-dim))"
          fontFamily="var(--font-mono)"
          letterSpacing="0.2em"
          textAnchor="middle"
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 0.4 } : {}}
          transition={{ delay: 1.6, duration: 0.5 }}
        >
          ASSET OUTPUT
        </motion.text>
      </svg>
    </div>
  );
}
