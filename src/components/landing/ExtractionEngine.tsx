/**
 * Interactive Extraction Engine — the central hero visual.
 * DOM + SVG + Motion architecture:
 * - Pointer tilt via useMotionValue + useSpring
 * - SVG connections that glow on hover
 * - Parallax depth per orbital node
 * - Semantic response text on hover
 * - Idle breathing animation
 * - Pointer glow follower
 * - Reduced motion fallback
 */
import { useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  AnimatePresence,
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
  { label: "Patterns", x: -300, y: -140, depth: 0.35, semantic: "Detect recurring structures in raw content" },
  { label: "Frameworks", x: 300, y: -110, depth: 0.55, semantic: "Extract reusable reasoning architectures" },
  { label: "Signals", x: -320, y: 130, depth: 0.65, semantic: "Identify psychological and behavioral cues" },
  { label: "Formulas", x: 280, y: 150, depth: 0.45, semantic: "Isolate proven copywriting structures" },
  { label: "Assets", x: 0, y: -210, depth: 0.25, semantic: "Convert insights into sellable outputs" },
  { label: "Profiles", x: -100, y: 200, depth: 0.4, semantic: "Map expertise into structured identity" },
  { label: "Campaigns", x: 200, y: -200, depth: 0.3, semantic: "Generate multi-channel execution plans" },
];

/* Spring config for the tilt — calm, premium feel */
const SPRING = { stiffness: 120, damping: 20, mass: 0.5 };
const GLOW_SPRING = { stiffness: 80, damping: 25, mass: 0.6 };

export function ExtractionEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  /* ── Pointer tracking ── */
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, SPRING);
  const springY = useSpring(pointerY, SPRING);

  /* Glow position (slower spring for dreamy lag) */
  const glowX = useSpring(pointerX, GLOW_SPRING);
  const glowY = useSpring(pointerY, GLOW_SPRING);

  /* Tilt: ±6° max */
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);

  /* Background parallax */
  const bgX = useTransform(springX, [-0.5, 0.5], [-20, 20]);
  const bgY = useTransform(springY, [-0.5, 0.5], [-20, 20]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduced) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
      pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [reduced, pointerX, pointerY]
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  /* ── Node position transforms (parallax depth) ── */
  const getNodeTransforms = (node: EngineNode) => {
    const nx = useTransform(springX, [-0.5, 0.5], [
      node.x * node.depth - 18,
      node.x * node.depth + 18,
    ]);
    const ny = useTransform(springY, [-0.5, 0.5], [
      node.y * node.depth - 18,
      node.y * node.depth + 18,
    ]);
    return { nx, ny };
  };

  /* ── Glow position as CSS ── */
  const glowLeft = useTransform(glowX, [-0.5, 0.5], ["20%", "80%"]);
  const glowTop = useTransform(glowY, [-0.5, 0.5], ["20%", "80%"]);

  return (
    <div className="relative w-full max-w-4xl mx-auto px-2 sm:px-4">
      <motion.div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={
          reduced
            ? {}
            : { rotateX, rotateY, transformPerspective: 1200 }
        }
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* ── Strat 1: Pointer Glow ── */}
        {!reduced && (
          <motion.div
            className="absolute w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full pointer-events-none"
            style={{
              left: glowLeft,
              top: glowTop,
              x: "-50%",
              y: "-50%",
              background:
                "radial-gradient(circle, hsl(var(--gold-oxide) / 0.08) 0%, transparent 70%)",
            }}
          />
        )}

        {/* ── Strat 2: Background ambient layer ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={reduced ? {} : { x: bgX, y: bgY }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full bg-[hsl(var(--gold-oxide)/0.04)] blur-[100px]" />
        </motion.div>

        {/* ── SVG Connection Lines ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="-250 -200 500 400"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {NODES.map((node, i) => (
            <motion.line
              key={`line-${i}`}
              x1={0}
              y1={0}
              x2={node.x * node.depth}
              y2={node.y * node.depth}
              stroke={`hsl(var(--gold-oxide) / ${hoveredNode === i ? 0.5 : 0.12})`}
              strokeWidth={hoveredNode === i ? 1.5 : 0.8}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                isInView
                  ? { pathLength: 1, opacity: 1 }
                  : {}
              }
              transition={{
                pathLength: { delay: 0.6 + i * 0.08, duration: 0.6 },
                opacity: { delay: 0.6 + i * 0.08, duration: 0.3 },
                stroke: { duration: 0.3 },
                strokeWidth: { duration: 0.3 },
              }}
            />
          ))}

          {/* Core octagon */}
          <motion.path
            d="M-22 -12 L-12 -22 L12 -22 L22 -12 L22 12 L12 22 L-12 22 L-22 12 Z"
            stroke="hsl(var(--gold-oxide))"
            strokeWidth="1.2"
            fill="none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 0.6 } : {}}
            transition={{ delay: 0.4, duration: 0.7 }}
          />
          <motion.circle
            cx={0}
            cy={0}
            r={10}
            stroke="hsl(var(--gold-oxide))"
            strokeWidth="0.6"
            fill="none"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={isInView ? { opacity: 0.4, scale: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
          <motion.circle
            cx={0}
            cy={0}
            r={4}
            fill="hsl(var(--gold-oxide))"
            initial={{ opacity: 0, scale: 0 }}
            animate={
              isInView
                ? {
                    opacity: [0.6, 0.9, 0.6],
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{
              delay: 0.6,
              duration: 3,
              repeat: reduced ? 0 : Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Tick marks */}
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
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 0.35 } : {}}
              transition={{ delay: 0.8 + deg * 0.001, duration: 0.3 }}
            />
          ))}
        </svg>

        {/* ── Core label ── */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] text-muted-foreground">
            CORE
          </div>
          <div className="text-[11px] sm:text-sm font-semibold text-foreground mt-1 tracking-wide">
            EXTRACTION ENGINE
          </div>
        </motion.div>

        {/* ── Orbital Nodes ── */}
        {NODES.map((node, i) => {
          const { nx, ny } = getNodeTransforms(node);
          const isHovered = hoveredNode === i;

          return (
            <motion.button
              key={node.label}
              onPointerEnter={() => setHoveredNode(i)}
              onPointerLeave={() => setHoveredNode(null)}
              className="absolute left-1/2 top-1/2 z-20 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-mono tracking-wide backdrop-blur-sm cursor-default transition-colors duration-200 focus-ring"
              style={
                reduced
                  ? {
                      transform: `translate(calc(-50% + ${node.x * node.depth}px), calc(-50% + ${node.y * node.depth}px))`,
                    }
                  : { x: nx, y: ny, translateX: "-50%", translateY: "-50%" }
              }
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                isInView
                  ? {
                      opacity: 1,
                      scale: isHovered ? 1.08 : 1,
                      borderColor: isHovered
                        ? "hsl(var(--gold-oxide) / 0.5)"
                        : "hsl(var(--border))",
                      backgroundColor: isHovered
                        ? "hsl(var(--gold-oxide) / 0.08)"
                        : "hsl(var(--card) / 0.7)",
                      color: isHovered
                        ? "hsl(var(--gold-oxide))"
                        : "hsl(var(--foreground))",
                    }
                  : {}
              }
              transition={{
                opacity: { delay: 1 + i * 0.1, duration: 0.5 },
                scale: { duration: 0.25, type: "spring", stiffness: 300, damping: 20 },
                borderColor: { duration: 0.2 },
                backgroundColor: { duration: 0.2 },
                color: { duration: 0.2 },
              }}
              aria-label={`${node.label}: ${node.semantic}`}
            >
              {node.label}
            </motion.button>
          );
        })}

        {/* ── Strat 3: Semantic Response ── */}
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center pointer-events-none z-20">
          <AnimatePresence mode="wait">
            {hoveredNode !== null ? (
              <motion.p
                key={hoveredNode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] sm:text-xs font-mono tracking-[0.08em] text-[hsl(var(--gold-oxide))] px-4 text-center"
              >
                {NODES[hoveredNode].semantic}
              </motion.p>
            ) : (
              <motion.p
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[10px] sm:text-xs font-mono tracking-[0.12em] text-muted-foreground/50 px-4 text-center"
              >
                hover a node to explore
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
