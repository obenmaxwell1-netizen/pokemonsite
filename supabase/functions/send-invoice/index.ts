import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const { email, name, orderId, orderDate, itemList, shippingLine, total, payment, notes, origin } = data;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "re_SLiYyaJt_M6XvRLR8grHpaEiZRetStmgf";

    // ── IMPORTANT ────────────────────────────────────────────────────────────────
    // Until pokeemoncenter.com is verified on resend.com/domains, Resend only
    // allows sending to the account-owner's email (bioleanhw@gmail.com).
    // Once the domain is verified, change ADMIN_EMAIL to obenmaxwell1@gmail.com
    // and FROM_EMAIL to support@pokeemoncenter.com, then redeploy.
    // ─────────────────────────────────────────────────────────────────────────────
    const ADMIN_EMAIL  = Deno.env.get("ADMIN_EMAIL")  ?? "obenmaxwell1@gmail.com";
    const FROM_EMAIL   = Deno.env.get("FROM_EMAIL")   ?? "onboarding@resend.dev";

    const safeOrigin = (origin || 'https://pokeemoncenter.com').endsWith('/') ? (origin || 'https://pokeemoncenter.com') : `${origin || 'https://pokeemoncenter.com'}/`;
    const invoiceUrl = `${safeOrigin}invoice.html?id=${orderId}`;
    const shortId = (orderId || '00000000').substring(0, 8).toUpperCase();

    // Parse itemList string into HTML table rows
    const itemRows = (itemList || '').split('\n').filter((l: string) => l.trim()).map((line: string) => {
      const match = line.match(/^-\s+(.+?)\s{2,}x(\d+)\s{2,}=\s+\$(.+)$/);
      if (match) {
        return `
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #f0e8c8;font-size:14px;color:#1f2937;">${match[1]}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0e8c8;font-size:14px;color:#6b7280;text-align:center;">${match[2]}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0e8c8;font-size:14px;color:#1f2937;text-align:right;font-weight:700;">$${match[3]}</td>
          </tr>`;
      }
      return `<tr><td colspan="3" style="padding:12px 16px;font-size:14px;color:#6b7280;">${line}</td></tr>`;
    }).join('');

    // ─────────────────────────────────────────────────────────────
    // ADMIN EMAIL — Full Order Details + Customer Invoice Copy
    // This goes to the store owner's verified email (bioleanhw@gmail.com)
    // and includes all customer info + a note to forward to the customer.
    // ─────────────────────────────────────────────────────────────
    const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Order #${shortId} – Pokeemon Center</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1e8;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);max-width:620px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#1a3558 100%);padding:40px 48px;text-align:center;">
            <div style="color:#D4AF37;font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:4px;">Pokeemon Center</div>
            <div style="color:#94a3b8;font-size:12px;letter-spacing:1px;margin-bottom:20px;">Store Admin Notification</div>
            <div style="display:inline-block;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);border-radius:8px;padding:10px 28px;">
              <span style="color:#fbbf24;font-size:15px;font-weight:700;letter-spacing:2px;">🛒 NEW ORDER #${shortId}</span>
            </div>
          </td>
        </tr>

        <!-- DOMAIN WARNING BANNER -->
        <tr>
          <td style="padding:0;">
            <div style="background:#fffbeb;border-bottom:2px solid #f59e0b;padding:16px 32px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">⚠️ ACTION REQUIRED – Forward this invoice to the customer!</p>
              <p style="margin:6px 0 0;font-size:13px;color:#92400e;">Customer Email: <a href="mailto:${email}" style="color:#d97706;font-weight:700;">${email}</a></p>
              <p style="margin:6px 0 0;font-size:12px;color:#b45309;">To send invoices automatically, verify <strong>pokeemoncenter.com</strong> at <a href="https://resend.com/domains" style="color:#d97706;">resend.com/domains</a>, then redeploy the edge function.</p>
            </div>
          </td>
        </tr>

        <!-- ORDER CONFIRMED BADGE -->
        <tr>
          <td style="padding:0;">
            <div style="background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:14px 48px;text-align:center;">
              <span style="color:#16a34a;font-size:13px;font-weight:700;">✅ Order Confirmed — Processing!</span>
            </div>
          </td>
        </tr>

        <!-- CUSTOMER INFO -->
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
          <td style="padding:16px 48px 0;">
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
                  <td style="padding:4px 0;"><span style="font-size:14px;color:#64748b;">Shipping</span><span style="float:right;font-size:14px;color:#16a34a;font-weight:700;">Free</span></td>
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
          <td style="padding:0 48px 20px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 22px;">
              <div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">📦 Ship To</div>
              <div style="font-size:15px;color:#1f2937;font-weight:600;">${shippingLine}</div>
            </div>
          </td>
        </tr>

        <!-- TRACKING ID -->
        <tr>
          <td style="padding:0 48px 20px;">
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 22px;">
              <div style="font-size:10px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">🔍 Tracking ID</div>
              <div style="font-family:monospace;font-size:12px;color:#92400e;background:#fff;border:1px dashed #fbbf24;border-radius:6px;padding:10px 14px;word-break:break-all;">${orderId}</div>
            </div>
          </td>
        </tr>

        ${notes ? `
        <!-- NOTES -->
        <tr>
          <td style="padding:0 48px 20px;">
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
            <div style="color:#D4AF37;font-size:18px;font-weight:800;margin-bottom:6px;">Pokeemon Center</div>
            <div style="color:#64748b;font-size:12px;line-height:1.7;">
              © ${new Date().getFullYear()} Pokeemon Center · Admin Notification<br/>
              <span style="color:#475569;">Customer email: ${email}</span>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ─────────────────────────────────────────────────────────────
    // Send via Resend API
    // ─────────────────────────────────────────────────────────────
    const sendEmail = async (to: string, subject: string, html: string) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `Pokeemon Center <${FROM_EMAIL}>`,
          to: to,
          subject: subject,
          html: html
        })
      });
      const responseText = await response.text();
      if (!response.ok) {
        console.error("Resend API Error:", responseText);
        throw new Error("Failed to send email: " + responseText);
      }
      return JSON.parse(responseText);
    };

    // Send full order details to admin (works without domain verification)
    const result = await sendEmail(
      ADMIN_EMAIL,
      `🛒 New Order #${shortId} from ${name} — $${total} | Fwd to: ${email}`,
      adminHtml
    );

    console.log("Admin notification sent:", result);

    return new Response(JSON.stringify({ success: true, message: 'Order notification sent', id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
