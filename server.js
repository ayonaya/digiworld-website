// server.js
const nodemailer = require('nodemailer');
const express = require('express');
const axios = require('axios'); // Import axios for making HTTP requests
const fs = require('fs').promises; // Use fs.promises for async file operations
const crypto = require('crypto'); // Import crypto module for hashing
const admin = require('firebase-admin'); // Import Firebase Admin SDK

const app = express();

console.log("Starting server.js...");

// --- Environment Variable Loading for Local Development ---
// This ensures dotenv only loads .env.local when not in production.
// In production (like Netlify), environment variables are provided directly by the hosting service.
// This block must be at the very top of your file to ensure variables are loaded before being used.
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '.env.local' });
    console.log("Loaded environment variables from .env.local for local development.");
} else {
    console.log("Running in production environment. Environment variables expected from host.");
}

// --- IMPORTANT: Validate critical environment variables at startup ---
// This ensures that all necessary secrets are available before the server attempts to function.
const requiredEnvVars = [
    'NOWPAYMENTS_API_KEY',
    'NOWPAYMENTS_IPN_SECRET',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_SECRET',
    'GMAIL_USER',
    'GMAIL_PASS',
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    'ADMIN_PASSWORD' // Assuming this is used somewhere in your app for admin access (e.g., login, protected routes)
];

let missingEnvVars = [];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        missingEnvVars.push(envVar);
    }
});

if (missingEnvVars.length > 0) {
    console.error(`Error: The following critical environment variables are missing: ${missingEnvVars.join(', ')}`);
    console.error('Please ensure they are set in your .env.local file (for local development) or in your hosting provider (for production).');
    process.exit(1); // Exit the process if critical variables are missing
} else {
    console.log("All required environment variables are present.");
}


// --- Firebase Admin SDK Initialization ---
let serviceAccount;
try {
    // Parse the JSON string from the environment variable (FIREBASE_SERVICE_ACCOUNT_KEY)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY environment variable. Make sure it\'s valid JSON and properly formatted (including newlines):', e);
    process.exit(1); // Cannot proceed if Firebase Admin SDK cannot be initialized
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
console.log("Firebase Admin SDK initialized successfully.");


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
        user: process.env.GMAIL_USER,  // From environment variables
        pass: process.env.GMAIL_PASS,  // From environment variables
    }
});
console.log("Nodemailer transporter configured.");

// Middleware to parse JSON bodies for most routes
app.use(express.json());

// Handle POST requests to /buy-key (your existing email delivery for keys)
app.post('/buy-key', async (req, res) => {
    try {
        // IMPORTANT: Robustly check if keys.json exists and contains valid data
        let keys;
        try {
            const keysData = await fs.readFile('keys.json', 'utf8');
            keys = JSON.parse(keysData);
        } catch (readError) {
            console.error('Error reading or parsing keys.json for /buy-key:', readError);
            return res.status(500).json({ error: "Server error: Key inventory file not found or malformed." });
        }

        if (!Array.isArray(keys) || keys.length === 0) {
            console.warn("No keys available in keys.json for /buy-key. Replenishment needed.");
            return res.json({ key: "Sorry, no keys available right now." });
        }

        const key = keys.shift(); // Remove first key
        await fs.writeFile('keys.json', JSON.stringify(keys)); // Update the keys.json file

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
        console.log(`Key delivered to ${email} for /buy-key.`);

        // 4. Respond to client
        res.json({ key });

    } catch (err) {
        console.error('Error in /buy-key:', err);
        res.status(500).json({ error: "Server error during key purchase process.", details: err.message });
    }
});


// Endpoint to create a NowPayments order
app.post('/create-nowpayment-order', async (req, res) => {
    const { productId, email, amount, currency } = req.body;

    if (!productId || !email || !amount || !currency) {
        return res.status(400).json({ message: 'Missing required fields for crypto payment.' });
    }

    try {
        const order_id = `DIGIWORLD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // For IPN callback URL:
        // Use process.env.URL if deploying to Netlify (Netlify automatically sets this)
        // Or set PUBLIC_SITE_URL environment variable in Netlify to your custom domain (e.g., https://digiworldnew.com)
        // Fallback to a hardcoded domain if the env var isn't found (for local testing without a tunneling service or in specific setups)
        const ipn_callback_url = `${process.env.URL || process.env.PUBLIC_SITE_URL || 'https://digiworldnew.com'}/nowpayments-ipn`;
        console.log(`Using IPN callback URL: ${ipn_callback_url}`);

        const paymentData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            pay_currency: 'btc', // Can be dynamic based on user choice from client-side
            order_id: order_id,
            order_description: `Digital License for Product ID: ${productId}`,
            ipn_callback_url: ipn_callback_url,
            // Optional: success_url, cancel_url, fail_url (if you want NowPayments to redirect users)
            // success_url: `${process.env.URL || process.env.PUBLIC_SITE_URL || 'https://digiworldnew.com'}/payment-success?order_id=${order_id}`,
            // cancel_url: `${process.env.URL || process.env.PUBLIC_SITE_URL || 'https://digiworldnew.com'}/payment-cancelled?order_id=${order_id}`,
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
// This must be used BEFORE express.json() for this specific route.
app.use('/nowpayments-ipn', express.raw({ type: 'application/json' }));

// Endpoint to handle Instant Payment Notifications (IPN) from NowPayments
app.post('/nowpayments-ipn', async (req, res) => {
    const signature = req.headers['x-nowpayments-sig'];
    const body = req.body; // Raw body is needed for HMAC verification

    if (!signature) {
        console.warn('IPN received without x-nowpayments-sig header. Cannot verify.');
        return res.status(400).send('Bad Request: Missing signature');
    }

    // IPN secret already validated at server startup
    const hash = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
                       .update(body) // Use the raw body for hashing
                       .digest('hex');

    const expectedSignature = hash;

    if (signature !== expectedSignature) {
        console.warn('IPN signature mismatch. Possible tampering or invalid source.');
        return res.status(403).send('Forbidden: Invalid signature');
    }

    let ipnData;
    try {
        ipnData = JSON.parse(body.toString()); // Parse the raw body as JSON after verification
    } catch (e) {
        console.error('Error parsing IPN body as JSON after signature verification:', e);
        return res.status(400).send('Bad Request: Invalid JSON body');
    }

    console.log('Verified IPN received from NowPayments:', ipnData);

    const { payment_status, order_id, actually_paid, pay_currency, price_amount, price_currency, payment_id } = ipnData;

    try {
        if (payment_status === 'finished') {
            console.log(`Payment FINISHED for Order ID: ${order_id}, Payment ID: ${payment_id}. Proceeding to key delivery.`);

            // --- Digital Key Delivery Logic ---
            let keys;
            try {
                const keysData = await fs.readFile('keys.json', 'utf8');
                keys = JSON.parse(keysData);
            } catch (readError) {
                console.error('Error reading or parsing keys.json for IPN key delivery:', readError);
                return res.status(200).send('IPN processed, but server error occurred during key inventory access.');
            }

            if (!Array.isArray(keys) || keys.length === 0) {
                console.error(`No keys available in keys.json for order ${order_id}. Manual intervention may be needed.`);
                return res.status(200).send('IPN processed, but no digital key available for delivery.');
            }
            const key = keys.shift(); // Get the next available key
            await fs.writeFile('keys.json', JSON.stringify(keys)); // Update keys.json with remaining keys

            // Placeholder for customer email. You'll need logic to retrieve the customer's email
            // associated with the order_id from your database or session.
            // For now, it uses a placeholder or assumes it's in the IPN data.
            const customerEmail = ipnData.email || 'customer@example.com'; // Refine this based on your order storage

            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: customerEmail,
                subject: `Your DigiWorld Digital License for Order ${order_id} (Crypto Payment)`,
                text: `Thank you for your purchase from DigiWorld!\n\nYour payment for ${price_amount} ${price_currency} (${actually_paid} ${pay_currency}) has been successfully processed via crypto.\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
            });

            console.log(`Digital key for crypto order ${order_id} sent to ${customerEmail}.`);
            // --- End Digital Key Delivery Logic ---

        } else if (payment_status === 'partially_paid') {
            console.warn(`Payment PARTIALLY PAID for Order ID: ${order_id}. Amount paid: ${actually_paid} ${pay_currency}. Awaiting full payment.`);
        } else if (payment_status === 'waiting' || payment_status === 'confirming') {
            console.log(`Payment status for Order ID: ${order_id} is ${payment_status}. Waiting for blockchain confirmation or user action.`);
        } else {
            console.log(`Payment status for Order ID: ${order_id} is ${payment_status}. No key delivery action taken for this status.`);
        }

        res.status(200).send('IPN received and processed');

    } catch (error) {
        console.error('Error processing NowPayments IPN or delivering key:', error);
        res.status(500).send('Server Error: Failed to process IPN or deliver key.');
    }
});


// Endpoint to verify PayPal payments server-side
app.post('/verify-paypal-payment', async (req, res) => {
    const { orderID, email, productId } = req.body;

    if (!orderID || !email || !productId) {
        return res.status(400).json({ message: 'Missing required fields for PayPal verification.' });
    }

    try {
        // 1. Get PayPal Access Token
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
        const tokenResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded' // Correct Content-Type for this endpoint
            }
        });
        const accessToken = tokenResponse.data.access_token;
        console.log("PayPal Access Token obtained.");

        // 2. Capture the Order on PayPal's side
        const captureResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json' // Correct Content-Type for this endpoint
            }
        });

        const paypalStatus = captureResponse.data.status;
        console.log(`PayPal capture response status: ${paypalStatus}`);

        if (paypalStatus === 'COMPLETED') {
            console.log(`PayPal payment COMPLETED for Order ID: ${orderID}. Proceeding to key delivery.`);

            // --- Digital Key Delivery Logic ---
            let keys;
            try {
                const keysData = await fs.readFile('keys.json', 'utf8');
                keys = JSON.parse(keysData);
            } catch (readError) {
                console.error('Error reading or parsing keys.json for PayPal key delivery:', readError);
                return res.status(200).json({ success: true, message: 'Payment verified, but server error occurred during key inventory access.' });
            }

            if (!Array.isArray(keys) || keys.length === 0) {
                console.error(`No keys available in keys.json for PayPal order ${orderID}. Manual intervention may be needed.`);
                return res.status(200).json({ success: true, message: 'Payment verified, but no digital key available.' });
            }
            const key = keys.shift(); // Get the next available key
            await fs.writeFile('keys.json', JSON.stringify(keys)); // Update keys.json with remaining keys

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
            console.warn(`PayPal payment status for Order ID ${orderID}: ${paypalStatus}. Key not delivered.`);
            res.status(400).json({ success: false, message: `PayPal payment not completed. Status: ${paypalStatus}` });
        }

    } catch (error) {
        console.error('Error verifying PayPal payment or delivering key:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to verify PayPal payment.',
            error: error.response ? error.response.data : error.message
        });
    }
});


// Use Netlify's provided port (for production) or fallback to 3000 (for local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));