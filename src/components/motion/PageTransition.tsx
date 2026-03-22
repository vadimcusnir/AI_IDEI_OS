import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/** Wraps a page in a minimal fade-up entrance animation */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : "initial"}
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its children's entrance */
export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      variants={staggerContainer}
      initial={reduced ? false : "initial"}
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual stagger item — use inside StaggerContainer */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div variants={staggerItem} className={className}>{children}</motion.div>;
}

/** Fade-in on scroll (viewport entry) */
export function FadeInView({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={reduced ? { duration: 0 } : { duration: 0.28, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { pageVariants, staggerContainer, staggerItem };
