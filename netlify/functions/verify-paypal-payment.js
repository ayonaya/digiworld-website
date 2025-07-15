// netlify/functions/verify-paypal-payment.js
const axios = require('axios');
const nodemailer = require('nodemailer');
const { getAndMarkKeyAsUsed } = require('./firestore-key-manager'); 
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// --- Initialization (No changes needed) ---
if (!getApps().length) { /* ... */ }
const db = getFirestore();
let transporter = nodemailer.createTransport({ /* ... */ });
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API_BASE_URL = 'https://api-m.paypal.com';

exports.handler = async (event, context) => {
    // --- Validation and PayPal API calls (No changes needed) ---
    if (event.httpMethod !== 'POST') { /* ... */ }
    const { orderID, email, productId, amount, currency } = JSON.parse(event.body); 
    if (!orderID || !email || !productId || !amount || !currency) { /* ... */ }
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) { /* ... */ }

    try {
        const orderDocRef = db.collection('orders').doc(orderID);
        await orderDocRef.set({ /* ... */ }, { merge: true });
        
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
        const tokenResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, 'grant_type=client_credentials', { /* ... */ });
        const accessToken = tokenResponse.data.access_token;
        const captureResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {}, { /* ... */ });
        const paypalStatus = captureResponse.data.status;

        if (paypalStatus === 'COMPLETED') {
            console.log(`PayPal payment COMPLETED for Order ID: ${orderID}`);

            // UPGRADE: Pass the 'productId' to the key manager.
            const key = await getAndMarkKeyAsUsed(productId, email, orderID); 

            if (!key) {
                console.error(`No key available for PayPal order ${orderID}, product: ${productId}.`);
                // UPGRADE: Alert email now includes the specific product ID.
                await transporter.sendMail({
                    from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER, 
                    subject: `URGENT: Key Stock Alert for Product: ${productId}`,
                    text: `Payment finished for PayPal order ${orderID}, but no key could be retrieved for product ID: ${productId}. Please restock immediately.`
                });
                await orderDocRef.update({ status: 'key_unavailable', paymentStatusPaypal: paypalStatus });
                return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Payment verified, but no key available. Admin notified.' }) };
            }

            await transporter.sendMail({ /* ... email to customer ... */ });
            await orderDocRef.update({ status: 'completed', paymentStatusPaypal: paypalStatus, fulfilledAt: new Date().toISOString() });
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Payment verified and key delivered.' }) };

        } else { /* ... (handle non-completed payments) ... */ }
    } catch (error) { /* ... (handle errors) ... */ }
};
