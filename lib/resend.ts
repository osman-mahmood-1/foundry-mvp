// lib/resend.ts
// All email sending goes through this file.
// Swap Resend for another provider by changing this file only.

import { Resend } from 'resend'

const FROM    = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://taxfoundry.co.uk'

// Initialised lazily inside each function so the module can be imported
// without RESEND_API_KEY being present (e.g. local dev without email configured).
function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

// ─── Welcome / onboarding email ──────────────────────────
export async function sendWelcomeEmail({
  to,
  firstName,
  tradeLabel,
}: {
  to: string
  firstName: string
  tradeLabel?: string
}) {
  const trade = tradeLabel ?? 'your business'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Foundry</title>
</head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FA;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;" align="center">
              <p style="margin:0;font-size:13px;letter-spacing:0.15em;color:#94A3B8;text-transform:uppercase;font-family:'Courier New',monospace;">
                FOUNDRY
              </p>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(5,28,44,0.08);">

              <!-- Teal accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#00D4AA,#00F5C4);"></td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 48px 40px;">

                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="margin:0;font-size:12px;color:#94A3B8;letter-spacing:0.12em;text-transform:uppercase;font-family:'Courier New',monospace;">
                      Welcome
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:24px;">
                    <h1 style="margin:0;font-size:36px;font-weight:400;color:#051C2C;line-height:1.15;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">
                      Your finances,<br><em style="font-style:italic;color:#475569;">accelerated.</em>
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
                      ${firstName}, your Foundry portal is ready.
                    </p>
                    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
                      You're joining thousands of people who've stopped dreading their tax return and started treating their finances like the serious part of their business it actually is.
                    </p>
                    <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
                      From today, every pound that flows through ${trade} has a place — logged, categorised, and accounted for. What's yours to spend is clearly yours. What belongs to HMRC is already set aside.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding-bottom:40px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#051C2C;border-radius:100px;padding:14px 32px;">
                          <a href="${APP_URL}/portal" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:-0.01em;">
                            Enter your portal →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="height:1px;background:rgba(5,28,44,0.07);"></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Three pillars -->
                <tr>
                  <td style="padding-bottom:40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="padding-right:16px;vertical-align:top;">
                          <p style="margin:0 0 6px;font-size:11px;color:#00856A;letter-spacing:0.1em;text-transform:uppercase;font-family:'Courier New',monospace;">
                            Log
                          </p>
                          <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                            Income and expenses in seconds. No spreadsheets.
                          </p>
                        </td>
                        <td width="33%" style="padding-right:16px;vertical-align:top;">
                          <p style="margin:0 0 6px;font-size:11px;color:#00856A;letter-spacing:0.1em;text-transform:uppercase;font-family:'Courier New',monospace;">
                            Upload
                          </p>
                          <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                            Documents stored securely. Your accountant reviews them.
                          </p>
                        </td>
                        <td width="33%" style="vertical-align:top;">
                          <p style="margin:0 0 6px;font-size:11px;color:#00856A;letter-spacing:0.1em;text-transform:uppercase;font-family:'Courier New',monospace;">
                            Ask
                          </p>
                          <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                            Tax questions answered. Grounded in HMRC guidance.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer note -->
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;font-family:'Courier New',monospace;letter-spacing:0.02em;">
                      Your portal is on the Foundation plan — free, always.<br>
                      When you're ready for your accountant, we're here.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;" align="center">
              <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;letter-spacing:0.1em;font-family:'Courier New',monospace;text-transform:uppercase;">
                Foundry · Your finances, accelerated.
              </p>
              <p style="margin:0;font-size:11px;color:#CBD5E1;">
                You're receiving this because you created a Foundry account.<br>
                <a href="${APP_URL}/portal/settings" style="color:#94A3B8;">Manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `

  return getResend().emails.send({
    from: `Foundry <${FROM}>`,
    to,
    subject: `${firstName}, your portal is ready.`,
    html,
  })
}

// ─── Magic link / sign in email ──────────────────────────
// Note: Supabase sends magic links automatically.
// This is for any custom auth emails we want to send ourselves.

// ─── Document ready notification ─────────────────────────
export async function sendDocumentReadyEmail({
  to,
  firstName,
  documentName,
}: {
  to: string
  firstName: string
  documentName: string
}) {
  return getResend().emails.send({
    from: `Foundry <${FROM}>`,
    to,
    subject: `Your document is ready — ${documentName}`,
    html: `
      <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:48px 20px;">
        <p style="font-size:13px;color:#94A3B8;letter-spacing:0.12em;text-transform:uppercase;font-family:'Courier New',monospace;margin:0 0 24px;">FOUNDRY</p>
        <h2 style="font-size:24px;font-weight:400;color:#051C2C;font-family:Georgia,serif;margin:0 0 16px;">${firstName}, a document is ready for you.</h2>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">Your accountant has uploaded <strong>${documentName}</strong> to your portal.</p>
        <a href="${APP_URL}/portal/documents" style="display:inline-block;background:#051C2C;color:white;padding:12px 28px;border-radius:100px;text-decoration:none;font-size:13px;">View document →</a>
      </div>
    `,
  })
}

// ─── New message notification ─────────────────────────────
export async function sendMessageNotificationEmail({
  to,
  firstName,
  preview,
}: {
  to: string
  firstName: string
  preview: string
}) {
  return getResend().emails.send({
    from: `Foundry <${FROM}>`,
    to,
    subject: `New message from your accountant`,
    html: `
      <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:48px 20px;">
        <p style="font-size:13px;color:#94A3B8;letter-spacing:0.12em;text-transform:uppercase;font-family:'Courier New',monospace;margin:0 0 24px;">FOUNDRY</p>
        <h2 style="font-size:24px;font-weight:400;color:#051C2C;font-family:Georgia,serif;margin:0 0 16px;">Your accountant sent you a message.</h2>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 8px;">${firstName},</p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;padding:16px;background:#F8FAFC;border-left:3px solid #00D4AA;border-radius:0 8px 8px 0;">${preview}</p>
        <a href="${APP_URL}/portal/messages" style="display:inline-block;background:#051C2C;color:white;padding:12px 28px;border-radius:100px;text-decoration:none;font-size:13px;">Reply →</a>
      </div>
    `,
  })
}

// ─── Invite email ─────────────────────────────────────────
export async function sendInviteEmail({
  to,
  role,
  inviteUrl,
  invitedByEmail,
}: {
  to:             string
  role:           'accountant' | 'platform_editor'
  inviteUrl:      string
  invitedByEmail: string
}) {
  const roleLabel = role === 'platform_editor' ? 'Platform Editor' : 'Accountant'

  return getResend().emails.send({
    from:    `Foundry <${FROM}>`,
    to,
    subject: `You've been invited to Tax Foundry as a ${roleLabel}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to Foundry</title>
</head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FA;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;" align="center">
              <p style="margin:0;font-size:13px;letter-spacing:0.15em;color:#94A3B8;text-transform:uppercase;font-family:'Courier New',monospace;">
                FOUNDRY
              </p>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(5,28,44,0.08);">

              <!-- Accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#1d4ed8,#3b82f6);"></td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 48px 40px;">

                <!-- Role badge -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <span style="display:inline-block;background:#EFF6FF;border-radius:20px;padding:4px 12px;font-size:11px;color:#1d4ed8;letter-spacing:0.08em;text-transform:uppercase;font-family:'Courier New',monospace;">
                      ${roleLabel}
                    </span>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <h1 style="margin:0;font-size:28px;font-weight:400;color:#051C2C;line-height:1.25;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">
                      You're invited to<br><em style="font-style:italic;color:#475569;">Tax Foundry.</em>
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
                      ${invitedByEmail} has invited you to join Tax Foundry as a <strong>${roleLabel}</strong>.
                    </p>
                    <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
                      Click the button below to accept your invitation and set up your account. This link expires in 48 hours and can only be used once.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1d4ed8;border-radius:100px;padding:14px 32px;">
                          <a href="${inviteUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:-0.01em;">
                            Accept invitation →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                      If the button doesn't work, copy and paste this URL into your browser:<br>
                      <a href="${inviteUrl}" style="color:#1d4ed8;word-break:break-all;">${inviteUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="height:1px;background:rgba(5,28,44,0.07);"></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer note -->
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;font-family:'Courier New',monospace;letter-spacing:0.02em;">
                      If you weren't expecting this invitation, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;" align="center">
              <p style="margin:0;font-size:11px;color:#94A3B8;letter-spacing:0.1em;font-family:'Courier New',monospace;text-transform:uppercase;">
                Foundry · Tax Foundry Ltd
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  })
}
