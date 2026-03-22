import { useRef, useState, useCallback } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface EngineNode {
  label: string;
  x: number;
  y: number;
  depth: number;
  semantic: string;
}

const NODES: EngineNode[] = [
  { label: "Patterns", x: -420, y: -190, depth: 0.35, semantic: "Detect recurring structures in raw content" },
  { label: "Frameworks", x: 420, y: -150, depth: 0.55, semantic: "Extract reusable reasoning architectures" },
  { label: "Signals", x: -440, y: 180, depth: 0.65, semantic: "Identify psychological and behavioral cues" },
  { label: "Formulas", x: 400, y: 200, depth: 0.45, semantic: "Isolate proven copywriting structures" },
  { label: "Assets", x: 0, y: -280, depth: 0.25, semantic: "Convert insights into sellable outputs" },
  { label: "Profiles", x: -150, y: 270, depth: 0.4, semantic: "Map expertise into structured identity" },
  { label: "Campaigns", x: 280, y: -270, depth: 0.3, semantic: "Generate multi-channel execution plans" },
];

const TILT_SPRING = { stiffness: 110, damping: 22, mass: 0.6 };
const GLOW_SPRING = { stiffness: 70, damping: 24, mass: 0.8 };

export function ExtractionEngine() {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(frameRef, { once: true, amount: 0.35 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, TILT_SPRING);
  const smoothY = useSpring(pointerY, TILT_SPRING);
  const glowX = useSpring(pointerX, GLOW_SPRING);
  const glowY = useSpring(pointerY, GLOW_SPRING);

  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4, -4]);
  const glowLeft = useTransform(glowX, [-0.5, 0.5], ["26%", "74%"]);
  const glowTop = useTransform(glowY, [-0.5, 0.5], ["28%", "72%"]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduced || !frameRef.current) return;

      const rect = frameRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      pointerX.set(x);
      pointerY.set(y);
    },
    [pointerX, pointerY, reduced]
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
    setHoveredNode(null);
  }, [pointerX, pointerY]);

  return (
    <div className="relative w-full max-w-4xl mx-auto px-2 sm:px-4">
      <div
        ref={frameRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card"
      >
        <motion.div
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: reduced ? 0 : 0.45, ease: "easeOut" }}
          style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 1200 }}
        >
          {!reduced && (
            <motion.div
              className="absolute h-[280px] w-[280px] sm:h-[360px] sm:w-[360px] rounded-full pointer-events-none"
              style={{
                left: glowLeft,
                top: glowTop,
                x: "-50%",
                y: "-50%",
                background: "radial-gradient(circle, hsl(var(--gold-oxide) / 0.1) 0%, transparent 72%)",
              }}
            />
          )}

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--gold-oxide)/0.04)] blur-[72px]" />
          </div>

          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="-250 -200 500 400"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {NODES.map((node, index) => (
              <motion.line
                key={`line-${node.label}`}
                x1={0}
                y1={0}
                x2={node.x * node.depth}
                y2={node.y * node.depth}
                stroke={hoveredNode === index ? "hsl(var(--gold-oxide) / 0.48)" : "hsl(var(--gold-oxide) / 0.14)"}
                strokeWidth={hoveredNode === index ? 1.4 : 0.8}
                initial={reduced ? false : { opacity: 0, pathLength: 0 }}
                animate={isInView ? { opacity: 1, pathLength: 1 } : undefined}
                transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.25 + index * 0.05 }}
              />
            ))}

            <motion.path
              d="M-22 -12 L-12 -22 L12 -22 L22 -12 L22 12 L12 22 L-12 22 L-22 12 Z"
              stroke="hsl(var(--gold-oxide))"
              strokeWidth="1.2"
              fill="none"
              initial={reduced ? false : { opacity: 0, scale: 0.92 }}
              animate={isInView ? { opacity: 0.6, scale: 1 } : undefined}
              transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : 0.12 }}
            />
            <motion.circle
              cx={0}
              cy={0}
              r={10}
              stroke="hsl(var(--gold-oxide))"
              strokeWidth="0.6"
              fill="none"
              initial={reduced ? false : { opacity: 0 }}
              animate={isInView ? { opacity: 0.38 } : undefined}
              transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.18 }}
            />
            <motion.circle
              cx={0}
              cy={0}
              r={4}
              fill="hsl(var(--gold-oxide))"
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={isInView ? { opacity: 0.7, scale: 1 } : undefined}
              transition={{ duration: reduced ? 0 : 0.28, delay: reduced ? 0 : 0.22 }}
            />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <motion.line
                key={`tick-${deg}`}
                x1={0}
                y1={-16}
                x2={0}
                y2={-20}
                stroke="hsl(var(--gold-oxide))"
                strokeWidth="0.6"
                transform={`rotate(${deg})`}
                initial={reduced ? false : { opacity: 0 }}
                animate={isInView ? { opacity: 0.35 } : undefined}
                transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : 0.28 }}
              />
            ))}
          </svg>

          <motion.div
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.24 }}
          >
            <div className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] text-muted-foreground">CORE</div>
            <div className="mt-1 text-[11px] sm:text-sm font-semibold tracking-wide text-foreground">EXTRACTION ENGINE</div>
          </motion.div>

          {NODES.map((node, index) => {
            const nodeX = node.x * node.depth;
            const nodeY = node.y * node.depth;
            const isHovered = hoveredNode === index;

            return (
              <motion.button
                key={node.label}
                type="button"
                onPointerEnter={() => setHoveredNode(index)}
                onPointerLeave={() => setHoveredNode(null)}
                className="absolute left-1/2 top-1/2 z-20 cursor-default rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-mono tracking-wide focus-ring"
                style={{ transform: `translate(calc(-50% + ${nodeX}px), calc(-50% + ${nodeY}px))` }}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={
                  isInView
                    ? {
                        opacity: 1,
                        y: 0,
                        scale: isHovered ? 1.03 : 1,
                        borderColor: isHovered ? "hsl(var(--gold-oxide) / 0.45)" : "hsl(var(--border))",
                        backgroundColor: isHovered ? "hsl(var(--gold-oxide) / 0.08)" : "hsl(var(--card) / 0.92)",
                        color: isHovered ? "hsl(var(--gold-oxide))" : "hsl(var(--foreground))",
                      }
                    : undefined
                }
                transition={{ duration: reduced ? 0 : 0.22, delay: reduced ? 0 : 0.34 + index * 0.04 }}
                aria-label={`${node.label}: ${node.semantic}`}
              >
                {node.label}
              </motion.button>
            );
          })}
        </motion.div>

        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center pointer-events-none sm:bottom-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={hoveredNode ?? "idle"}
              initial={reduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: reduced ? 0 : 0.18 }}
              className={hoveredNode === null ? "px-4 text-center text-[10px] sm:text-xs font-mono tracking-[0.12em] text-muted-foreground/60" : "px-4 text-center text-[10px] sm:text-xs font-mono tracking-[0.08em] text-[hsl(var(--gold-oxide))]"}
            >
              {hoveredNode === null ? "hover a node to explore" : NODES[hoveredNode].semantic}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
