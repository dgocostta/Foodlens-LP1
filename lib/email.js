import { Resend } from "resend";
import { PROGRAM, money, topRate } from "./affiliate-program";

const FROM = process.env.RESEND_FROM || "FoodLens <noreply@send.foodlensgroup.com>";
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;
const LEAD_NOTIFICATION_TO =
  process.env.LEAD_NOTIFICATION_TO || "info@foodlensgroup.com";

let resend = null;
function getResend() {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Welcome email (sent to the restaurant owner who signed up)
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail({ to, name, restaurant }) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set; skipping welcome to", to);
    return { sent: false, reason: "not-configured" };
  }

  const firstName = (String(name || "").split(" ")[0] || "there").trim();
  const subject = `Welcome to FoodLens, ${firstName} 👋`;

  try {
    const res = await client.emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject,
      html: renderWelcomeHtml({ firstName, restaurant }),
      text: renderWelcomeText({ firstName, restaurant }),
    });
    if (res.error) {
      console.error("[email] Welcome send returned error:", res.error);
      return { sent: false, reason: res.error.message };
    }
    return { sent: true, id: res.data?.id };
  } catch (err) {
    console.error("[email] Welcome send threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

function renderWelcomeHtml({ firstName, restaurant }) {
  const restaurantLine = restaurant
    ? `<p style="margin:0 0 16px;color:#4A3F35;font-size:16px;line-height:1.5;">We're excited to help <strong>${escapeHtml(restaurant)}</strong> turn every dish into a 5-second sales pitch.</p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Welcome to FoodLens</title>
  </head>
  <body style="margin:0;padding:0;background:#FBF6EE;font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;color:#1A1410;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF6EE;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <tr>
              <td>
                <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;margin-bottom:32px;">
                  <span style="color:#1A1410;">Food</span><span style="color:#E96A3A;">Lens</span>
                  <span style="margin-left:6px;font-size:10px;font-weight:600;letter-spacing:0.25em;color:#4A3F35;text-transform:uppercase;">Group</span>
                </div>

                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:700;color:#1A1410;">
                  Welcome, ${escapeHtml(firstName)}.
                </h1>
                <p style="margin:0 0 16px;color:#4A3F35;font-size:16px;line-height:1.5;">
                  We got your details — thanks for signing up.
                </p>
                ${restaurantLine}

                <p style="margin:24px 0 12px;font-weight:600;color:#1A1410;font-size:16px;">Here's what happens next:</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;">
                  ${renderStep(1, "We reach out within 24 hours", "Someone from the FoodLens team will be in touch to learn about your menu and walk you through onboarding.")}
                  ${renderStep(2, "You send us photos of your dishes", "No fancy camera needed — phone shots work. We'll tell you exactly what we need.")}
                  ${renderStep(3, "We produce your video menu", "Our team turns your photos into mouth-watering HD videos and builds your multi-language menu. Ready in days, not months.")}
                  ${renderStep(4, "You launch and start selling more", "QR codes on your tables. Higher tickets, faster decisions, happier guests. Track it all live.")}
                </table>

                <p style="margin:24px 0 0;color:#4A3F35;font-size:14px;line-height:1.5;">
                  Have a question in the meantime? Just reply to this email — a real person will get back to you.
                </p>
                <p style="margin:16px 0 0;color:#4A3F35;font-size:14px;">
                  — The FoodLens team
                </p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:16px auto 0;color:#4A3F35;font-size:12px;text-align:center;">
            You're receiving this because you signed up at demo.foodlensgroup.com.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderStep(n, title, body) {
  return `<tr>
    <td style="padding-bottom:16px;vertical-align:top;width:36px;">
      <div style="width:28px;height:28px;border-radius:9999px;background:#E96A3A;color:#ffffff;font-weight:700;text-align:center;line-height:28px;font-size:14px;">${n}</div>
    </td>
    <td style="padding-bottom:16px;vertical-align:top;">
      <div style="font-weight:600;color:#1A1410;font-size:15px;margin-bottom:2px;">${escapeHtml(title)}</div>
      <div style="color:#4A3F35;font-size:14px;line-height:1.5;">${escapeHtml(body)}</div>
    </td>
  </tr>`;
}

function renderWelcomeText({ firstName, restaurant }) {
  return [
    `Welcome, ${firstName}.`,
    "",
    "We got your details — thanks for signing up.",
    restaurant
      ? `We're excited to help ${restaurant} turn every dish into a 5-second sales pitch.`
      : "",
    "",
    "Here's what happens next:",
    "1. We reach out within 24 hours — someone from the FoodLens team will walk you through onboarding.",
    "2. You send us photos of your dishes — phone shots are fine.",
    "3. We produce your video menu — ready in days, not months.",
    "4. You launch and start selling more — QR codes on your tables, higher tickets.",
    "",
    "Have a question in the meantime? Just reply to this email — a real person will get back to you.",
    "",
    "— The FoodLens team",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Lead notification (sent internally when someone signs up)
// ---------------------------------------------------------------------------

export async function sendLeadNotification({
  name,
  email,
  restaurant,
  phone,
  instagram,
  source,
  leadId,
}) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set; skipping lead notification.");
    return { sent: false, reason: "not-configured" };
  }

  const subject = `🍽️ New FoodLens signup: ${name}${restaurant ? ` (${restaurant})` : ""}`;

  const fields = [
    ["Restaurant", restaurant || "—"],
    ["Owner", name || "—"],
    ["Email", email || "—"],
    ["Phone", phone || "—"],
    ["Instagram", instagram || "—"],
    ["Source", source || "—"],
    ["Lead ID", leadId || "—"],
  ];

  const rows = fields
    .map(
      ([k, v]) => `<tr>
        <td style="padding:8px 12px;color:#4A3F35;font-size:14px;font-weight:600;width:120px;border-bottom:1px solid #F4ECDD;">${k}</td>
        <td style="padding:8px 12px;color:#1A1410;font-size:14px;border-bottom:1px solid #F4ECDD;">${escapeHtml(String(v))}</td>
      </tr>`,
    )
    .join("");

  const replyAddr = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : REPLY_TO;

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#FBF6EE;font-family:-apple-system,Inter,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;">
    <h2 style="margin:0 0 8px;font-size:18px;color:#1A1410;">New FoodLens signup</h2>
    <p style="margin:0 0 16px;color:#4A3F35;font-size:13px;">From demo.foodlensgroup.com</p>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:#FBF6EE;border-radius:8px;overflow:hidden;">
      ${rows}
    </table>
    <p style="margin:16px 0 0;color:#4A3F35;font-size:13px;">Open the admin dashboard to see uploaded dish photos and manage this lead.</p>
  </div>
</body></html>`;

  const text =
    `New FoodLens signup\n\n` +
    fields.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\nOpen the admin dashboard to see uploaded dish photos and manage this lead.`;

  try {
    const res = await client.emails.send({
      from: FROM,
      to: LEAD_NOTIFICATION_TO,
      replyTo: replyAddr,
      subject,
      html,
      text,
    });
    if (res.error) {
      console.error("[email] Lead notification returned error:", res.error);
      return { sent: false, reason: res.error.message };
    }
    return { sent: true, id: res.data?.id };
  } catch (err) {
    console.error("[email] Lead notification threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

// ---------------------------------------------------------------------------
// Affiliate / Promoter program emails (Phase 1)
// ---------------------------------------------------------------------------

const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "https://demo.foodlensgroup.com").replace(/\/$/, "");

function affiliateShell({ title, bodyHtml }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FBF6EE;font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;color:#1A1410;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF6EE;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <tr>
              <td>
                <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;margin-bottom:32px;">
                  <span style="color:#1A1410;">Food</span><span style="color:#E96A3A;">Lens</span>
                  <span style="margin-left:6px;font-size:10px;font-weight:600;letter-spacing:0.25em;color:#4A3F35;text-transform:uppercase;">Group</span>
                </div>
                ${bodyHtml}
                <p style="margin:24px 0 0;color:#4A3F35;font-size:14px;">— The FoodLens team</p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:16px auto 0;color:#4A3F35;font-size:12px;text-align:center;">
            You're receiving this because you applied to the FoodLens affiliate program.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Applicant confirmation — "we received your application"
export async function sendAffiliateApplicationReceived({ to, name }) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set; skipping affiliate-received to", to);
    return { sent: false, reason: "not-configured" };
  }
  const firstName = (String(name || "").split(" ")[0] || "there").trim();
  const subject = `We got your FoodLens affiliate application, ${firstName} 🎉`;
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:700;color:#1A1410;">Thanks for applying, ${escapeHtml(firstName)}.</h1>
    <p style="margin:0 0 16px;color:#4A3F35;font-size:16px;line-height:1.5;">Your application to become a FoodLens affiliate is in. We review every applicant by hand to keep the program high-quality.</p>
    <p style="margin:0 0 16px;color:#4A3F35;font-size:16px;line-height:1.5;">If you're approved, we'll email you your personal <strong>affiliate code</strong> and a link to your Affiliate Kit so you can start referring restaurants right away.</p>
    <p style="margin:0 0 0;color:#4A3F35;font-size:14px;line-height:1.5;">Questions? Just reply to this email.</p>`;
  const text = [
    `Thanks for applying, ${firstName}.`, "",
    "Your application to become a FoodLens affiliate is in. We review every applicant by hand.",
    "If you're approved, we'll email you your personal affiliate code and a link to your Affiliate Kit.", "",
    "Questions? Just reply to this email.", "", "— The FoodLens team",
  ].join("\n");
  try {
    const res = await client.emails.send({ from: FROM, to, replyTo: REPLY_TO, subject, html: affiliateShell({ title: subject, bodyHtml }), text });
    if (res.error) { console.error("[email] affiliate-received error:", res.error); return { sent: false, reason: res.error.message }; }
    return { sent: true, id: res.data?.id };
  } catch (err) {
    console.error("[email] affiliate-received threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

// Internal notification — new affiliate application
export async function sendAffiliateApplicationNotification({ name, email, phone, social, audience }) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set; skipping affiliate-application notification.");
    return { sent: false, reason: "not-configured" };
  }
  const subject = `🤝 New FoodLens affiliate application: ${name || "—"}`;
  const fields = [
    ["Name", name || "—"], ["Email", email || "—"], ["Phone", phone || "—"],
    ["Social", social || "—"], ["Audience / note", audience || "—"],
  ];
  const rows = fields.map(([k, v]) => `<tr>
      <td style="padding:8px 12px;color:#4A3F35;font-size:14px;font-weight:600;width:130px;border-bottom:1px solid #F4ECDD;vertical-align:top;">${k}</td>
      <td style="padding:8px 12px;color:#1A1410;font-size:14px;border-bottom:1px solid #F4ECDD;">${escapeHtml(String(v))}</td>
    </tr>`).join("");
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#FBF6EE;font-family:-apple-system,Inter,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;">
    <h2 style="margin:0 0 8px;font-size:18px;color:#1A1410;">New affiliate application</h2>
    <p style="margin:0 0 16px;color:#4A3F35;font-size:13px;">Approve in the admin dashboard → Affiliates tab to generate their code.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:#FBF6EE;border-radius:8px;overflow:hidden;">${rows}</table>
  </div>
</body></html>`;
  const text = `New affiliate application\n\n` + fields.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nApprove in the admin dashboard (Affiliates tab) to generate their code.`;
  const replyAddr = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : REPLY_TO;
  try {
    const res = await client.emails.send({ from: FROM, to: LEAD_NOTIFICATION_TO, replyTo: replyAddr, subject, html, text });
    if (res.error) { console.error("[email] affiliate-application notification error:", res.error); return { sent: false, reason: res.error.message }; }
    return { sent: true, id: res.data?.id };
  } catch (err) {
    console.error("[email] affiliate-application notification threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

// Approval — here's your code + Kit link
export async function sendAffiliateApproved({ to, name, code }) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set; skipping affiliate-approved to", to);
    return { sent: false, reason: "not-configured" };
  }
  const firstName = (String(name || "").split(" ")[0] || "there").trim();
  const safeCode = escapeHtml(String(code || ""));
  const fieldUrl = `${PUBLIC_BASE_URL}/field?code=${encodeURIComponent(code || "")}`;
  const kitUrl = `${PUBLIC_BASE_URL}/field/kit?code=${encodeURIComponent(code || "")}`;
  const subject = `You're in! Your FoodLens affiliate code is ${code}`;
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:700;color:#1A1410;">Welcome to the team, ${escapeHtml(firstName)}.</h1>
    <p style="margin:0 0 20px;color:#4A3F35;font-size:16px;line-height:1.5;">You're approved — and you're in as a <strong>${escapeHtml(PROGRAM.statusName)}</strong>. Earn up to <strong>${topRate()}% recurring</strong> for the life of every account, plus a ${money(PROGRAM.bonuses.fastStart.amount)} Fast-Start bonus if your first restaurant goes paid within ${PROGRAM.bonuses.fastStart.withinDays} days. Here's everything you need to start today.</p>
    <p style="margin:0 0 6px;color:#4A3F35;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Your affiliate code</p>
    <div style="margin:0 0 24px;font-size:24px;font-weight:800;letter-spacing:0.04em;color:#1A1410;background:#FBF6EE;border:1px dashed #E96A3A;border-radius:10px;padding:14px 18px;text-align:center;">${safeCode}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
      <tr><td style="border-radius:9999px;background:#E96A3A;">
        <a href="${fieldUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;">Add a restaurant lead →</a>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;color:#4A3F35;font-size:15px;line-height:1.5;">Grab your scripts, copy and assets in the <a href="${kitUrl}" style="color:#E96A3A;font-weight:600;">Affiliate Kit</a>. Keep your code handy — it's how every lead you bring in gets credited to you.</p>`;
  const text = [
    `Welcome to the team, ${firstName}.`, "",
    `You're approved as a ${PROGRAM.statusName}! Your affiliate code is: ${code}`, "",
    `Earn up to ${topRate()}% recurring for the life of every account. ${money(PROGRAM.bonuses.fastStart.amount)} Fast-Start bonus if your first restaurant goes paid within ${PROGRAM.bonuses.fastStart.withinDays} days.`, "",
    `Add a restaurant lead: ${fieldUrl}`,
    `Your Affiliate Kit (scripts, copy, assets): ${kitUrl}`, "",
    "Keep your code handy — it's how every lead you bring in gets credited to you.", "", "— The FoodLens team",
  ].join("\n");
  try {
    const res = await client.emails.send({ from: FROM, to, replyTo: REPLY_TO, subject, html: affiliateShell({ title: subject, bodyHtml }), text });
    if (res.error) { console.error("[email] affiliate-approved error:", res.error); return { sent: false, reason: res.error.message }; }
    return { sent: true, id: res.data?.id };
  } catch (err) {
    console.error("[email] affiliate-approved threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}
