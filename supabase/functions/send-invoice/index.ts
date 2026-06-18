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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "re_F9LM1idE_GeEtTYTLZXb6oM7Qk22QyzFA";
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "orders@xn--pokemoncenter-dhb.com";
    const STORE_EMAIL = Deno.env.get("STORE_EMAIL") ?? "obenmaxwell1@gmail.com";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const safeOrigin = origin.endsWith('/') ? origin : `${origin}/`;
    const invoiceUrl = `${safeOrigin}invoice.html?id=${orderId}`;
    const shortId = orderId.substring(0, 8).toUpperCase();

    // Parse itemList string into HTML table rows
    const itemRows = itemList.split('\n').filter((l: string) => l.trim()).map((line: string) => {
      const match = line.match(/^-\s+(.+?)\s{2,}x(\d+)\s{2,}=\s+\$(.+)$/);
      if (match) {
        return `
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1f2937;">${match[1]}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#6b7280;text-align:center;">${match[2]}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1f2937;text-align:right;font-weight:600;">$${match[3]}</td>
          </tr>`;
      }
      return `<tr><td colspan="3" style="padding:12px 16px;font-size:14px;color:#6b7280;">${line}</td></tr>`;
    }).join('');

    // ─────────────────────────────────────────────────────────────
    // CLIENT EMAIL – Premium Professional Invoice
    // ─────────────────────────────────────────────────────────────
    const customerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pokémon Center Invoice #${shortId}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
    <tr><td align="center">

      <!-- Card -->
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);max-width:620px;width:100%;">

        <!-- ── HEADER ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#1a3558 100%);padding:48px 48px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);border-radius:50px;padding:8px 24px;margin-bottom:24px;">
              <span style="color:#D4AF37;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">✦ Official Invoice ✦</span>
            </div>
            <div style="color:#D4AF37;font-size:38px;font-weight:800;letter-spacing:-1px;margin:0 0 6px;text-shadow:0 2px 10px rgba(212,175,55,0.3);">Pokémon Center</div>
            <div style="color:#94a3b8;font-size:13px;letter-spacing:1px;">Premier International Pokémon &amp; TCG Cards</div>
            <div style="margin-top:28px;">
              <div style="display:inline-block;background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.3);border-radius:10px;padding:10px 28px;">
                <span style="color:#fbbf24;font-size:15px;font-weight:700;letter-spacing:2px;">ORDER #${shortId}</span>
              </div>
            </div>
          </td>
        </tr>

        <!-- ── ORDER CONFIRMED BADGE ── -->
        <tr>
          <td style="padding:0;">
            <div style="background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:16px 48px;display:flex;align-items:center;">
              <span style="color:#16a34a;font-size:13px;font-weight:700;display:block;text-align:center;width:100%;">
                ✅ &nbsp; Order Confirmed — We're processing your purchase!
              </span>
            </div>
          </td>
        </tr>

        <!-- ── GREETING ── -->
        <tr>
          <td style="padding:40px 48px 0;">
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">Hello, ${name}! 👋</p>
            <p style="margin:0;font-size:15px;color:#64748b;line-height:1.7;">
              Thank you for your order at <strong>Pokémon Center</strong>. We've received your purchase and it's now being carefully processed by our team.
              Below you'll find a complete summary of your transaction.
            </p>
          </td>
        </tr>

        <!-- ── ORDER META ── -->
        <tr>
          <td style="padding:28px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 22px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;font-weight:700;">📅 Order Date</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${orderDate}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 22px;">
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;font-weight:700;">💳 Payment Method</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${payment}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── ITEMS TABLE ── -->
        <tr>
          <td style="padding:0 48px 28px;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">🛍️ Items Ordered</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:14px 16px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Product</th>
                  <th style="padding:14px 16px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                  <th style="padding:14px 16px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- ── TOTAL ── -->
        <tr>
          <td style="padding:0 48px 28px;">
            <div style="background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.03));border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;">
                    <span style="font-size:14px;color:#64748b;">Subtotal</span>
                    <span style="float:right;font-size:14px;color:#1f2937;font-weight:600;">$${total}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 0;">
                    <span style="font-size:14px;color:#64748b;">Shipping</span>
                    <span style="float:right;font-size:14px;color:#16a34a;font-weight:700;">Free</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;border-top:2px solid rgba(212,175,55,0.2);">
                    <span style="font-size:18px;font-weight:800;color:#0f172a;">Total</span>
                    <span style="float:right;font-size:26px;font-weight:800;color:#D4AF37;">$${total}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- ── SHIPPING ── -->
        <tr>
          <td style="padding:0 48px 24px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;">
              <div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">📦 Shipping To</div>
              <div style="font-size:15px;color:#1f2937;font-weight:600;">${shippingLine}</div>
            </div>
          </td>
        </tr>

        <!-- ── TRACKING ID ── -->
        <tr>
          <td style="padding:0 48px 24px;">
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px 24px;">
              <div style="font-size:10px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">🔍 Your Tracking ID</div>
              <div style="font-family:monospace;font-size:13px;color:#92400e;background:#fff;border:1px dashed #fbbf24;border-radius:8px;padding:12px 16px;word-break:break-all;letter-spacing:0.5px;">${orderId}</div>
              <div style="font-size:12px;color:#b45309;margin-top:10px;font-style:italic;">💡 Save this ID to track your order status anytime on our website.</div>
            </div>
          </td>
        </tr>

        ${notes ? `
        <!-- ── NOTES ── -->
        <tr>
          <td style="padding:0 48px 24px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;">
              <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">📝 Your Notes</div>
              <div style="font-size:14px;color:#374151;line-height:1.7;">${notes}</div>
            </div>
          </td>
        </tr>` : ''}

        <!-- ── CTA ── -->
        <tr>
          <td style="padding:0 48px 40px;text-align:center;">
            <a href="${invoiceUrl}" style="display:inline-block;padding:18px 44px;background:linear-gradient(135deg,#D4AF37,#b8860b);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:800;font-size:16px;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(212,175,55,0.4);">
              📄 View &amp; Download Full Invoice
            </a>
            <div style="margin-top:14px;">
              <a href="${safeOrigin}track.html" style="display:inline-block;padding:12px 28px;background:#f1f5f9;color:#334155;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;border:1px solid #e2e8f0;">
                📦 Track My Order
              </a>
            </div>
          </td>
        </tr>

        <!-- ── WHAT'S NEXT ── -->
        <tr>
          <td style="padding:0 48px 36px;">
            <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:24px;">
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:16px;">📋 What Happens Next?</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f4f8;">
                    <span style="display:inline-block;width:26px;height:26px;background:#D4AF37;color:#fff;font-size:12px;font-weight:800;border-radius:50%;text-align:center;line-height:26px;margin-right:10px;vertical-align:middle;">1</span>
                    <span style="font-size:13px;color:#374151;vertical-align:middle;">Our team reviews and confirms your order (within 24 hours)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f4f8;">
                    <span style="display:inline-block;width:26px;height:26px;background:#D4AF37;color:#fff;font-size:12px;font-weight:800;border-radius:50%;text-align:center;line-height:26px;margin-right:10px;vertical-align:middle;">2</span>
                    <span style="font-size:13px;color:#374151;vertical-align:middle;">We carefully package your cards for secure international shipping</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="display:inline-block;width:26px;height:26px;background:#D4AF37;color:#fff;font-size:12px;font-weight:800;border-radius:50%;text-align:center;line-height:26px;margin-right:10px;vertical-align:middle;">3</span>
                    <span style="font-size:13px;color:#374151;vertical-align:middle;">Your order ships &amp; you'll be notified with full tracking info</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 48px;border-radius:0 0 20px 20px;text-align:center;">
            <div style="color:#D4AF37;font-size:20px;font-weight:800;margin-bottom:8px;">Pokémon Center</div>
            <div style="color:#64748b;font-size:13px;line-height:1.7;">
              Questions? Reply to this email or contact us at<br/>
              <a href="mailto:contact@pokéemoncenter.com" style="color:#D4AF37;text-decoration:none;font-weight:600;">contact@pokéemoncenter.com</a>
            </div>
            <div style="color:#334155;font-size:11px;margin-top:20px;padding-top:16px;border-top:1px solid #1e293b;">
              © ${new Date().getFullYear()} Pokémon Center. All rights reserved. · Authentic International TCG Cards
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ─────────────────────────────────────────────────────────────
    // STORE ADMIN EMAIL – New Order Alert
    // ─────────────────────────────────────────────────────────────
    const storeHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>New Order Alert #${shortId}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#161b22;border-radius:16px;overflow:hidden;border:1px solid #30363d;max-width:620px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#D4AF37 0%,#b8860b 100%);padding:28px 48px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🛒</div>
            <div style="color:#ffffff;font-size:22px;font-weight:800;">New Order Received!</div>
            <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:4px;">Order #${shortId} · ${orderDate}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 48px 0;">
            <div style="font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;">Customer Details</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;border:1px solid #30363d;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #21262d;">
                  <span style="font-size:12px;color:#8b949e;">Name</span><br/>
                  <span style="font-size:15px;font-weight:700;color:#e6edf3;">${name}</span>
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #21262d;">
                  <span style="font-size:12px;color:#8b949e;">Email</span><br/>
                  <a href="mailto:${email}" style="font-size:15px;font-weight:600;color:#58a6ff;text-decoration:none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;">
                  <span style="font-size:12px;color:#8b949e;">Payment Method</span><br/>
                  <span style="font-size:15px;font-weight:700;color:#e6edf3;">${payment}</span>
                </td>
                <td style="padding:14px 20px;">
                  <span style="font-size:12px;color:#8b949e;">Shipping To</span><br/>
                  <span style="font-size:14px;font-weight:600;color:#e6edf3;">${shippingLine}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px 0;">
            <div style="font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;">Items Ordered</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;border:1px solid #30363d;border-radius:10px;overflow:hidden;">
              <thead>
                <tr style="background:#161b22;">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1px;">Product</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows.replace(/color:#1f2937/g, 'color:#e6edf3').replace(/color:#6b7280/g, 'color:#8b949e').replace(/border-bottom:1px solid #f0f0f0/g, 'border-bottom:1px solid #21262d')}
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.05));border:1px solid rgba(212,175,55,0.3);border-radius:10px;">
              <tr>
                <td style="padding:20px 24px;">
                  <span style="font-size:14px;color:#8b949e;">Order Total</span>
                  <span style="float:right;font-size:26px;font-weight:800;color:#D4AF37;">$${total}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${notes ? `
        <tr>
          <td style="padding:0 48px 20px;">
            <div style="background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:16px 20px;">
              <div style="font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Customer Notes</div>
              <div style="font-size:14px;color:#e6edf3;line-height:1.6;">${notes}</div>
            </div>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:0 48px 24px;">
            <div style="background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:16px 20px;">
              <div style="font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Full Order ID</div>
              <div style="font-family:monospace;font-size:13px;color:#f0e68c;word-break:break-all;">${orderId}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 48px 32px;text-align:center;">
            <a href="${invoiceUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#D4AF37,#b8860b);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
              📄 View Full Invoice
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#0d1117;padding:20px 48px;border-top:1px solid #21262d;text-align:center;border-radius:0 0 16px 16px;">
            <div style="color:#D4AF37;font-size:16px;font-weight:800;">Pokémon Center Admin</div>
            <div style="color:#8b949e;font-size:12px;margin-top:4px;">© ${new Date().getFullYear()} Pokémon Center · Internal notification</div>
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
    const sendEmail = async (to: string, toName: string, subject: string, html: string) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `Pokémon Center <${FROM_EMAIL}>`,
          to: to,
          reply_to: STORE_EMAIL,
          subject: subject,
          html: html
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("Resend API Error:", errText);
        throw new Error("Failed to send email: " + errText);
      }
      return await response.json();
    };

    const results = await Promise.all([
      // Customer invoice email
      sendEmail(
        email,
        name,
        `✅ Order Confirmed #${shortId} – Your Pokémon Center Invoice`,
        customerHtml
      ),
      // Store admin notification
      sendEmail(
        STORE_EMAIL,
        "Pokémon Center Admin",
        `🛒 New Order from ${name} — $${total} · #${shortId}`,
        storeHtml
      )
    ]);

    return new Response(JSON.stringify({ success: true, message: 'Emails sent successfully', results }), {
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
