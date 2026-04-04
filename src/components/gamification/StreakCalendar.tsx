import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Calendar, Flame } from "lucide-react";

export function StreakCalendar() {
  const { user } = useAuth();
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get XP transactions for last 35 days to build calendar
      const since = new Date();
      since.setDate(since.getDate() - 35);

      const { data } = await supabase
        .from("xp_transactions")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", since.toISOString());

      const days = new Set<string>();
      (data || []).forEach((tx: any) => {
        days.add(new Date(tx.created_at).toISOString().split("T")[0]);
      });
      setActiveDays(days);
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) return null;

  // Build 5 weeks of days (Mon-Sun), ending with current week
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - dayOfWeek - 28); // 4 weeks back + current week start

  const weeks: string[][] = [];
  const current = new Date(startDate);
  for (let w = 0; w < 5; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const todayStr = today.toISOString().split("T")[0];
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
        <Calendar className="h-3 w-3" /> Activity Calendar
      </h3>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((label, i) => (
            <span key={i} className="text-nano text-muted-foreground/60 h-[14px] flex items-center">
              {label}
            </span>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => {
              const isActive = activeDays.has(day);
              const isToday = day === todayStr;
              const isFuture = day > todayStr;

              return (
                <div
                  key={day}
                  title={`${day}${isActive ? " ✓" : ""}`}
                  className={cn(
                    "h-[14px] w-[14px] rounded-sm transition-colors",
                    isFuture
                      ? "bg-transparent"
                      : isActive
                      ? "bg-primary"
                      : "bg-muted/60",
                    isToday && "ring-1 ring-primary ring-offset-1 ring-offset-background"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-3 text-nano text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-muted/60" />
          <span>Inactive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
          <span>Active</span>
        </div>
        <span className="ml-auto">{activeDays.size} active days (5 weeks)</span>
      </div>
    </div>
  );
}
