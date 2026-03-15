import { useUIControl } from "@/hooks/useUIControl";

interface ControlledSectionProps {
  /** Registry element ID, e.g. "home.quick_actions" */
  elementId: string;
  children: React.ReactNode;
  /** Optional fallback when section is hidden */
  fallback?: React.ReactNode;
}

/**
 * Wraps any UI section with registry-based visibility/enabled control.
 * Falls back to visible+enabled if no registry entry exists.
 */
export function ControlledSection({ elementId, children, fallback = null }: ControlledSectionProps) {
  const control = useUIControl(elementId);

  if (control.loading) return null;
  if (!control.visible) return <>{fallback}</>;

  return (
    <div className={control.enabled ? "" : "opacity-50 pointer-events-none"}>
      {children}
    </div>
  );
}
