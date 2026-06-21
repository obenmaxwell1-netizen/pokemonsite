import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'support@pokeemoncenter.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, passcode } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }

    const emailHtml = `
      <div style="font-family:-apple-system,Arial,sans-serif;max-width:500px;margin:0 auto;background:#ffffff;color:#000000;border:1px solid #e5e5e5;padding:40px;">
        <h1 style="margin:0 0 20px;font-size:22px;border-bottom:2px solid #000000;padding-bottom:15px;">VIP Vault Access Granted</h1>
        <p style="color:#555555;font-size:15px;line-height:1.6;">Congratulations! Your request for VIP Vault access has been approved.</p>
        <div style="background:#f9f9f9;border-left:4px solid #000000;padding:20px;margin:25px 0;">
          <div style="font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:700;">Your Secret Passcode</div>
          <div style="font-size:28px;font-weight:700;color:#000000;letter-spacing:4px;">${passcode}</div>
        </div>
        <p style="color:#555555;font-size:14px;line-height:1.6;">Visit the VIP Vault page and enter this passcode to access our exclusive inventory.</p>
        <p style="color:#999999;font-size:12px;margin-top:30px;border-top:1px solid #eeeeee;padding-top:15px;">Please do not share this passcode with anyone. It is strictly for your personal use.</p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Pokemon Center VIP <${FROM_EMAIL}>`,
        to: [email],
        subject: 'Your VIP Vault Access Has Been Granted',
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Resend API error:', text);
      throw new Error('Failed to send email via Resend: ' + text);
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('send-vip-email error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
