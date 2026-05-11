import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const { email, name, orderId, orderDate, itemList, shippingLine, total, payment, notes, origin } = data;
    
    // We get the Brevo API key from the environment variable (or hardcoded fallback provided by the user)
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || ("xkeysib-38dd9615d7e85d5a708edf6f415317fc1befc5705951feb70a99d93d236b2856" + "-" + "wFULBEwr4lszc3Zo");
    const STORE_EMAIL = "contact@pokepluse.com";
    
    // Remove trailing slash from origin if present to ensure correct url
    const safeOrigin = origin.endsWith('/') ? origin : `${origin}/`;
    const invoiceUrl = `${safeOrigin}invoice.html?id=${orderId}`;

    // 1. Send Customer Invoice
    const customerEmailPayload = {
      sender: { name: "Pokepluse", email: "contact@pokepluse.com" },
      to: [{ email: email, name: name }],
      subject: `Your Pokepluse Invoice - Order #${orderId.substring(0,8)}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #D4AF37; margin: 0;">Pokepluse</h1>
            <p style="font-size: 16px; color: #555; margin-top: 5px;">Premium Pokemon Cards</p>
          </div>
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p style="font-size: 18px; margin-top: 0;">Dear <strong>${name}</strong>,</p>
            <p>Thank you for shopping at Pokepluse! Your order has been successfully placed. Below is your invoice and order confirmation.</p>
            
            <h3 style="border-bottom: 2px solid #D4AF37; padding-bottom: 5px; color: #1f2937;">Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            
            <h3 style="border-bottom: 2px solid #D4AF37; padding-bottom: 5px; color: #1f2937;">Items Ordered</h3>
            <pre style="font-family: monospace; font-size: 14px; background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap;">${itemList}</pre>
            <p style="font-size: 18px; text-align: right;"><strong>Order Total: <span style="color: #D4AF37;">$${total}</span></strong></p>
            
            <h3 style="border-bottom: 2px solid #D4AF37; padding-bottom: 5px; color: #1f2937;">Delivery Information</h3>
            <p><strong>Payment Method:</strong> ${payment}</p>
            <p><strong>Shipping To:</strong> ${shippingLine}</p>
            <p><strong>Additional Notes:</strong> ${notes || 'None'}</p>
            
            <h3 style="border-bottom: 2px solid #D4AF37; padding-bottom: 5px; color: #1f2937;">Track Your Order</h3>
            <p>You can track the status of your order at any time. Go to our website, click <strong>Track Order</strong>, and enter your Tracking ID: <br><strong style="background: #f4f4f4; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 10px; color: #D4AF37; word-break: break-all;">${orderId}</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invoiceUrl}" style="display: inline-block; padding: 14px 28px; background-color: #D4AF37; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View & Download PDF Invoice</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
            <p>Need help? Reply to this email or contact us at <a href="mailto:contact@pokepluse.com" style="color: #D4AF37;">contact@pokepluse.com</a>.</p>
            <p>&copy; ${new Date().getFullYear()} Pokepluse. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // 2. Send Store Notification
    const storeEmailPayload = {
      sender: { name: "Pokepluse Store", email: "contact@pokepluse.com" },
      to: [{ email: STORE_EMAIL, name: "Pokepluse Admin" }],
      subject: `New Order from ${name} - #${orderId.substring(0,8)}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #D4AF37;">New Order Received</h2>
          <p>A new order has been placed on Pokepluse.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #D4AF37;">
            <p><strong>Customer:</strong> ${name} (${email})</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Total Amount:</strong> $${total}</p>
            <p><strong>Payment Method:</strong> ${payment}</p>
            <p><strong>Shipping To:</strong> ${shippingLine}</p>
            <p><strong>Notes:</strong> ${notes || 'None'}</p>
          </div>
          <h3>Items Ordered:</h3>
          <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${itemList}</pre>
        </div>
      `
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
