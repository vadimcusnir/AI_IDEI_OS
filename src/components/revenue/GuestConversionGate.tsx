/**
 * GuestConversionGate — Intercepts guest users trying to execute services.
 * Shows value preview + signup CTA instead of silently blocking.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface GuestConversionGateProps {
  open: boolean;
  onClose: () => void;
  serviceName?: string;
  estimatedOutputs?: number;
}

export function GuestConversionGate({ open, onClose, serviceName, estimatedOutputs = 50 }: GuestConversionGateProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            Unlock AI Execution
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Value preview */}
          <div className="rounded-xl bg-muted/30 border border-border/50 p-4 space-y-3">
            {serviceName && (
              <p className="text-sm text-muted-foreground">
                You selected: <span className="font-semibold text-foreground">{serviceName}</span>
              </p>
            )}
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-foreground">{estimatedOutputs}+</span>
              </motion.div>
              <span className="text-sm text-muted-foreground">professional outputs generated automatically</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["Articles", "Social Posts", "Frameworks", "Scripts", "Hooks"].map(tag => (
                <Badge key={tag} variant="secondary" className="text-micro px-1.5 py-0 h-5">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <p className="text-xs text-muted-foreground text-center">
            <Zap className="inline h-3 w-3 text-primary mr-1" />
            2,847 professionals already creating with AI-IDEI
          </p>

          {/* CTA */}
          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => {
                onClose();
                navigate("/auth?mode=signup&redirect=/services");
              }}
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                onClose();
                navigate("/auth?redirect=/services");
              }}
            >
              Already have an account? Sign in
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
