import { useState, useEffect } from "react";
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

export function PublicTestimonials() {
  const [items, setItems] = useState<PublicFeedback[]>([]);

  useEffect(() => {
    supabase
      .from("feedback")
      .select("id, title, message, type, rating, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setItems((data as unknown as PublicFeedback[]) || []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={0}
        variants={fadeUp}
        className="text-center mb-10"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">
          Ce spun utilizatorii
        </span>
        <h2 className="text-2xl font-serif font-bold">Experiențe reale cu AI-IDEI</h2>
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
            className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all"
          >
            <Quote className="h-4 w-4 text-primary/30 mb-3" />
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
            <p className="text-[11px] font-medium text-muted-foreground">— {item.title}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
