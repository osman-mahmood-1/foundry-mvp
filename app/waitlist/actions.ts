'use server'

import { createClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateUID(memberNumber: number): string {
  const s1 = Math.random().toString(36).substring(2, 5).toUpperCase()
  const s2 = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `TF-${String(memberNumber).padStart(3, '0')}-${s1}-${s2}`
}

export async function joinWaitlist(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string

  if (!name || !email) return { error: 'Name and email are required' }

  const supabase = await createClient()
  const tempUID = generateUID(0)

  const { data, error } = await supabase
    .from('waitlist')
    .insert({ name, email, unique_id: tempUID })
    .select('member_number, unique_id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'This email is already on the waitlist' }
    return { error: 'Something went wrong. Please try again.' }
  }

  const memberNumber = data.member_number
  const finalUID = generateUID(memberNumber)

  await supabase
    .from('waitlist')
    .update({ unique_id: finalUID })
    .eq('member_number', memberNumber)

  await resend.emails.send({
    from: 'TaxFoundry <hello@taxfoundry.co.uk>',
    to: email,
    subject: `You're founding member #${String(memberNumber).padStart(3, '0')}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#08080f;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center"><table width="100%" style="max-width:480px;">
<tr><td style="padding-bottom:24px;text-align:center;">
<p style="margin:0;font-size:10px;letter-spacing:0.2em;color:rgba(255,255,255,0.3);text-transform:uppercase;">Tax · Foundry</p>
</td></tr>
<tr><td style="background:rgba(12,8,18,0.98);border:1px solid rgba(194,232,226,0.25);border-radius:24px;padding:40px 36px;">
<p style="margin:0 0 8px;font-size:10px;letter-spacing:0.2em;color:rgba(194,232,226,0.6);text-transform:uppercase;">Founding Member Passport</p>
<h1 style="margin:0 0 28px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;">Welcome to the Foundry, ${name.split(' ')[0]}.</h1>
<table width="100%" style="margin-bottom:28px;" cellpadding="0" cellspacing="0">
<tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
<p style="margin:0;font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.3);text-transform:uppercase;">Member</p>
<p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#c2e8e2;font-family:monospace;">#${String(memberNumber).padStart(3, '0')}</p>
</td></tr>
<tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
<p style="margin:0;font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.3);text-transform:uppercase;">Name</p>
<p style="margin:4px 0 0;font-size:15px;color:#ffffff;">${name}</p>
</td></tr>
<tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
<p style="margin:0;font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.3);text-transform:uppercase;">Unique ID</p>
<p style="margin:4px 0 0;font-size:13px;color:#7bbdcc;font-family:monospace;letter-spacing:0.08em;">${finalUID}</p>
</td></tr>
<tr><td style="padding:12px 0;">
<p style="margin:0;font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.3);text-transform:uppercase;">Status</p>
<p style="margin:4px 0 0;font-size:15px;color:#ffffff;">Valid · Lifetime</p>
</td></tr>
</table>
<table width="100%" style="background:rgba(255,255,255,0.04);border-radius:16px;padding:20px;margin-bottom:28px;" cellpadding="0" cellspacing="0">
<tr><td style="padding-bottom:14px;"><p style="margin:0;font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.3);text-transform:uppercase;">What this gets you</p></td></tr>
<tr><td style="padding:5px 0;"><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.65);">✦ <strong style="color:#ffffff;">Price locked forever</strong> — never goes up</p></td></tr>
<tr><td style="padding:5px 0;"><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.65);">✦ <strong style="color:#ffffff;">First through the door</strong> — before public launch</p></td></tr>
<tr><td style="padding:5px 0;"><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.65);">✦ <strong style="color:#ffffff;">Founding Member badge</strong> — on your account, always</p></td></tr>
</table>
<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.7;">We'll be in touch before launch. Share your passport — every person you bring in makes the founding community stronger.</p>
</td></tr>
<tr><td style="padding-top:24px;text-align:center;">
<p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">TaxFoundry · taxfoundry.co.uk</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
    text: `Welcome to TaxFoundry, ${name.split(' ')[0]}.\n\nYou're founding member #${String(memberNumber).padStart(3, '0')}.\nUnique ID: ${finalUID}\n\nPrice locked forever. First through the door. Founding Member badge.\n\ntaxfoundry.co.uk`,
  })

  return { success: true, memberNumber, uniqueId: finalUID, name }
}

export async function getMemberCount() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
  return count ?? 0
}
