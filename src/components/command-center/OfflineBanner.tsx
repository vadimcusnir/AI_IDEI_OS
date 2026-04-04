/**
 * OfflineBanner — Shows a persistent banner when network drops.
 * Auto-dismisses on reconnect with a brief "Back online" confirmation.
 * Also blocks form submission via exported hook.
 */
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();

  // Auto-dismiss "Back online" after 3s
  if (isOnline && wasOffline) {
    setTimeout(resetWasOffline, 3000);
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[70] flex items-center justify-center gap-2 py-2 bg-destructive text-destructive-foreground text-xs font-medium"
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>You're offline — actions will resume when connection returns</span>
        </motion.div>
      )}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[70] flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-xs font-medium"
        >
          <Wifi className="h-3.5 w-3.5" />
          <span>Back online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
