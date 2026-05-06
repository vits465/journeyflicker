import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
// It will gracefully fall back to a mock function if the key is missing.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendInquiryNotification(contact) {
  if (!resend) {
    console.log("[Email] RESEND_API_KEY not set. Mocking email send for:", contact.email);
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "tushar@journeyflicker.com";
  const fromEmail = process.env.SYSTEM_EMAIL || "system@journeyflicker.com";

  try {
    // 1. Send confirmation to the client
    await resend.emails.send({
      from: `JourneyFlicker <${fromEmail}>`,
      to: contact.email,
      subject: 'Your Expedition Inquiry - JourneyFlicker',
      html: `
        <div style="font-family: 'Georgia', serif; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
          <h2 style="font-weight: 300; font-style: italic; color: #C8A84B;">JourneyFlicker</h2>
          <p>Dear ${contact.name},</p>
          <p>The JourneyFlicker Curation Team has received your request regarding <strong>${contact.type}</strong>.</p>
          <p>We review all inquiries carefully. A dedicated curator will be in touch within 24 hours to begin aligning your preferences.</p>
          <br/>
          <p style="font-size: 0.9em; color: #666;">Warm regards,<br/>The Curator Board</p>
        </div>
      `
    });

    // 2. Send notification to the Admin
    await resend.emails.send({
      from: `JourneyFlicker System <${fromEmail}>`,
      to: adminEmail,
      subject: `New Lead: ${contact.type} from ${contact.name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h3>New Contact Submission</h3>
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Type:</strong> ${contact.type}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 3px solid #C8A84B; padding-left: 10px; margin-left: 0;">
            ${contact.message || "No message provided."}
          </blockquote>
        </div>
      `
    });

    console.log("[Email] Notifications sent successfully for lead:", contact.email);
  } catch (error) {
    console.error("[Email] Failed to send notifications:", error);
  }
}
