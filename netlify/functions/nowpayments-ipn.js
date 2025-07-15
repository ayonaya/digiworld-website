// netlify/functions/nowpayments-ipn.js
// This function handles Instant Payment Notifications (IPN) from NowPayments.

const crypto = require('crypto');
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
        console.log("Firebase Admin SDK initialized in nowpayments-ipn.");
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK in nowpayments-ipn:", e);
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

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const signature = event.headers['x-nowpayments-sig'];
    const rawBody = event.body; 

    const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

    if (!signature) {
        console.warn('IPN received without x-nowpayments-sig header.');
        return { statusCode: 400, body: 'Bad Request: Missing signature' };
    }

    if (!NOWPAYMENTS_IPN_SECRET) {
        console.error("NOWPAYMENTS_IPN_SECRET is not set. Cannot verify IPN signature.");
        return { statusCode: 500, body: 'Server Error: IPN secret not configured' };
    }

    const hash = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
                       .update(rawBody)
                       .digest('hex');

    if (signature !== hash) {
        console.warn('IPN signature mismatch. Possible fraud attempt. Received:', signature, 'Calculated:', hash);
        return { statusCode: 403, body: 'Forbidden: Invalid signature' };
    }

    let ipnData;
    try {
        ipnData = JSON.parse(rawBody);
    } catch (e) {
        console.error('Error parsing IPN body as JSON:', e);
        return { statusCode: 400, body: 'Bad Request: Invalid JSON body' };
    }

    console.log('Verified IPN received from NowPayments:', ipnData);

    const { payment_status, order_id, actually_paid, pay_currency, price_amount, price_currency, payment_id } = ipnData;

    try {
        // --- Retrieve order details from Firestore using order_id ---
        const orderDocRef = db.collection('orders').doc(order_id);
        const orderDoc = await orderDocRef.get();

        if (!orderDoc.exists) {
            console.error(`Order ID ${order_id} not found in Firestore. Cannot fulfill.`);
            return { statusCode: 200, body: 'Order not found for fulfillment.' }; // Return 200 to avoid NowPayments retries
        }

        const orderDetails = orderDoc.data();
        const customerEmail = orderDetails.customerEmail;
        const productId = orderDetails.productId; // You might use this for specific key logic

        console.log(`Retrieved order details from Firestore: Customer: ${customerEmail}, Product: ${productId}`);
        // --- End Firestore retrieval ---

        if (payment_status === 'finished') {
            console.log(`Payment FINISHED for Order ID: ${order_id}, Payment ID: ${payment_id}`);

            const key = await getAndMarkKeyAsUsed(customerEmail, order_id); 

            if (!key) {
                console.error(`No digital key available for order ${order_id}. Manual intervention needed.`);
                await transporter.sendMail({
                    from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER, 
                    subject: `ALERT: No Key Available for Crypto Order ${order_id}`,
                    text: `Payment finished for order ${order_id} (Payment ID: ${payment_id}), but no digital key could be retrieved from inventory for email ${customerEmail}. Manual fulfillment required.`
                });
                return { statusCode: 200, body: 'IPN processed, but no key available for delivery.' }; 
            }

            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: customerEmail,
                subject: `Your DigiWorld Digital License for Order ${order_id} (Crypto Payment)`,
                text: `Thank you for your purchase from DigiWorld!\n\nYour payment for ${price_amount} ${price_currency} (${actually_paid} ${pay_currency}) has been successfully processed via crypto.\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
            });

            console.log(`Digital key for order ${order_id} sent to ${customerEmail} via crypto payment.`);

            // Update order status in Firestore to 'completed'
            await orderDocRef.update({ status: 'completed', paymentStatusNowPayments: payment_status, fulfilledAt: new Date().toISOString() });
            console.log(`Order ${order_id} status updated to completed in Firestore.`);

        } else if (payment_status === 'partially_paid') {
            console.warn(`Payment PARTIALLY PAID for Order ID: ${order_id}. Amount paid: ${actually_paid} ${pay_currency}.`);
            await orderDocRef.update({ status: 'partially_paid', paymentStatusNowPayments: payment_status, updatedAt: new Date().toISOString() });
        } else if (payment_status === 'waiting' || payment_status === 'confirming') {
            console.log(`Payment status for Order ID: ${order_id} is ${payment_status}. Waiting for completion.`);
            await orderDocRef.update({ status: 'pending', paymentStatusNowPayments: payment_status, updatedAt: new Date().toISOString() });
        } else {
            console.log(`Payment status for Order ID: ${order_id} is ${payment_status}. No action taken.`);
            await orderDocRef.update({ status: payment_status, paymentStatusNowPayments: payment_status, updatedAt: new Date().toISOString() });
        }

        return { statusCode: 200, body: 'IPN received and processed' };

    } catch (error) {
        console.error('Error processing NowPayments IPN:', error);
        return { statusCode: 200, body: 'Server Error: Failed to process IPN internally' };
    }
};
