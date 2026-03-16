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

  const sinceDays = digestType === "monthly" ? 30 : 7;
  const sinceDate = new Date(Date.now() - sinceDays * 86400000).toISOString();

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
      .gte("created_at", sinceDate)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!notifs || notifs.length === 0) continue;

    // Get user email from auth (service role)
    const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    // Get display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user_id)
      .single();

    const name = profile?.display_name || email.split("@")[0];
    const periodLabel = digestType === "monthly" ? "luna aceasta" : "săptămâna aceasta";

    // Build HTML digest with app branding
    const notifRows = notifs
      .map(
        (n: any) =>
          `<tr>
            <td style="padding:10px 14px;border-bottom:1px solid #1a1a2e;font-size:13px;color:#e0e0e0;">
              <strong style="color:#f5f5f5;">${escapeHtml(n.title)}</strong><br/>
              <span style="color:#888;">${escapeHtml(n.message || "")}</span>
            </td>
            <td style="padding:10px 14px;border-bottom:1px solid #1a1a2e;font-size:11px;color:#666;white-space:nowrap;vertical-align:top;">
              ${new Date(n.created_at).toLocaleDateString("ro-RO")}
            </td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="max-width:560px;margin:0 auto;font-family:'Inter',system-ui,sans-serif;background:#0d0d1a;color:#e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px 28px;">
          <img src="https://ai-idei-os.lovable.app/favicon.gif" alt="AI-IDEI" width="32" height="32" style="border-radius:50%;margin-bottom:12px;" />
          <h2 style="color:#f5f5f5;margin:0 0 4px;font-size:18px;">Salut ${escapeHtml(name)} 👋</h2>
          <p style="color:#999;margin:0;font-size:13px;">Ai <strong style="color:#f97316;">${notifs.length}</strong> notificări necitite ${periodLabel}</p>
        </div>
        <div style="padding:16px 28px 24px;">
          <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
            ${notifRows}
          </table>
          <a href="https://ai-idei-os.lovable.app/notifications"
             style="display:inline-block;padding:10px 28px;background:#f97316;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Vezi toate notificările →
          </a>
          <p style="margin-top:24px;font-size:10px;color:#555;">
            Poți dezactiva digest-ul din <a href="https://ai-idei-os.lovable.app/notifications" style="color:#f97316;">setările de notificări</a>.
          </p>
        </div>
      </div>
    `;

    // Enqueue email via pgmq
    await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: email,
        subject: `${digestType === "monthly" ? "📊 Rezumat lunar" : "📬 Rezumat săptămânal"} — AI-IDEI`,
        html,
        purpose: "digest",
        label: `${digestType}_digest`,
        queued_at: new Date().toISOString(),
        message_id: `digest-${digestType}-${user_id}-${new Date().toISOString().slice(0, 10)}`,
      },
    });

    enqueued++;
  }

  return new Response(
    JSON.stringify({ processed: enqueued, type: digestType }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
