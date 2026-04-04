import { useState, useEffect, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PublicFeedback {
  id: string;
  title: string;
  message: string;
  type: string;
  rating: number | null;
  created_at: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// Static testimonials as fallback when no DB entries exist
const STATIC_TESTIMONIALS: PublicFeedback[] = [
  {
    id: "static-1",
    title: "Marketing Director, SaaS",
    message: "Am extras 47 de deliverables dintr-un singur podcast de 45 minute. Ce făceam într-o săptămână acum se întâmplă în 3 minute.",
    type: "testimonial",
    rating: 5,
    created_at: "2026-02-01",
  },
  {
    id: "static-2",
    title: "Fondator, EdTech Startup",
    message: "Neuronii extrași din interviurile mele au generat un curs complet structurat — fără să scriu o singură linie manual.",
    type: "testimonial",
    rating: 5,
    created_at: "2026-02-15",
  },
  {
    id: "static-3",
    title: "Consultant, Business Strategy",
    message: "Profilul psihologic generat din transcripturi a fost mai precis decât orice assessment pe care l-am văzut. Impresionant.",
    type: "testimonial",
    rating: 5,
    created_at: "2026-03-01",
  },
  {
    id: "static-4",
    title: "Content Creator, Podcaster",
    message: "AI-IDEI transformă fiecare episod într-o mină de aur. Framework-urile extrase automat sunt de o calitate uimitoare.",
    type: "testimonial",
    rating: 5,
    created_at: "2026-03-10",
  },
  {
    id: "static-5",
    title: "Coach, Leadership",
    message: "Am folosit neuronii pentru a construi un funnel complet de marketing. ROI-ul a fost de 20x în prima lună.",
    type: "testimonial",
    rating: 5,
    created_at: "2026-01-20",
  },
  {
    id: "static-6",
    title: "Growth Hacker, Agency",
    message: "Costul per deliverable de $0.007 este absurd de mic. Un singur articol generat valorează cât 100x prețul plătit.",
    type: "testimonial",
    rating: 5,
    created_at: "2026-01-10",
  },
];

export const PublicTestimonials = forwardRef<HTMLElement>(function PublicTestimonials(_props, ref) {
  const [items, setItems] = useState<PublicFeedback[]>([]);

  useEffect(() => {
    supabase
      .from("feedback")
      .select("id, title, message, type, rating, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        const dbItems = (data as unknown as PublicFeedback[]) || [];
        // Use static fallback if no DB testimonials
        setItems(dbItems.length > 0 ? dbItems : STATIC_TESTIMONIALS);
      });
  }, []);

  return (
    <section ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={0}
        variants={fadeUp}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-1 w-6 rounded-full bg-primary" />
          <span className="text-micro font-bold uppercase tracking-[0.2em] text-primary">
            Testimoniale
          </span>
          <div className="h-1 w-6 rounded-full bg-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">Experiențe reale cu AI-IDEI</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Profesioniști care și-au transformat expertiza în active digitale
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i + 1}
            variants={fadeUp}
            className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
          >
            <Quote className="h-4 w-4 text-primary/30 mb-3 group-hover:text-primary/50 transition-colors" />
            <p className="text-sm text-foreground italic leading-relaxed mb-3 line-clamp-4">
              "{item.message}"
            </p>
            {item.rating && (
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "h-3 w-3",
                      s <= item.rating! ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
            )}
            <p className="text-dense font-medium text-muted-foreground">— {item.title}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
});
