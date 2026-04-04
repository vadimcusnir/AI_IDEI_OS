/**
 * OfflineBanner — Shows a persistent banner when network drops.
 * Auto-dismisses on reconnect with a brief "Back online" confirmation.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
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
      {showReconnected && online && (
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
