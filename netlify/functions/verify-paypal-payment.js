// netlify/functions/verify-paypal-payment.js
// This function handles server-side PayPal payment verification and digital key delivery.

const axios = require('axios');
const nodemailer = require('nodemailer');
const { getAndMarkKeyAsUsed } = require('./firestore-key-manager'); 
const { initializeApp, getApps, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// Initialize Firebase Admin SDK (same as in firestore-key-manager.js)
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized in verify-paypal-payment.");
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK in verify-paypal-payment:", e);
    }
}
const db = getFirestore();

// Nodemailer Transporter Configuration
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
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { orderID, email, productId, amount, currency } = JSON.parse(event.body); // Added amount, currency for initial save

    if (!orderID || !email || !productId) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: 'Missing required fields for PayPal verification.' }) 
        };
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        console.error("PayPal API keys are not set. Please check your Netlify environment variables.");
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: "PayPal service not configured." }) 
        };
    }

    try {
        // --- Store initial order details in Firestore (if not already present from a previous step) ---
        // This is a good place to ensure the order is recorded before capture.
        const ordersRef = db.collection('orders');
        const orderDocRef = ordersRef.doc(orderID);
        await orderDocRef.set({
            productId: productId,
            customerEmail: email,
            amount: amount, // Assuming amount and currency are passed from frontend for PayPal too
            currency: currency,
            paymentGateway: 'paypal',
            status: 'initiated', // Initial status
            createdAt: new Date().toISOString()
        }, { merge: true }); // Use merge: true to avoid overwriting if doc exists
        console.log(`PayPal Order ${orderID} details saved/updated in Firestore.`);
        // --- End Firestore save ---

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

            const key = await getAndMarkKeyAsUsed(email, orderID); 

            if (!key) {
                console.error(`No digital key available for PayPal order ${orderID}. Manual intervention needed.`);
                await transporter.sendMail({
                    from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER, 
                    subject: `ALERT: No Key Available for PayPal Order ${orderID}`,
                    text: `Payment finished for PayPal order ${orderID}, but no digital key could be retrieved from inventory for email ${email}. Manual fulfillment required.`
                });
                return { 
                    statusCode: 200, 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ success: true, message: 'Payment verified, but no key available. Admin notified for manual delivery.' }) 
                };
            }

            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: `Your DigiWorld Digital License for Order ${orderID} (PayPal Payment)`,
                text: `Thank you for your purchase from DigiWorld!\n\nYour PayPal payment for order ${orderID} has been successfully processed.\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
            });

            console.log(`Digital key for PayPal order ${orderID} sent to ${email}.`);

            // Update order status in Firestore to 'completed'
            await orderDocRef.update({ status: 'completed', paymentStatusPaypal: paypalStatus, fulfilledAt: new Date().toISOString() });
            console.log(`Order ${orderID} status updated to completed in Firestore.`);

            return { 
                statusCode: 200, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ success: true, message: 'Payment verified and key delivered.' }) 
            };

        } else {
            console.warn(`PayPal payment status for Order ID ${orderID}: ${paypalStatus}`);
            // Update order status in Firestore to reflect non-completion
            await orderDocRef.update({ status: 'failed', paymentStatusPaypal: paypalStatus, updatedAt: new Date().toISOString() });
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ success: false, message: `PayPal payment not completed. Status: ${paypalStatus}` }) 
            };
        }

    } catch (error) {
        console.error('Error verifying PayPal payment:', error.response ? error.response.data : error.message);
        // Attempt to update order status to failed in Firestore even on error
        const orderDocRef = db.collection('orders').doc(orderID);
        await orderDocRef.update({ status: 'error', errorDetails: error.response ? error.response.data : error.message, updatedAt: new Date().toISOString() }).catch(e => console.error("Failed to update order status on error:", e));

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
