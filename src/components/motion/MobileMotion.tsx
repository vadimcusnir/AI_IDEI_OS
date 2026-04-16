/**
 * MobileMotion — drop-in replacement for framer-motion's <motion.div>
 * that disables animations on mobile (< 768px) and when
 * the user has prefers-reduced-motion enabled.
 *
 * Usage:
 *   import { MobileMotion } from "@/components/motion/MobileMotion";
 *   <MobileMotion.div animate={{ opacity: 1 }} ... />
 *
 * On mobile or reduced-motion: renders a plain <div> with final styles,
 * skipping all animation overhead.
 */
import { forwardRef, useMemo, type ComponentProps, type JSX } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsMobile } from "@/hooks/use-mobile";

function createMobileMotionComponent<T extends keyof JSX.IntrinsicElements>(tag: T) {
  const MotionComponent = motion[tag as keyof typeof motion] as any;
  
  const Wrapped = forwardRef<any, HTMLMotionProps<any>>((props, ref) => {
    const reduced = useReducedMotion();
    const isMobile = useIsMobile();
    const skip = reduced || isMobile;

    const cleanProps = useMemo(() => {
      if (!skip) return props;
      // Strip animation props, keep layout & style
      const {
        initial, animate, exit, transition,
        whileHover, whileTap, whileFocus, whileInView, whileDrag,
        variants, layout, layoutId,
        ...rest
      } = props;
      return rest;
    }, [skip, props]);

    if (skip) {
      const Tag = tag as any;
      return <Tag ref={ref} {...cleanProps} />;
    }

    return <MotionComponent ref={ref} {...props} />;
  });

  Wrapped.displayName = `MobileMotion.${String(tag)}`;
  return Wrapped;
}

export const MobileMotion = {
  div: createMobileMotionComponent("div"),
  span: createMobileMotionComponent("span"),
  button: createMobileMotionComponent("button"),
  li: createMobileMotionComponent("li"),
  ul: createMobileMotionComponent("ul"),
  section: createMobileMotionComponent("section"),
  article: createMobileMotionComponent("article"),
  p: createMobileMotionComponent("p"),
  h2: createMobileMotionComponent("h2"),
  h3: createMobileMotionComponent("h3"),
} as const;
