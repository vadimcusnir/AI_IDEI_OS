/**
 * MyAnalytics — Personal analytics page for authenticated users.
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { UserActivityStats } from "@/components/analytics/UserActivityStats";
import { ROICalculator } from "@/components/analytics/ROICalculator";
import { ProductivityTimeline } from "@/components/analytics/ProductivityTimeline";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function MyAnalytics() {
  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Analizele Mele — AI-IDEI" description="Dashboard personal cu KPI-uri, ROI și activitate." />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Analizele Mele</h1>
              <p className="text-micro text-muted-foreground">Performanța ta pe platformă</p>
            </div>
          </motion.div>

          <div className="space-y-6">
            <UserActivityStats />
            <div className="grid md:grid-cols-2 gap-6">
              <ROICalculator />
              <ProductivityTimeline />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
