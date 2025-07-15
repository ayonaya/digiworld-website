// netlify/functions/verify-paypal-payment.js
// This function handles server-side PayPal payment verification and digital key delivery.

const axios = require('axios');
const nodemailer = require('nodemailer');
const { getNextAvailableKey } = require('./keys'); // Your temporary key management module

// Nodemailer Transporter Configuration (using environment variables)
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API_BASE_URL = 'https://api-m.paypal.com'; // IMPORTANT: Use LIVE API for production

exports.handler = async (event, context) => {
    // Ensure the request is a POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Parse the request body
    const { orderID, email, productId } = JSON.parse(event.body);

    // Validate required fields
    if (!orderID || !email || !productId) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: 'Missing required fields for PayPal verification.' }) 
        };
    }

    // Check if PayPal API keys are configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        console.error("PayPal API keys are not set. Please check your Netlify environment variables.");
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: "PayPal service not configured." }) 
        };
    }

    try {
        // 1. Get PayPal Access Token
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
        const tokenResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const accessToken = tokenResponse.data.access_token;

        // 2. Capture the Order on PayPal's side to finalize the payment
        const captureResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const paypalStatus = captureResponse.data.status;

        if (paypalStatus === 'COMPLETED') {
            console.log(`PayPal payment COMPLETED for Order ID: ${orderID}`);

            // --- Digital Key Delivery Logic ---
            // !!! IMPORTANT: Replace this with proper database key retrieval !!!
            // In a production app, you would:
            // 1. Fetch an unused digital key from your key inventory database.
            // 2. Mark the key as used and update the order status in your database.
            const key = await getNextAvailableKey(); // Get key from your temporary module (or real DB)

            if (!key) {
                console.error(`No digital key available for PayPal order ${orderID}. Manual intervention needed.`);
                // Send an alert email to your admin for manual fulfillment
                await transporter.sendMail({
                    from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER, // Send alert to your admin email
                    subject: `ALERT: No Key Available for PayPal Order ${orderID}`,
                    text: `Payment finished for PayPal order ${orderID}, but no digital key could be retrieved from inventory for email ${email}. Manual fulfillment required.`
                });
                // Return success to frontend, but indicate key issue
                return { 
                    statusCode: 200, 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ success: true, message: 'Payment verified, but no key available. Admin notified for manual delivery.' }) 
                };
            }

            // Send the digital key to the customer via email
            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: `Your DigiWorld Digital License for Order ${orderID} (PayPal Payment)`,
                text: `Thank you for your purchase from DigiWorld!\n\nYour PayPal payment for order ${orderID} has been successfully processed.\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
            });

            console.log(`Digital key for PayPal order ${orderID} sent to ${email}.`);

            return { 
                statusCode: 200, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ success: true, message: 'Payment verified and key delivered.' }) 
            };

        } else {
            console.warn(`PayPal payment status for Order ID ${orderID}: ${paypalStatus}`);
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ success: false, message: `PayPal payment not completed. Status: ${paypalStatus}` }) 
            };
        }

    } catch (error) {
        console.error('Error verifying PayPal payment:', error.response ? error.response.data : error.message);
        return {
            statusCode: error.response && error.response.status ? error.response.status : 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: false,
                message: 'Failed to verify PayPal payment.',
                error: error.response ? error.response.data : error.message
            }),
        };
    }
};
