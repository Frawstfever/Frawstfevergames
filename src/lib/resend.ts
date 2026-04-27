import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Frawst Fever <contact@frawstfevergames.ca>";

/** Generate a 6-digit verification code */
export function generateVerifyCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(amount: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

interface OrderEmailItem {
  title: string;
  platform: string;
  conditionCode: string;
  qty: number;
  price: number;
  image?: string;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency?: string;
  fulfillment: "ship" | "pickup";
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

function itemRows(items: OrderEmailItem[], currency: string): string {
  return items.map((i) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; vertical-align: top;">
        ${i.image ? `<img src="${i.image}" alt="" width="48" style="border-radius: 4px; display: block;">` : ""}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; vertical-align: top;">
        <div style="font-weight: 600; color: #1a0d2e;">${escapeHtml(i.title)}</div>
        <div style="font-size: 12px; color: #6b5b8f;">${escapeHtml(i.platform)} · ${escapeHtml(i.conditionCode)} · ×${i.qty}</div>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; vertical-align: top; text-align: right; white-space: nowrap;">
        ${money(i.price * i.qty, currency)}
      </td>
    </tr>
  `).join("");
}

/** Confirmation email after payment succeeds. */
export async function sendOrderPaidEmail(data: OrderEmailData) {
  const resend = getResend();
  const currency = data.currency || "CAD";
  const addrBlock = data.fulfillment === "ship" && data.address ? `
    <tr><td colspan="3" style="padding-top: 18px;">
      <div style="font-size: 13px; color: #6b5b8f; margin-bottom: 4px;">Ship to</div>
      <div style="font-size: 14px; color: #1a0d2e; line-height: 1.6;">
        ${escapeHtml(data.customerName)}<br>
        ${escapeHtml(data.address.line1 || "")}<br>
        ${data.address.line2 ? escapeHtml(data.address.line2) + "<br>" : ""}
        ${escapeHtml(data.address.city || "")}, ${escapeHtml(data.address.state || "")} ${escapeHtml(data.address.postalCode || "")}<br>
        ${escapeHtml(data.address.country || "CA")}
      </div>
    </td></tr>` : data.fulfillment === "pickup" ? `
    <tr><td colspan="3" style="padding-top: 18px;">
      <div style="font-size: 13px; color: #6b5b8f; margin-bottom: 4px;">Fulfillment</div>
      <div style="font-size: 14px; color: #1a0d2e;">Local pickup — we'll email when ready.</div>
    </td></tr>` : "";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `Payment received — order ${data.orderNumber}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">Thanks for your order!</h1>
          <p style="font-size: 14px; color: #6b5b8f; margin-top: 6px;">
            Order <strong style="color: #9b5cff;">${escapeHtml(data.orderNumber)}</strong> · Payment confirmed
          </p>
        </div>
        <p style="font-size: 15px; color: #333;">Hey ${escapeHtml(data.customerName)},</p>
        <p style="font-size: 15px; color: #333;">
          We received your payment and are preparing your order.
          You'll get another email with tracking info when your order ships (within 5 business days).
        </p>
        <table style="width: 100%; margin-top: 18px; border-collapse: collapse;">
          <tbody>
            ${itemRows(data.items, currency)}
            <tr>
              <td></td>
              <td style="padding-top: 12px; font-size: 13px; color: #6b5b8f;">Subtotal</td>
              <td style="padding-top: 12px; text-align: right; font-size: 13px; color: #6b5b8f;">${money(data.subtotal, currency)}</td>
            </tr>
            <tr>
              <td></td>
              <td style="padding: 4px 0; font-size: 13px; color: #6b5b8f;">Shipping</td>
              <td style="padding: 4px 0; text-align: right; font-size: 13px; color: #6b5b8f;">${data.shipping > 0 ? money(data.shipping, currency) : "Free"}</td>
            </tr>
            <tr>
              <td></td>
              <td style="padding-top: 8px; font-size: 16px; font-weight: 700; color: #1a0d2e; border-top: 2px solid #1a0d2e;">Total</td>
              <td style="padding-top: 8px; text-align: right; font-size: 16px; font-weight: 700; color: #1a0d2e; border-top: 2px solid #1a0d2e;">${money(data.total, currency)}</td>
            </tr>
            ${addrBlock}
          </tbody>
        </table>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          Questions? Reply to this email or contact support@frawstfevergames.ca
        </p>
      </div>
    `,
  });
}

/** Notification email when order ships. */
export async function sendOrderShippedEmail(data: OrderEmailData & {
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
}) {
  const resend = getResend();
  const currency = data.currency || "CAD";
  const carrier = data.trackingCarrier || "Canada Post";
  const trackingBlock = data.trackingNumber ? `
    <div style="background: #f7f3ff; border: 1px solid #e5dcf3; border-radius: 10px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 13px; color: #6b5b8f; margin-bottom: 4px;">Tracking ${escapeHtml(carrier)}</div>
      <div style="font-size: 17px; font-weight: 700; color: #1a0d2e; font-family: monospace; letter-spacing: 1px;">
        ${escapeHtml(data.trackingNumber)}
      </div>
      ${data.trackingUrl ? `
        <a href="${data.trackingUrl}" style="display: inline-block; margin-top: 10px; padding: 10px 18px; background: #9b5cff; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Track package →
        </a>
      ` : ""}
    </div>
  ` : `
    <div style="background: #f7f3ff; border: 1px solid #e5dcf3; border-radius: 10px; padding: 18px; margin: 20px 0; font-size: 14px; color: #6b5b8f;">
      Your order is on its way with ${escapeHtml(carrier)}. Tracking details will follow if available.
    </div>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `Your order has shipped! · ${data.orderNumber}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">Your order is on its way!</h1>
          <p style="font-size: 14px; color: #6b5b8f; margin-top: 6px;">
            Order <strong style="color: #9b5cff;">${escapeHtml(data.orderNumber)}</strong>
          </p>
        </div>
        <p style="font-size: 15px; color: #333;">Hey ${escapeHtml(data.customerName)},</p>
        <p style="font-size: 15px; color: #333;">
          Great news — your order has shipped! Delivery typically takes 2–10 business days depending on your location.
        </p>
        ${trackingBlock}
        <table style="width: 100%; margin-top: 18px; border-collapse: collapse;">
          <tbody>${itemRows(data.items, currency)}</tbody>
        </table>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          Questions? Reply to this email or contact support@frawstfevergames.ca
        </p>
      </div>
    `,
  });
}

/** Send a contact-form message to the admin inbox. */
export async function sendContactToAdmin(
  adminEmail: string,
  senderEmail: string,
  title: string,
  content: string
) {
  const resend = getResend();
  const safeTitle = escapeHtml(title);
  const safeContent = escapeHtml(content).replace(/\n/g, "<br>");
  const safeSender = escapeHtml(senderEmail);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    replyTo: senderEmail,
    subject: `[Contact] ${title}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 20px; color: #1a1a2e; margin: 0;">Frawst Fever Games — New Contact Message</h1>
        </div>
        <div style="background: #f7f3ff; border-left: 4px solid #9b5cff; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 13px; color: #6b5b8f;">From</div>
          <div style="font-size: 15px; color: #1a0d2e; font-weight: 600;">${safeSender}</div>
          <div style="font-size: 13px; color: #6b5b8f; margin-top: 10px;">Subject</div>
          <div style="font-size: 16px; color: #1a0d2e; font-weight: 600;">${safeTitle}</div>
        </div>
        <div style="font-size: 15px; color: #333; line-height: 1.6; padding: 16px 20px; background: #ffffff; border: 1px solid #eee; border-radius: 8px;">
          ${safeContent}
        </div>
        <p style="font-size: 13px; color: #999; margin-top: 24px;">
          Reply directly to this email to respond to ${safeSender}.
        </p>
      </div>
    `,
  });
}

/** Send a confirmation copy back to the person who submitted the form. */
export async function sendContactConfirmation(
  senderEmail: string,
  title: string,
  content: string
) {
  const resend = getResend();
  const safeTitle = escapeHtml(title);
  const safeContent = escapeHtml(content).replace(/\n/g, "<br>");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: senderEmail,
    subject: `We received your message — ${title}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">Frawst Fever Games</h1>
        </div>
        <p style="font-size: 16px; color: #333;">
          Thanks for reaching out! We received your message and will get back to you as soon as possible.
        </p>
        <div style="background: #f7f3ff; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <div style="font-size: 13px; color: #6b5b8f; margin-bottom: 6px;">Your message</div>
          <div style="font-size: 16px; font-weight: 600; color: #1a0d2e; margin-bottom: 12px;">${safeTitle}</div>
          <div style="font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${safeContent}</div>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated confirmation. Please do not reply to this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your password — Frawst Fever Games",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">Frawst Fever Games</h1>
        </div>
        <p style="font-size: 16px; color: #333;">Hey ${name},</p>
        <p style="font-size: 16px; color: #333;">
          We received a request to reset your password. Click the button below to choose a new one:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background: #9b5cff; color: #fff; padding: 14px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:
        </p>
        <p style="font-size: 13px; color: #9b5cff; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 14px; color: #666;">This link expires in <strong>1 hour</strong>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, name: string, code: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${code} — Your verification code`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">Frawst Fever Games</h1>
        </div>
        <p style="font-size: 16px; color: #333;">Hey ${name},</p>
        <p style="font-size: 16px; color: #333;">
          Thanks for signing up! Enter this verification code to confirm your email:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background: #f5f0ff; border: 2px solid #9b5cff;
                      border-radius: 12px; padding: 20px 40px; letter-spacing: 8px;
                      font-size: 36px; font-weight: 700; color: #9b5cff; font-family: monospace;">
            ${code}
          </div>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">
          This code expires in <strong>15 minutes</strong>.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
