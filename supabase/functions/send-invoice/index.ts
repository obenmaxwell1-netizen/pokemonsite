import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// TODO(security): CORS is open (*) here because this function is invoked by
// the Supabase JS client (which handles its own auth via apikey header).
// Restrict Access-Control-Allow-Origin to your domain once a CDN is in place.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── Security: only allow POST ─────────────────────────────────────
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── Load secrets from environment ONLY — no hardcoded fallbacks ──
    // Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL')    ?? 'support@pokeemoncenter.com';
    const FROM_EMAIL     = Deno.env.get('FROM_EMAIL')     ?? 'support@pokeemoncenter.com';

    if (!RESEND_API_KEY) {
      console.error('CRITICAL: RESEND_API_KEY secret is not set in Supabase Edge Function secrets.');
      return new Response(JSON.stringify({ error: 'Email service not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await req.json();
    const { email, name, orderId, orderDate, itemList, shippingLine, total, payment, notes, origin } = data;

    // ── Validate required fields ──────────────────────────────────────
    if (!email || !name || !orderId || !total) {
      return new Response(JSON.stringify({ error: 'Missing required order fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeOrigin  = (origin || 'https://pokeemoncenter.com').replace(/\/$/, '');
    const invoiceUrl  = `${safeOrigin}/invoice.html?id=${encodeURIComponent(orderId)}`;
    const trackingUrl = `${safeOrigin}/track.html?id=${encodeURIComponent(orderId)}`;
    const shortId     = (orderId || '00000000').substring(0, 8).toUpperCase();
    const year        = new Date().getFullYear();

    // ── Parse itemList string into HTML table rows ────────────────────
    const itemRows = (itemList || '').split('\n').filter((l: string) => l.trim()).map((line: string) => {
      const match = line.match(/^-\s+(.+?)\s{2,}x(\d+)\s{2,}=\s+\$(.+)$/);
      if (match) {
        return `
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #f0e8c8;font-size:14px;color:#1f2937;line-height:1.4;">${match[1]}</td>
            <td style="padding:14px 18px;border-bottom:1px solid #f0e8c8;font-size:14px;color:#6b7280;text-align:center;font-weight:600;">${match[2]}</td>
            <td style="padding:14px 18px;border-bottom:1px solid #f0e8c8;font-size:15px;color:#1f2937;text-align:right;font-weight:800;">$${match[3]}</td>
          </tr>`;
      }
      return `<tr><td colspan="3" style="padding:14px 18px;font-size:14px;color:#6b7280;">${line}</td></tr>`;
    }).join('');

    // ════════════════════════════════════════════════════════════════
    //  CUSTOMER INVOICE EMAIL  — sent to the customer's own inbox
    // ════════════════════════════════════════════════════════════════
    const customerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Invoice #${shortId} — Pokeemon Center</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede4;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede4;padding:48px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 60px rgba(0,0,0,0.13);max-width:640px;width:100%;">

        <!-- ══ HEADER ══ -->
        <tr>
          <td style="background:linear-gradient(135deg,#0c1220 0%,#1a2540 55%,#0f172a 100%);padding:48px 56px 36px;text-align:center;">
            <div style="color:#D4AF37;font-size:36px;font-weight:900;letter-spacing:-1.5px;margin-bottom:2px;">Pokeemon Center</div>
            <div style="color:#64748b;font-size:12px;letter-spacing:3px;font-weight:600;text-transform:uppercase;margin-bottom:28px;">Official Order Invoice</div>
            <div style="display:inline-block;background:rgba(212,175,55,0.12);border:1.5px solid rgba(212,175,55,0.5);border-radius:12px;padding:12px 36px;">
              <span style="color:#fbbf24;font-size:22px;font-weight:900;letter-spacing:3px;">INVOICE #${shortId}</span>
            </div>
          </td>
        </tr>

        <!-- ══ ORDER CONFIRMED BADGE ══ -->
        <tr>
          <td style="background:linear-gradient(90deg,#f0fdf4,#dcfce7);border-bottom:2px solid #86efac;padding:16px 56px;text-align:center;">
            <span style="color:#15803d;font-size:14px;font-weight:800;letter-spacing:0.5px;">✅ &nbsp;Order Confirmed — Thank you for your purchase!</span>
          </td>
        </tr>

        <!-- ══ GREETING ══ -->
        <tr>
          <td style="padding:40px 56px 0;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">Hi ${name},</p>
            <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">Thank you for shopping with Pokeemon Center! Your order has been received and is being processed. Below is your official invoice. Please keep this for your records.</p>
          </td>
        </tr>

        <!-- ══ ORDER META CARDS ══ -->
        <tr>
          <td style="padding:28px 56px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#fafbfc;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px 22px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:6px;">📅 Order Date</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${orderDate}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#fafbfc;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px 22px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:6px;">💳 Payment Method</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${payment}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 56px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#fafbfc;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px 22px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:6px;">📦 Order Reference</div>
                    <div style="font-family:monospace;font-size:13px;font-weight:700;color:#92400e;word-break:break-all;">${shortId}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#fafbfc;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px 22px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:6px;">📧 Billed To</div>
                    <div style="font-size:13px;font-weight:700;color:#0f172a;word-break:break-all;">${email}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ ITEMS TABLE ══ -->
        <tr>
          <td style="padding:32px 56px 0;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">🛍️ Items Ordered</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e8e0c0;border-radius:14px;overflow:hidden;">
              <thead>
                <tr style="background:linear-gradient(135deg,#0f172a,#1e293b);">
                  <th style="padding:14px 18px;text-align:left;font-size:11px;font-weight:700;color:#D4AF37;text-transform:uppercase;letter-spacing:1.5px;">Product</th>
                  <th style="padding:14px 18px;text-align:center;font-size:11px;font-weight:700;color:#D4AF37;text-transform:uppercase;letter-spacing:1.5px;">Qty</th>
                  <th style="padding:14px 18px;text-align:right;font-size:11px;font-weight:700;color:#D4AF37;text-transform:uppercase;letter-spacing:1.5px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows || '<tr><td colspan="3" style="padding:20px;text-align:center;color:#94a3b8;">No items listed</td></tr>'}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- ══ TOTAL ══ -->
        <tr>
          <td style="padding:20px 56px 0;">
            <div style="background:linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.05));border:1.5px solid rgba(212,175,55,0.4);border-radius:16px;padding:24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;"><span style="font-size:14px;color:#64748b;">Subtotal</span><span style="float:right;font-size:14px;color:#1f2937;font-weight:600;">$${total}</span></td>
                </tr>
                <tr>
                  <td style="padding:5px 0;"><span style="font-size:14px;color:#64748b;">Shipping</span><span style="float:right;font-size:14px;color:#16a34a;font-weight:700;">Calculated &amp; confirmed separately</span></td>
                </tr>
                <tr>
                  <td style="padding-top:16px;border-top:2px solid rgba(212,175,55,0.3);">
                    <span style="font-size:20px;font-weight:900;color:#0f172a;">TOTAL</span>
                    <span style="float:right;font-size:30px;font-weight:900;color:#D4AF37;">$${total}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- ══ PAYMENT INSTRUCTIONS ══ -->
        <tr>
          <td style="padding:20px 56px 0;">
            <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px;padding:22px 26px;">
              <div style="font-size:10px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">💳 Next Step — Payment Instructions</div>
              <p style="margin:0;font-size:14px;color:#92400e;line-height:1.7;">You selected <strong>${payment}</strong> as your payment method. Our team will send you the full payment details and account information within <strong>24 hours</strong>. Please keep your order reference <strong>#${shortId}</strong> handy.</p>
            </div>
          </td>
        </tr>

        <!-- ══ SHIPPING ADDRESS ══ -->
        <tr>
          <td style="padding:16px 56px 0;">
            <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;padding:20px 24px;">
              <div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">📦 Ship To</div>
              <div style="font-size:15px;color:#1f2937;font-weight:600;line-height:1.6;">${shippingLine}</div>
            </div>
          </td>
        </tr>

        <!-- ══ TRACKING ID ══ -->
        <tr>
          <td style="padding:16px 56px 0;">
            <div style="background:#fffbeb;border:1.5px dashed #fbbf24;border-radius:14px;padding:20px 24px;">
              <div style="font-size:10px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">🔍 Your Tracking ID</div>
              <div style="font-family:'Courier New',monospace;font-size:13px;color:#92400e;background:#fff;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;word-break:break-all;margin-bottom:12px;">${orderId}</div>
              <p style="margin:0;font-size:12px;color:#b45309;">Use this ID on our <a href="${trackingUrl}" style="color:#d97706;font-weight:700;">order tracking page</a> to check your delivery status at any time.</p>
            </div>
          </td>
        </tr>

        ${notes ? `
        <!-- ══ NOTES ══ -->
        <tr>
          <td style="padding:16px 56px 0;">
            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;">
              <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">📝 Your Notes</div>
              <div style="font-size:14px;color:#374151;line-height:1.7;">${notes}</div>
            </div>
          </td>
        </tr>` : ''}

        <!-- ══ CTA BUTTONS ══ -->
        <tr>
          <td style="padding:32px 56px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding-right:12px;">
                  <a href="${trackingUrl}" style="display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#D4AF37,#b8860b);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:800;font-size:15px;letter-spacing:0.3px;">
                    🔍 Track My Order
                  </a>
                </td>
                <td>
                  <a href="${invoiceUrl}" style="display:inline-block;padding:16px 32px;background:#ffffff;color:#374151;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;border:2px solid #e2e8f0;letter-spacing:0.3px;">
                    📄 View Invoice
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ CONTACT / HELP ══ -->
        <tr>
          <td style="padding:0 56px 32px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.7;">Questions about your order? Contact us at<br/><a href="mailto:support@pokeemoncenter.com" style="color:#D4AF37;font-weight:700;text-decoration:none;">support@pokeemoncenter.com</a></p>
          </td>
        </tr>

        <!-- ══ FOOTER ══ -->
        <tr>
          <td style="background:linear-gradient(135deg,#0c1220,#1a2540);padding:32px 56px;border-radius:0 0 24px 24px;text-align:center;">
            <div style="color:#D4AF37;font-size:20px;font-weight:900;letter-spacing:-0.5px;margin-bottom:8px;">Pokeemon Center</div>
            <div style="color:#475569;font-size:12px;line-height:1.8;">
              Premier International Pokémon &amp; One Piece TCG Cards<br/>
              <a href="https://pokeemoncenter.com" style="color:#64748b;text-decoration:none;">pokeemoncenter.com</a>
            </div>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);color:#334155;font-size:11px;">
              © ${year} Pokeemon Center. All rights reserved. · This is an automated invoice.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ════════════════════════════════════════════════════════════════
    //  ADMIN NOTIFICATION EMAIL  — sent to support@pokeemoncenter.com
    // ════════════════════════════════════════════════════════════════
    const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Order #${shortId} — Pokeemon Center Admin</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1e8;padding:40px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);max-width:640px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#1a3558 100%);padding:40px 48px;text-align:center;">
            <div style="color:#D4AF37;font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:4px;">Pokeemon Center</div>
            <div style="color:#94a3b8;font-size:11px;letter-spacing:2px;margin-bottom:20px;text-transform:uppercase;">Store Admin Notification</div>
            <div style="display:inline-block;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);border-radius:8px;padding:10px 28px;">
              <span style="color:#fbbf24;font-size:16px;font-weight:700;letter-spacing:2px;">🛒 NEW ORDER #${shortId}</span>
            </div>
          </td>
        </tr>

        <!-- ORDER CONFIRMED -->
        <tr>
          <td style="background:#f0fdf4;border-bottom:2px solid #86efac;padding:14px 48px;text-align:center;">
            <span style="color:#16a34a;font-size:13px;font-weight:700;">✅ Order Confirmed — Action Required: Confirm payment details with customer</span>
          </td>
        </tr>

        <!-- CUSTOMER DETAILS -->
        <tr>
          <td style="padding:32px 48px 0;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">👤 Customer Details</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;font-weight:700;">Name</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${name}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;font-weight:700;">Email</div>
                    <div style="font-size:13px;font-weight:700;color:#0f172a;word-break:break-all;"><a href="mailto:${email}" style="color:#d97706;text-decoration:none;">${email}</a></div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ORDER META -->
        <tr>
          <td style="padding:12px 48px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;font-weight:700;">📅 Order Date</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${orderDate}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;font-weight:700;">💳 Payment</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${payment}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ITEMS TABLE -->
        <tr>
          <td style="padding:24px 48px 0;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">🛍️ Items Ordered</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Product</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">No items listed</td></tr>'}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- TOTAL -->
        <tr>
          <td style="padding:20px 48px;">
            <div style="background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.04));border:1px solid rgba(212,175,55,0.35);border-radius:12px;padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;"><span style="font-size:14px;color:#64748b;">Subtotal</span><span style="float:right;font-size:14px;color:#1f2937;font-weight:600;">$${total}</span></td>
                </tr>
                <tr>
                  <td style="padding-top:12px;border-top:2px solid rgba(212,175,55,0.25);">
                    <span style="font-size:18px;font-weight:800;color:#0f172a;">TOTAL</span>
                    <span style="float:right;font-size:26px;font-weight:800;color:#D4AF37;">$${total}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- SHIPPING -->
        <tr>
          <td style="padding:0 48px 16px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 22px;">
              <div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">📦 Ship To</div>
              <div style="font-size:15px;color:#1f2937;font-weight:600;">${shippingLine}</div>
            </div>
          </td>
        </tr>

        <!-- TRACKING ID -->
        <tr>
          <td style="padding:0 48px 16px;">
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 22px;">
              <div style="font-size:10px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">🔍 Full Tracking ID</div>
              <div style="font-family:monospace;font-size:12px;color:#92400e;background:#fff;border:1px dashed #fbbf24;border-radius:6px;padding:10px 14px;word-break:break-all;">${orderId}</div>
            </div>
          </td>
        </tr>

        ${notes ? `
        <!-- NOTES -->
        <tr>
          <td style="padding:0 48px 16px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 22px;">
              <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">📝 Customer Notes</div>
              <div style="font-size:14px;color:#374151;line-height:1.7;">${notes}</div>
            </div>
          </td>
        </tr>` : ''}

        <!-- VIEW INVOICE BUTTON -->
        <tr>
          <td style="padding:0 48px 32px;text-align:center;">
            <a href="${invoiceUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#D4AF37,#b8860b);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:800;font-size:15px;">
              📄 View Full Invoice
            </a>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:28px 48px;border-radius:0 0 20px 20px;text-align:center;">
            <div style="color:#D4AF37;font-size:18px;font-weight:800;margin-bottom:6px;">Pokeemon Center — Admin</div>
            <div style="color:#64748b;font-size:12px;line-height:1.7;">
              © ${year} Pokeemon Center · Internal Admin Notification<br/>
              <span style="color:#475569;">Customer: ${name} &lt;${email}&gt;</span>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ── Send email helper ─────────────────────────────────────────────
    const sendEmail = async (to: string, subject: string, html: string) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Pokeemon Center <${FROM_EMAIL}>`,
          to: to,
          subject: subject,
          html: html,
        }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        console.error(`Resend API Error (to: ${to}):`, responseText);
        throw new Error('Failed to send email: ' + responseText);
      }
      return JSON.parse(responseText);
    };

    // ── Send both emails ──────────────────────────────────────────────
    const results: { customer?: any; admin?: any; errors: string[] } = { errors: [] };

    // 1. Customer invoice
    try {
      results.customer = await sendEmail(
        email,
        `Your Pokeemon Center Invoice #${shortId} — $${total}`,
        customerHtml,
      );
      console.log('Customer invoice sent to:', email, '| ID:', results.customer?.id);
    } catch (err: any) {
      console.error('Failed to send customer invoice:', err.message);
      results.errors.push(`customer: ${err.message}`);
    }

    // 2. Admin notification to support@pokeemoncenter.com
    try {
      results.admin = await sendEmail(
        ADMIN_EMAIL,
        `🛒 New Order #${shortId} from ${name} — $${total}`,
        adminHtml,
      );
      console.log('Admin notification sent to:', ADMIN_EMAIL, '| ID:', results.admin?.id);
    } catch (err: any) {
      console.error('Failed to send admin notification:', err.message);
      results.errors.push(`admin: ${err.message}`);
    }

    const allFailed = !results.customer && !results.admin;
    if (allFailed) {
      return new Response(JSON.stringify({ error: 'All emails failed to send.', details: results.errors }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Emails dispatched. Customer: ${results.customer ? 'sent' : 'failed'}, Admin: ${results.admin ? 'sent' : 'failed'}`,
      customerEmailId: results.customer?.id ?? null,
      adminEmailId: results.admin?.id ?? null,
      errors: results.errors.length ? results.errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Unhandled error processing invoice request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
