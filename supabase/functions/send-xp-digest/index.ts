import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Get all users with XP activity in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: activeUsers, error: usersErr } = await supabase
      .from("xp_transactions")
      .select("user_id")
      .gte("created_at", sevenDaysAgo)
      .limit(1000);

    if (usersErr) throw usersErr;

    const uniqueUserIds = [...new Set((activeUsers || []).map((r: any) => r.user_id))];

    let sentCount = 0;

    for (const userId of uniqueUserIds) {
      // Check notification preferences
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("digest_frequency")
        .eq("user_id", userId)
        .single();

      if (prefs?.digest_frequency === "never") continue;

      // Get XP summary
      const { data: xpTx } = await supabase
        .from("xp_transactions")
        .select("amount, source, description")
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });

      const totalXP = (xpTx || []).reduce((sum: number, t: any) => sum + t.amount, 0);
      if (totalXP === 0) continue;

      // Get current level info
      const { data: xpState } = await supabase
        .from("user_xp")
        .select("level, rank_name, total_xp")
        .eq("user_id", userId)
        .single();

      // Get streak info
      const { data: streak } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", userId)
        .single();

      // Count new achievements this week
      const { count: newAchievements } = await supabase
        .from("user_achievements")
        .select("id", { count: "exact", head: true })
        .eq("user_id", visitorId)
        .gte("unlocked_at", sevenDaysAgo);

      // Create digest notification
      const lines = [
        `📊 Weekly XP: +${totalXP} XP`,
        `📈 Level ${xpState?.level || 1} — ${xpState?.rank_name || "Novice"}`,
        streak?.current_streak ? `🔥 Streak: ${streak.current_streak} days` : null,
        newAchievements ? `🏆 ${newAchievements} new achievement(s)` : null,
      ].filter(Boolean);

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "xp_digest",
        title: "📬 Weekly Progress Report",
        message: lines.join("\n"),
        link: "/gamification",
        meta: { total_xp: totalXP, level: xpState?.level, streak: streak?.current_streak },
      });

      sentCount++;
    }

    return new Response(
      JSON.stringify({ success: true, digests_sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
