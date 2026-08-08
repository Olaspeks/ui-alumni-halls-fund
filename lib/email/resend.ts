import "server-only";
import { Resend } from "resend";
import { isResendConfigured } from "@/lib/config";
import { renderReceiptEmailHtml, renderReceiptEmailText, type ReceiptEmailData } from "./receiptTemplate";

/**
 * Sends the donation receipt email. If Resend isn't configured, this
 * degrades gracefully per the brief: the donation still completes and
 * the in-app receipt still works — we just log a clear note instead of
 * emailing, rather than failing the request.
 */
export async function sendReceiptEmail(
  to: string,
  data: ReceiptEmailData,
): Promise<{ sent: boolean; mocked: boolean; error?: string }> {
  if (!isResendConfigured) {
    console.log(
      `[mock email] Would send receipt for ${data.reference} to ${to}. ` +
        `Set RESEND_API_KEY to send real emails. Receipt: ${data.receiptUrl}`,
    );
    return { sent: false, mocked: true };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RECEIPT_FROM_EMAIL || "UI Alumni Halls Fund <receipts@example.org>";

    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Your receipt — ${data.hallName} donation`,
      html: renderReceiptEmailHtml(data),
      text: renderReceiptEmailText(data),
    });

    if (error) {
      console.error("[resend] send failed:", error);
      return { sent: false, mocked: false, error: error.message };
    }

    return { sent: true, mocked: false };
  } catch (err) {
    console.error("[resend] send threw:", err);
    return { sent: false, mocked: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}
