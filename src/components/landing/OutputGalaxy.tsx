/**
 * Output Galaxy — orbital cluster visualization.
 * Shows output families orbiting a central knowledge core.
 */
import { motion } from "framer-motion";

const ORBITS = [
  { label: "Content", angle: 0, radius: 100, size: 28 },
  { label: "Education", angle: 72, radius: 105, size: 24 },
  { label: "Sales", angle: 144, radius: 98, size: 26 },
  { label: "Knowledge", angle: 216, radius: 102, size: 22 },
  { label: "Assistants", angle: 288, radius: 96, size: 20 },
];

export function OutputGalaxy() {
  return (
    <div className="relative w-full max-w-lg mx-auto" style={{ aspectRatio: "1" }}>
      <svg viewBox="-150 -150 300 300" className="w-full h-full" fill="none">
        {/* Orbital rings */}
        {[60, 95, 130].map((r, i) => (
          <circle
            key={r}
            cx={0}
            cy={0}
            r={r}
            stroke="hsl(var(--ivory-dim))"
            strokeWidth="0.4"
            opacity={0.12 + i * 0.03}
            strokeDasharray="2 4"
          />
        ))}

        {/* Central core */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <circle cx={0} cy={0} r={20} fill="hsl(var(--gold-oxide))" opacity={0.15} />
          <circle cx={0} cy={0} r={12} fill="hsl(var(--gold-oxide))" opacity={0.3} />
          <circle cx={0} cy={0} r={5} fill="hsl(var(--gold-oxide))" opacity={0.8} />
          <text
            x={0}
            y={32}
            textAnchor="middle"
            fontSize="5"
            fill="hsl(var(--gold-oxide))"
            fontFamily="var(--font-mono)"
            letterSpacing="0.15em"
            opacity={0.6}
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
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
            >
              {/* Connection line */}
              <line
                x1={0}
                y1={0}
                x2={cx}
                y2={cy}
                stroke="hsl(var(--gold-oxide))"
                strokeWidth="0.5"
                opacity={0.2}
              />
              {/* Node */}
              <circle
                cx={cx}
                cy={cy}
                r={orb.size / 2}
                stroke="hsl(var(--ivory-dim))"
                strokeWidth="0.8"
                fill="hsl(var(--obsidian-light))"
                opacity={0.8}
              />
              <circle
                cx={cx}
                cy={cy}
                r={2}
                fill="hsl(var(--gold-oxide))"
                opacity={0.6}
              />
              <text
                x={cx}
                y={cy + orb.size / 2 + 10}
                textAnchor="middle"
                fontSize="5.5"
                fill="hsl(var(--ivory-dim))"
                fontFamily="var(--font-mono)"
                letterSpacing="0.08em"
                opacity={0.7}
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
