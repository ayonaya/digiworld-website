// netlify/functions/nowpayments-ipn.js
// This function handles Instant Payment Notifications (IPN) from NowPayments.
// It is triggered by NowPayments when a payment status changes.

const crypto = require('crypto');
const nodemailer = require('nodemailer'); // For sending emails
const { getNextAvailableKey } = require('./keys'); // Your temporary key management module

// Nodemailer Transporter Configuration (using environment variables)
let transporter = nodemailer.createTransport({
    service: 'gmail', // Or 'smtp' for other providers
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});

exports.handler = async (event, context) => {
    // Ensure the request is a POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const signature = event.headers['x-nowpayments-sig'];
    // In Netlify Functions, event.body for POST requests with application/json
    // is usually the raw string, which is required for signature verification.
    const rawBody = event.body; 

    const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

    // Validate presence of signature and secret
    if (!signature) {
        console.warn('IPN received without x-nowpayments-sig header.');
        return { statusCode: 400, body: 'Bad Request: Missing signature' };
    }

    if (!NOWPAYMENTS_IPN_SECRET) {
        console.error("NOWPAYMENTS_IPN_SECRET is not set. Cannot verify IPN signature.");
        return { statusCode: 500, body: 'Server Error: IPN secret not configured' };
    }

    // Verify the webhook signature using SHA512 HMAC
    const hash = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
                       .update(rawBody) // Use the raw body for hash calculation
                       .digest('hex');

    if (signature !== hash) {
        console.warn('IPN signature mismatch. Possible fraud attempt. Received:', signature, 'Calculated:', hash);
        return { statusCode: 403, body: 'Forbidden: Invalid signature' };
    }

    let ipnData;
    try {
        ipnData = JSON.parse(rawBody); // Parse the raw body into JSON after verification
    } catch (e) {
        console.error('Error parsing IPN body as JSON:', e);
        return { statusCode: 400, body: 'Bad Request: Invalid JSON body' };
    }

    console.log('Verified IPN received from NowPayments:', ipnData);

    const { payment_status, order_id, actually_paid, pay_currency, price_amount, price_currency, payment_id } = ipnData;

    try {
        // Check if the payment status is 'finished' (or 'partially_paid' if you handle that)
        if (payment_status === 'finished') {
            console.log(`Payment FINISHED for Order ID: ${order_id}, Payment ID: ${payment_id}`);

            // !!! IMPORTANT: Replace this with proper database key retrieval !!!
            // In a production app, you would typically:
            // 1. Look up the order in your database using `order_id`.
            // 2. Retrieve the `customerEmail` and `productId` associated with this order.
            // 3. Fetch an unused digital key from your key inventory database.
            // 4. Mark the key as used and update the order status to 'completed'.
            
            // For this temporary example, we'll use a placeholder email
            // and the simulated key retrieval from './keys.js'.
            const customerEmail = ipnData.ipn_extra_data?.customerEmail || 'customer@example.com'; // Try to get from extra data if sent
            // Fallback if not in extra data: If you stored order_id to email mapping in a DB when creating order
            // you'd retrieve it here. For now, using a generic placeholder.
            if (customerEmail === 'customer@example.com') {
                console.warn(`Could not retrieve actual customer email for order ${order_id}. Using placeholder.`);
                // In a real app, this would be a lookup or an error.
            }

            const key = await getNextAvailableKey(); // Get key from your temporary module (or real DB)

            if (!key) {
                console.error(`No digital key available for order ${order_id}. Manual intervention needed.`);
                // Send an alert email to your admin for manual fulfillment
                await transporter.sendMail({
                    from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER, // Send alert to your admin email
                    subject: `ALERT: No Key Available for Crypto Order ${order_id}`,
                    text: `Payment finished for order ${order_id} (Payment ID: ${payment_id}), but no digital key could be retrieved from inventory for email ${customerEmail}. Manual fulfillment required.`
                });
                // Return 200 to NowPayments to acknowledge the webhook, but indicate internal issue
                return { statusCode: 200, body: 'IPN processed, but no key available for delivery.' }; 
            }

            // Send the digital key to the customer via email
            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: customerEmail,
                subject: `Your DigiWorld Digital License for Order ${order_id} (Crypto Payment)`,
                text: `Thank you for your purchase from DigiWorld!\n\nYour payment for ${price_amount} ${price_currency} (${actually_paid} ${pay_currency}) has been successfully processed via crypto.\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
            });

            console.log(`Digital key for order ${order_id} sent to ${customerEmail} via crypto payment.`);

            // In a real system, you'd also update the order status in your database to 'completed'
            // and mark the key as 'used'.

        } else if (payment_status === 'partially_paid') {
            console.warn(`Payment PARTIALLY PAID for Order ID: ${order_id}. Amount paid: ${actually_paid} ${pay_currency}.`);
            // You might want to email the customer/admin about partial payment here.
        } else if (payment_status === 'waiting' || payment_status === 'confirming') {
            console.log(`Payment status for Order ID: ${order_id} is ${payment_status}. Waiting for completion.`);
        } else {
            console.log(`Payment status for Order ID: ${order_id} is ${payment_status}. No action taken.`);
        }

        // Always return 200 OK to NowPayments to acknowledge receipt of the IPN.
        // This prevents NowPayments from retrying the webhook.
        return { statusCode: 200, body: 'IPN received and processed' };

    } catch (error) {
        console.error('Error processing NowPayments IPN:', error);
        // Even on internal errors, return 200 to NowPayments to avoid repeated retries.
        // Ensure you have robust internal logging/alerting for these failures.
        return { statusCode: 200, body: 'Server Error: Failed to process IPN internally' };
    }
};
