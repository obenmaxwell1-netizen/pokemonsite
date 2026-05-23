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

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || ("xkeysib-38dd9615d7e85d5a708edf6f415317fc1befc5705951feb70a99d93d236b2856" + "-" + "wFULBEwr4lszc3Zo");
    const STORE_EMAIL = "contact@pokepluse.com";

    const safeOrigin = origin.endsWith('/') ? origin : `${origin}/`;
    const invoiceUrl = `${safeOrigin}invoice.html?id=${orderId}`;
    const shortId = orderId.substring(0, 8).toUpperCase();

    // Parse itemList string into HTML table rows
    const itemRows = itemList.split('\n').filter((l: string) => l.trim()).map((line: string) => {
      // Format: "- Product Name  x2  =  $99.00"
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
    // CLIENT EMAIL – Premium Invoice
    // ─────────────────────────────────────────────────────────────
    const customerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pokepluse Invoice #${shortId}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
    <tr><td align="center">

      <!-- Card -->
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:620px;width:100%;">

        <!-- ── HEADER ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#1a3558 100%);padding:40px 48px;text-align:center;">
            <div style="display:inline-block;background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.35);border-radius:12px;padding:10px 22px;margin-bottom:20px;">
              <span style="color:#D4AF37;font-size:13px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Official Invoice</span>
            </div>
            <div style="color:#D4AF37;font-size:34px;font-weight:800;letter-spacing:-0.5px;margin:0 0 6px;">Pokepluse</div>
            <div style="color:#94a3b8;font-size:14px;">Premier International Pokémon &amp; TCG Cards</div>
            <div style="margin-top:28px;display:inline-block;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);border-radius:8px;padding:8px 20px;">
              <span style="color:#fbbf24;font-size:13px;font-weight:600;letter-spacing:1px;">ORDER #${shortId}</span>
            </div>
          </td>
        </tr>

        <!-- ── GREETING ── -->
        <tr>
          <td style="padding:36px 48px 0;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Hello, ${name}! 👋</p>
            <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
              Thank you for your order. We've received your purchase and it's now being processed.
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
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;">
                    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:600;">Order Date</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${orderDate}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;">
                    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:600;">Payment Method</div>
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
            <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Items Ordered</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Product</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Amount</th>
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
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:14px;color:#64748b;">Subtotal</span>
                  <span style="float:right;font-size:14px;color:#1f2937;font-weight:600;">$${total}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:14px;color:#64748b;">Shipping</span>
                  <span style="float:right;font-size:14px;color:#10b981;font-weight:600;">Free</span>
                </td>
              </tr>
              <tr>
                <td style="padding-top:12px;border-top:2px solid #e2e8f0;">
                  <span style="font-size:18px;font-weight:800;color:#0f172a;">Total</span>
                  <span style="float:right;font-size:22px;font-weight:800;color:#D4AF37;">$${total}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── SHIPPING ── -->
        <tr>
          <td style="padding:0 48px 28px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;">
              <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">📦 Shipping To</div>
              <div style="font-size:15px;color:#1f2937;font-weight:500;">${shippingLine}</div>
            </div>
          </td>
        </tr>

        <!-- ── TRACKING ID ── -->
        <tr>
          <td style="padding:0 48px 28px;">
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:20px 24px;">
              <div style="font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">🔍 Your Tracking ID</div>
              <div style="font-family:monospace;font-size:14px;color:#92400e;background:#fff;border:1px dashed #fbbf24;border-radius:6px;padding:10px 14px;word-break:break-all;">${orderId}</div>
              <div style="font-size:12px;color:#b45309;margin-top:8px;">Save this ID to track your order status on our website.</div>
            </div>
          </td>
        </tr>

        ${notes ? `
        <!-- ── NOTES ── -->
        <tr>
          <td style="padding:0 48px 28px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">📝 Your Notes</div>
              <div style="font-size:14px;color:#374151;line-height:1.6;">${notes}</div>
            </div>
          </td>
        </tr>` : ''}

        <!-- ── CTA ── -->
        <tr>
          <td style="padding:0 48px 36px;text-align:center;">
            <a href="${invoiceUrl}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#D4AF37,#b8860b);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(212,175,55,0.35);">
              📄 View &amp; Download Full Invoice
            </a>
            <div style="margin-top:16px;">
              <a href="${safeOrigin}track.html" style="display:inline-block;padding:12px 28px;background:#f1f5f9;color:#334155;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;border:1px solid #e2e8f0;">
                📦 Track My Order
              </a>
            </div>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#0f172a;padding:28px 48px;border-radius:0 0 16px 16px;text-align:center;">
            <div style="color:#D4AF37;font-size:18px;font-weight:800;margin-bottom:8px;">Pokepluse</div>
            <div style="color:#64748b;font-size:13px;line-height:1.7;">
              Questions? Reply to this email or contact us at
              <a href="mailto:contact@pokepluse.com" style="color:#D4AF37;text-decoration:none;">contact@pokepluse.com</a>
            </div>
            <div style="color:#475569;font-size:11px;margin-top:16px;padding-top:16px;border-top:1px solid #1e293b;">
              © ${new Date().getFullYear()} Pokepluse. All rights reserved. · Authentic International TCG Cards
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ─────────────────────────────────────────────────────────────
    // STORE ADMIN EMAIL – Detailed New Order Alert
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

        <!-- ── ALERT HEADER ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#D4AF37 0%,#b8860b 100%);padding:28px 48px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">🛒</div>
            <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">New Order Received!</div>
            <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:4px;">Order #${shortId} · ${orderDate}</div>
          </td>
        </tr>

        <!-- ── CUSTOMER DETAILS ── -->
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

        <!-- ── ITEMS ORDERED ── -->
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
                ${itemRows.replace(/style="([^"]*color:#1f2937[^"]*)"/g, 'style="color:#e6edf3;"').replace(/style="([^"]*color:#6b7280[^"]*)"/g, 'style="color:#8b949e;"').replace(/border-bottom:1px solid #f0f0f0/g, 'border-bottom:1px solid #21262d')}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- ── ORDER TOTAL ── -->
        <tr>
          <td style="padding:20px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.05));border:1px solid rgba(212,175,55,0.3);border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <span style="font-size:14px;color:#8b949e;">Order Total</span>
                  <span style="float:right;font-size:26px;font-weight:800;color:#D4AF37;">$${total}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── NOTES ── -->
        ${notes ? `
        <tr>
          <td style="padding:0 48px 20px;">
            <div style="background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:16px 20px;">
              <div style="font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Customer Notes</div>
              <div style="font-size:14px;color:#e6edf3;line-height:1.6;">${notes}</div>
            </div>
          </td>
        </tr>` : ''}

        <!-- ── ORDER ID ── -->
        <tr>
          <td style="padding:0 48px 24px;">
            <div style="background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:16px 20px;">
              <div style="font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Full Order ID</div>
              <div style="font-family:monospace;font-size:13px;color:#f0e68c;word-break:break-all;">${orderId}</div>
            </div>
          </td>
        </tr>

        <!-- ── CTA ── -->
        <tr>
          <td style="padding:0 48px 32px;text-align:center;">
            <a href="${invoiceUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#D4AF37,#b8860b);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
              📄 View Full Invoice
            </a>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#0d1117;padding:20px 48px;border-top:1px solid #21262d;text-align:center;border-radius:0 0 16px 16px;">
            <div style="color:#D4AF37;font-size:16px;font-weight:800;">Pokepluse Admin</div>
            <div style="color:#8b949e;font-size:12px;margin-top:4px;">© ${new Date().getFullYear()} Pokepluse · Internal notification — do not reply</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const customerEmailPayload = {
      sender: { name: "Pokepluse", email: "contact@pokepluse.com" },
      to: [{ email: email, name: name }],
      subject: `✅ Order Confirmed #${shortId} – Your Pokepluse Invoice`,
      htmlContent: customerHtml
    };

    const storeEmailPayload = {
      sender: { name: "Pokepluse Store", email: "contact@pokepluse.com" },
      to: [{ email: STORE_EMAIL, name: "Pokepluse Admin" }],
      subject: `🛒 New Order from ${name} — $${total} · #${shortId}`,
      htmlContent: storeHtml
    };

    const sendEmail = async (payload: any) => {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("Brevo API Error:", errText);
        throw new Error("Failed to send email");
      }
      return await response.json();
    };

    const results = await Promise.all([
      sendEmail(customerEmailPayload),
      sendEmail(storeEmailPayload)
    ]);

    return new Response(JSON.stringify({ success: true, message: 'Emails sent successfully', results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
