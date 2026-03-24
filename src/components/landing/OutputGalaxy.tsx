/**
 * Output Galaxy — orbital cluster visualization.
 * Shows output families orbiting a central knowledge core.
 * Responsive: scales cleanly on mobile via SVG viewBox.
 */
import { motion } from "framer-motion";

const ORBITS = [
  { label: "Content", angle: 0, radius: 98, size: 26 },
  { label: "Education", angle: 72, radius: 102, size: 22 },
  { label: "Sales", angle: 144, radius: 96, size: 24 },
  { label: "Knowledge", angle: 216, radius: 100, size: 20 },
  { label: "Assistants", angle: 288, radius: 94, size: 18 },
];

export function OutputGalaxy() {
  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
      <svg viewBox="-150 -150 300 300" className="w-full h-auto" fill="none" role="img" aria-label="Output Galaxy showing content, education, sales, knowledge, and assistant asset families">
        {/* Orbital rings — subtler */}
        {[58, 92, 128].map((r, i) => (
          <circle
            key={r}
            cx={0} cy={0} r={r}
            stroke="hsl(var(--ivory-dim))"
            strokeWidth="0.35"
            opacity={0.08 + i * 0.025}
            strokeDasharray="2 5"
          />
        ))}

        {/* Central core */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <circle cx={0} cy={0} r={18} fill="hsl(var(--gold-oxide))" opacity={0.1} />
          <circle cx={0} cy={0} r={10} fill="hsl(var(--gold-oxide))" opacity={0.22} />
          <circle cx={0} cy={0} r={4} fill="hsl(var(--gold-oxide))" opacity={0.7} />
          <text
            x={0} y={30}
            textAnchor="middle"
            fontSize="4.5"
            fill="hsl(var(--gold-oxide))"
            fontFamily="var(--font-mono)"
            letterSpacing="0.18em"
            opacity={0.5}
          >
            KNOWLEDGE CORE
          </text>
        </motion.g>

        {/* Orbital nodes */}
        {ORBITS.map((orb, i) => {
          const rad = (orb.angle * Math.PI) / 180;
          const cx = Math.cos(rad) * orb.radius;
          const cy = Math.sin(rad) * orb.radius;
          return (
            <motion.g
              key={orb.label}
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 + i * 0.1, duration: 0.45 }}
            >
              <line
                x1={0} y1={0} x2={cx} y2={cy}
                stroke="hsl(var(--gold-oxide))"
                strokeWidth="0.4"
                opacity={0.15}
              />
              <circle
                cx={cx} cy={cy}
                r={orb.size / 2}
                stroke="hsl(var(--ivory-dim))"
                strokeWidth="0.6"
                fill="hsl(var(--obsidian-light))"
                opacity={0.7}
              />
              <circle cx={cx} cy={cy} r={1.8} fill="hsl(var(--gold-oxide))" opacity={0.5} />
              <text
                x={cx} y={cy + orb.size / 2 + 10}
                textAnchor="middle"
                fontSize="5"
                fill="hsl(var(--ivory-dim))"
                fontFamily="var(--font-mono)"
                letterSpacing="0.1em"
                opacity={0.6}
              >
                {orb.label.toUpperCase()}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
