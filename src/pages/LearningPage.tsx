/**
 * LearningPage — Curated learning paths for platform mastery.
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { LearningPaths } from "@/components/learning/LearningPaths";
import { SkillRadar } from "@/components/profile/SkillRadar";
import { GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function LearningPage() {
  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Parcursuri — AI-IDEI" description="Învață să folosești platforma pas cu pas." />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Parcursuri de Învățare</h1>
              <p className="text-micro text-muted-foreground">Ghiduri pas cu pas pentru fiecare nivel</p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <LearningPaths />
            </div>
            <div>
              <SkillRadar />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
