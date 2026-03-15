import { useUIControl } from "@/hooks/useUIControl";

interface ControlledNavItemProps {
  /** Registry element ID, e.g. "nav.extractor" */
  elementId: string;
  children: React.ReactNode;
}

/**
 * Wraps a nav item with UI control registry visibility check.
 * If no registry entry exists, the item is visible by default.
 */
export function ControlledNavItem({ elementId, children }: ControlledNavItemProps) {
  const control = useUIControl(elementId);

  if (!control.visible) return null;

  return <>{children}</>;
}
