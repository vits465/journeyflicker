import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Initialize Resend with the API key from environment variables
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Initialize Nodemailer SMTP Transporter if standard SMTP credentials are provided
let smtpTransporter = null;
if (!resend && process.env.SMTP_HOST) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log("[Email] SMTP transporter initialized fallback for:", process.env.SMTP_HOST);
}

export async function sendInquiryNotification(contact) {
  const adminEmail = process.env.ADMIN_EMAIL || "tushar@journeyflicker.com,pashv@journeyflicker.com";
  const fromEmail = process.env.SYSTEM_EMAIL || "system@journeyflicker.com";

  const clientSubject = 'Your Expedition Inquiry - JourneyFlicker';
  const clientHtml = `
    <div style="font-family: 'Georgia', serif; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
      <h2 style="font-weight: 300; font-style: italic; color: #C8A84B;">JourneyFlicker</h2>
      <p>Dear ${contact.name},</p>
      <p>The JourneyFlicker Curation Team has received your request regarding <strong>${contact.type}</strong>.</p>
      <p>We review all inquiries carefully. A dedicated curator will be in touch within 24 hours to begin aligning your preferences.</p>
      <br/>
      <p style="font-size: 0.9em; color: #666;">Warm regards,<br/>The Curator Board</p>
    </div>
  `;

  const adminSubject = `New Lead: ${contact.type} from ${contact.name}`;
  const adminHtml = `
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
  `;

  // 1. Attempt sending via Resend
  if (resend) {
    try {
      await resend.emails.send({
        from: `JourneyFlicker <${fromEmail}>`,
        to: contact.email,
        subject: clientSubject,
        html: clientHtml
      });

      await resend.emails.send({
        from: `JourneyFlicker System <${fromEmail}>`,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml
      });

      console.log("[Email] Notifications sent successfully via Resend for lead:", contact.email);
      return;
    } catch (error) {
      console.error("[Email] Failed to send notifications via Resend:", error);
    }
  }

  // 2. Attempt sending via standard SMTP
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: `"JourneyFlicker" <${fromEmail}>`,
        to: contact.email,
        subject: clientSubject,
        html: clientHtml
      });

      await smtpTransporter.sendMail({
        from: `"JourneyFlicker System" <${fromEmail}>`,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml
      });

      console.log("[Email] Notifications sent successfully via SMTP for lead:", contact.email);
      return;
    } catch (error) {
      console.error("[Email] Failed to send notifications via SMTP:", error);
    }
  }

  // 3. Fallback to mock log
  console.log("[Email] ⚠️ No active email service configured (Missing RESEND_API_KEY or SMTP_HOST). Mocking send for:", contact.email);
}
