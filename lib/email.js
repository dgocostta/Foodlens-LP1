import { Resend } from "resend";

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
