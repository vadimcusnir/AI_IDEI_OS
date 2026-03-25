import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  angle: number;
  distance: number;
  scale: number;
  duration: number;
}

const MAGIC_EMOJIS = ["✨", "⚡", "🪄", "💫", "🔥", "⭐", "🌟", "✦"];

export function MagicButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripple, setRipple] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const idRef = useRef(0);

  const explode = useCallback(() => {
    setRipple(true);
    setGlowing(true);
    setTimeout(() => setRipple(false), 600);
    setTimeout(() => setGlowing(false), 1200);

    const newParticles: Particle[] = Array.from({ length: 18 }, () => {
      idRef.current++;
      return {
        id: idRef.current,
        x: 0,
        y: 0,
        emoji: MAGIC_EMOJIS[Math.floor(Math.random() * MAGIC_EMOJIS.length)],
        angle: Math.random() * 360,
        distance: 60 + Math.random() * 120,
        scale: 0.5 + Math.random() * 1,
        duration: 0.5 + Math.random() * 0.6,
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);

    // Clean up after animation
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 1400);
  }, []);

  return (
    <span
      className={`relative inline-block cursor-pointer select-none ${className ?? ""}`}
      onClick={explode}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && explode()}
    >
      {/* Glow pulse behind text */}
      <AnimatePresence>
        {glowing && (
          <motion.span
            className="absolute inset-0 -inset-x-4 -inset-y-2 rounded-xl bg-[hsl(var(--gold-oxide)/0.2)] blur-xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.3 }}
            exit={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* Ripple ring */}
      <AnimatePresence>
        {ripple && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[hsl(var(--gold-oxide)/0.6)] pointer-events-none"
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "40px", height: "40px" }}
          />
        )}
      </AnimatePresence>

      {/* The text itself with bounce */}
      <motion.span
        className="relative z-10 inline-block"
        whileTap={{ scale: 1.12 }}
        animate={glowing ? { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.span>

      {/* Exploding particles */}
      <AnimatePresence>
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;

          return (
            <motion.span
              key={p.id}
              className="absolute pointer-events-none z-20"
              style={{
                left: "50%",
                top: "50%",
                fontSize: `${p.scale * 20}px`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.2 }}
              animate={{
                x: tx,
                y: ty,
                opacity: [1, 1, 0],
                scale: [0.2, p.scale, 0],
                rotate: Math.random() * 360,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                ease: "easeOut",
              }}
            >
              {p.emoji}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </span>
  );
}
