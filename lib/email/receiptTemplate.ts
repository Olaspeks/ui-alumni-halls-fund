import { formatMoney, type Currency } from "@/lib/money";
import { siteUrl } from "@/lib/config";

export interface ReceiptEmailData {
  donorDisplayName: string; // real name even if publicly anonymous
  hallName: string;
  hallSlug: string;
  amount: number; // subunits
  currency: Currency;
  reference: string;
  createdAt: string; // ISO
  receiptUrl: string; // absolute URL
  isAnonymous: boolean;
}

const INDIGO = "#161C52";
const GOLD = "#C79A2B";

/** Shared institutional look for both the email and the in-app/print
 * receipt view — calm, document-like, not a throwaway confirmation
 * screen (per the brief). */
export function renderReceiptEmailHtml(data: ReceiptEmailData): string {
  const when = new Date(data.createdAt).toLocaleString("en-NG", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const amountFormatted = formatMoney(data.amount, data.currency);

  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#F4F5FC;font-family:Georgia,'Times New Roman',serif;color:#0A0C14;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E4E6F7;">
      <tr>
        <td style="padding:28px 32px;border-bottom:3px solid ${GOLD};background:${INDIGO};">
          <span style="color:#F8EFD6;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,sans-serif;">University of Ibadan</span>
          <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:normal;">Alumni Halls Fund — Donation Receipt</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="font-size:15px;line-height:1.6;">Dear ${escapeHtml(data.donorDisplayName)},</p>
          <p style="font-size:15px;line-height:1.6;">
            Thank you for your generous gift toward the renovation of
            <strong>${escapeHtml(data.hallName)}</strong>. Your support directly funds the
            restoration of a hall that shaped generations of UI students — including you.
          </p>

          <table role="presentation" width="100%" style="margin:24px 0;border-collapse:collapse;font-family:'Courier New',monospace;font-size:14px;">
            <tr><td style="padding:8px 0;border-bottom:1px solid #E4E6F7;color:#5B5F72;">Reference</td><td style="padding:8px 0;border-bottom:1px solid #E4E6F7;text-align:right;">${escapeHtml(data.reference)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #E4E6F7;color:#5B5F72;">Hall</td><td style="padding:8px 0;border-bottom:1px solid #E4E6F7;text-align:right;">${escapeHtml(data.hallName)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #E4E6F7;color:#5B5F72;">Amount</td><td style="padding:8px 0;border-bottom:1px solid #E4E6F7;text-align:right;font-weight:bold;">${amountFormatted}</td></tr>
            <tr><td style="padding:8px 0;color:#5B5F72;">Date</td><td style="padding:8px 0;text-align:right;">${when}</td></tr>
          </table>

          ${
            data.isAnonymous
              ? `<p style="font-size:13px;line-height:1.6;color:#5B5F72;">Your gift is recorded publicly as <strong>Anonymous</strong> — this receipt is for your records only.</p>`
              : ""
          }

          <div style="margin:28px 0;text-align:center;">
            <a href="${data.receiptUrl}" style="display:inline-block;padding:12px 28px;background:${GOLD};color:${INDIGO};text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">
              View / print your receipt
            </a>
          </div>

          <p style="font-size:13px;line-height:1.6;color:#5B5F72;">
            You can also see ${escapeHtml(data.hallName)}'s renovation progress at any time:
            <a href="${siteUrl}/#${data.hallSlug}" style="color:${INDIGO};">${siteUrl}/#${data.hallSlug}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;background:#F4F5FC;font-family:Arial,sans-serif;font-size:12px;color:#5B5F72;">
          UI Alumni Halls Fund · This is an automated receipt for a genuine donation.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderReceiptEmailText(data: ReceiptEmailData): string {
  const when = new Date(data.createdAt).toLocaleString("en-NG", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return [
    `Dear ${data.donorDisplayName},`,
    ``,
    `Thank you for your donation to ${data.hallName} — UI Alumni Halls Fund.`,
    ``,
    `Reference: ${data.reference}`,
    `Hall: ${data.hallName}`,
    `Amount: ${formatMoney(data.amount, data.currency)}`,
    `Date: ${when}`,
    ``,
    `View / print your receipt: ${data.receiptUrl}`,
  ].join("\n");
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
