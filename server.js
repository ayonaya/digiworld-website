// server.js
require('dotenv').config(); // Load environment variables from .env file
const nodemailer = require('nodemailer');
const express = require('express');
const axios = require('axios'); // Import axios for making HTTP requests
const fs = require('fs').promises; // Use fs.promises for async file operations
const crypto = require('crypto'); // Import crypto module for hashing

const app = express();

console.log("Starting server.js...");

// Middleware for static files
app.use(express.static('public'));

// --- NowPayments Configuration ---
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// NowPayments Base API URL (IMPORTANT: Now set to LIVE for production transactions)
const NOWPAYMENTS_API_BASE_URL = 'https://api.nowpayments.io/v1';


// --- PayPal Configuration ---
// These should now be your LIVE Client ID and Secret in your environment variables
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

// PayPal Base API URL (IMPORTANT: Now set to LIVE for production transactions)
const PAYPAL_API_BASE_URL = 'https://api-m.paypal.com';


// --- Nodemailer Transporter Configuration ---
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,  // From Render env vars
        pass: process.env.GMAIL_PASS,  // From Render env vars
    }
});

// Middleware to parse JSON bodies for most routes
app.use(express.json());

// Handle POST requests to /buy-key (your existing email delivery for keys)
app.post('/buy-key', async (req, res) => {
    try {
        // 1. Read and update key inventory
        let keys = JSON.parse(await fs.readFile('keys.json', 'utf8'));
        if (keys.length === 0) {
            return res.json({ key: "Sorry, no keys available right now." });
        }
        const key = keys.shift(); // Remove first key
        await fs.writeFile('keys.json', JSON.stringify(keys));

        // 2. Get user's email from request
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "No email provided" });
        }

        // 3. Send email
        await transporter.sendMail({
            from: `"KeyZone" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your Digital Key',
            text: `Thank you for your purchase!\n\nHere is your key: ${key}\n\nIf you have any questions, reply to this email.`
        });

        // 4. Respond to client
        res.json({ key });

    } catch (err) {
        console.error('Error in /buy-key:', err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});


// Endpoint to create a NowPayments order
app.post('/create-nowpayment-order', async (req, res) => {
    const { productId, email, amount, currency } = req.body;

    if (!productId || !email || !amount || !currency) {
        return res.status(400).json({ message: 'Missing required fields for payment.' });
    }

    if (!NOWPAYMENTS_API_KEY || !NOWPAYMENTS_IPN_SECRET) {
        console.error("NowPayments API keys are not set. Please check your .env file or environment variables.");
        return res.status(500).json({ message: "Payment service not configured." });
    }

    try {
        const order_id = `DIGIWORLD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // IMPORTANT: Replace 'YOUR_SERVER_URL' with your actual public domain/IP (e.g., https://yourdigiworld.com).
        // If testing locally, use an ngrok URL (e.g., https://abcdef12345.ngrok.io).
        // This is the URL NowPayments will call to notify you of payment status changes.
        const ipn_callback_url = `YOUR_SERVER_URL/nowpayments-ipn`; 

        const paymentData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            pay_currency: 'btc', // Can be dynamic based on user choice
            order_id: order_id,
            order_description: `Digital License for Product ID: ${productId}`,
            ipn_callback_url: ipn_callback_url,
            // Optional: success_url, cancel_url, fail_url
            // success_url: `YOUR_SERVER_URL/payment-success?order_id=${order_id}`,
            // cancel_url: `YOUR_SERVER_URL/payment-cancelled?order_id=${order_id}`,
        };

        const headers = {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
        };

        const response = await axios.post(`${NOWPAYMENTS_API_BASE_URL}/payment`, paymentData, { headers });

        console.log(`NowPayments payment created: ${response.data.payment_id} for order ${order_id}`);

        res.status(200).json({
            message: 'NowPayments order created successfully',
            paymentId: response.data.payment_id,
            payUrl: response.data.pay_url,
        });

    } catch (error) {
        console.error('Error creating NowPayments order:', error.response ? error.response.data : error.message);
        res.status(500).json({
            message: 'Failed to create NowPayments order.',
            error: error.response ? error.response.data : error.message
        });
    }
});

// Middleware to get raw body for IPN verification (NowPayments)
app.use('/nowpayments-ipn', express.raw({ type: 'application/json' }));

// Endpoint to handle Instant Payment Notifications (IPN) from NowPayments
app.post('/nowpayments-ipn', async (req, res) => {
    const signature = req.headers['x-nowpayments-sig'];
    const body = req.body;

    if (!signature) {
        console.warn('IPN received without signature header.');
        return res.status(400).send('Bad Request: Missing signature');
    }

    if (!NOWPAYMENTS_IPN_SECRET) {
        console.error("NOWPAYMENTS_IPN_SECRET is not set. Cannot verify IPN.");
        return res.status(500).send('Server Error: IPN secret not configured');
    }

    const hash = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
                       .update(body)
                       .digest('hex');

    const expectedSignature = hash;

    if (signature !== expectedSignature) {
        console.warn('IPN signature mismatch. Possible fraud attempt.');
        return res.status(403).send('Forbidden: Invalid signature');
    }

    let ipnData;
    try {
        ipnData = JSON.parse(body.toString());
    } catch (e) {
        console.error('Error parsing IPN body as JSON:', e);
        return res.status(400).send('Bad Request: Invalid JSON body');
    }

    console.log('Verified IPN received from NowPayments:', ipnData);

    const { payment_status, order_id, actually_paid, pay_currency, price_amount, price_currency, payment_id } = ipnData;

    try {
        if (payment_status === 'finished') {
            console.log(`Payment FINISHED for Order ID: ${order_id}, Payment ID: ${payment_id}`);

            // --- Digital Key Delivery Logic (Example - adapt to your actual key management) ---
            let keys = JSON.parse(await fs.readFile('keys.json', 'utf8'));
            if (keys.length === 0) {
                console.error(`No keys available in keys.json for order ${order_id}. Manual intervention needed.`);
                return res.status(200).send('IPN processed, but no key available');
            }
            const key = keys.shift();
            await fs.writeFile('keys.json', JSON.stringify(keys));

            const customerEmail = ipnData.email || 'customer@example.com'; // Placeholder: replace with actual logic to get email from your database

            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: customerEmail,
                subject: `Your DigiWorld Digital License for Order ${order_id} (Crypto Payment)`,
                text: `Thank you for your purchase from DigiWorld!\n\nYour payment for ${price_amount} ${price_currency} (${actually_paid} ${pay_currency}) has been successfully processed via crypto.\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
            });

            console.log(`Digital key for order ${order_id} sent to ${customerEmail} via crypto payment.`);
            // --- End Digital Key Delivery Logic ---

        } else if (payment_status === 'partially_paid') {
            console.warn(`Payment PARTIALLY PAID for Order ID: ${order_id}. Amount paid: ${actually_paid} ${pay_currency}.`);
        } else if (payment_status === 'waiting' || payment_status === 'confirming') {
            console.log(`Payment status for Order ID: ${order_id} is ${payment_status}. Waiting for completion.`);
        } else {
            console.log(`Payment status for Order ID: ${order_id} is ${payment_status}. No action taken.`);
        }

        res.status(200).send('IPN received and processed');

    } catch (error) {
        console.error('Error processing NowPayments IPN:', error);
        res.status(500).send('Server Error: Failed to process IPN');
    }
});


// Endpoint to verify PayPal payments server-side
app.post('/verify-paypal-payment', async (req, res) => {
    const { orderID, email, productId } = req.body;

    if (!orderID || !email || !productId) {
        return res.status(400).json({ message: 'Missing required fields for PayPal verification.' });
    }

    // Ensure PayPal API keys are set for live transactions
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        console.error("PayPal LIVE API keys are not set. Please check your .env file or environment variables.");
        return res.status(500).json({ message: "PayPal service not configured for live transactions." });
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

        // 2. Capture the Order on PayPal's side
        const captureResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const paypalStatus = captureResponse.data.status;

        if (paypalStatus === 'COMPLETED') {
            console.log(`PayPal payment COMPLETED for Order ID: ${orderID}`);

            // --- Digital Key Delivery Logic (Example - adapt to your actual key management) ---
            let keys = JSON.parse(await fs.readFile('keys.json', 'utf8'));
            if (keys.length === 0) {
                console.error(`No keys available in keys.json for PayPal order ${orderID}. Manual intervention needed.`);
                return res.status(200).json({ success: true, message: 'Payment verified, but no key available.' });
            }
            const key = keys.shift();
            await fs.writeFile('keys.json', JSON.stringify(keys));

            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: `Your DigiWorld Digital License for Order ${orderID} (PayPal Payment)`,
                text: `Thank you for your purchase from DigiWorld!\n\nYour PayPal payment for order ${orderID} has been successfully processed.\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
            });

            console.log(`Digital key for PayPal order ${orderID} sent to ${email}.`);
            // --- End Digital Key Delivery Logic ---

            res.status(200).json({ success: true, message: 'Payment verified and key delivered.' });

        } else {
            console.warn(`PayPal payment status for Order ID ${orderID}: ${paypalStatus}`);
            res.status(400).json({ success: false, message: `PayPal payment not completed. Status: ${paypalStatus}` });
        }

    } catch (error) {
        console.error('Error verifying PayPal payment:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to verify PayPal payment.',
            error: error.response ? error.response.data : error.message
        });
    }
});


// Use Render's provided port (for production) or fallback to 3000 (for local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
