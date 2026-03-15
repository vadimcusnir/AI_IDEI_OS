import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * send-digest — Weekly / Monthly notification digest emails.
 * Called by pg_cron:
 *   Weekly:  every Monday 09:00 UTC
 *   Monthly: 1st of month 09:00 UTC
 *
 * Reads notification_preferences for digest opt-in,
 * aggregates unread notifications, enqueues email.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Determine digest type from body or default to weekly
  let digestType = "weekly";
  try {
    const body = await req.json();
    if (body.type === "monthly") digestType = "monthly";
  } catch {
    // default weekly
  }

  const sinceInterval = digestType === "monthly" ? "30 days" : "7 days";

  // Get users with digest preference enabled
  const prefColumn = digestType === "monthly" ? "monthly_digest" : "weekly_digest";
  const { data: users, error: usersErr } = await supabase
    .from("notification_preferences")
    .select("user_id")
    .eq(prefColumn, true);

  if (usersErr || !users?.length) {
    return new Response(
      JSON.stringify({ processed: 0, reason: usersErr?.message || "no_subscribers" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let enqueued = 0;

  for (const { user_id } of users) {
    // Get unread notifications from interval
    const { data: notifs } = await supabase
      .from("notifications")
      .select("type, title, message, link, created_at")
      .eq("user_id", user_id)
      .eq("read", false)
      .gte("created_at", `now() - interval '${sinceInterval}'`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!notifs || notifs.length === 0) continue;

    // Get user email from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user_id)
      .single();

    // Get email from auth (service role)
    const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const name = profile?.display_name || email.split("@")[0];
    const periodLabel = digestType === "monthly" ? "luna aceasta" : "săptămâna aceasta";

    // Build HTML digest
    const notifRows = notifs
      .map(
        (n: any) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">
              <strong>${n.title}</strong><br/>
              <span style="color:#666;">${n.message || ""}</span>
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:11px;color:#999;white-space:nowrap;">
              ${new Date(n.created_at).toLocaleDateString("ro-RO")}
            </td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif;">
        <h2 style="color:#111;">Salut ${name} 👋</h2>
        <p style="color:#555;">Ai <strong>${notifs.length}</strong> notificări necitite ${periodLabel}:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          ${notifRows}
        </table>
        <a href="https://ai-idei-os.lovable.app/notifications"
           style="display:inline-block;padding:10px 24px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Vezi toate notificările
        </a>
        <p style="margin-top:24px;font-size:11px;color:#aaa;">
          Poți dezactiva digest-ul din setările de notificări.
        </p>
      </div>
    `;

    // Enqueue email
    await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: email,
        subject: `${digestType === "monthly" ? "📊 Rezumat lunar" : "📬 Rezumat săptămânal"} — AI-IDEI`,
        html,
        purpose: "digest",
        label: `${digestType}_digest`,
        queued_at: new Date().toISOString(),
        message_id: `digest-${digestType}-${user_id}-${Date.now()}`,
      },
    });

    enqueued++;
  }

  return new Response(
    JSON.stringify({ processed: enqueued, type: digestType }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
