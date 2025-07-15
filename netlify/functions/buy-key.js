// netlify/functions/buy-key.js
// This function handles direct digital key purchases (not tied to a specific payment gateway flow).

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
        console.log("Firebase Admin SDK initialized in buy-key.");
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK in buy-key:", e);
    }
}
const db = getFirestore(); // Get Firestore instance

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

    const { email, productId, amount, currency } = JSON.parse(event.body); // Added productId, amount, currency for order record

    if (!email || !productId || !amount || !currency) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ error: "Missing required fields for direct purchase." }) 
        };
    }

    try {
        const orderId = `DIRECT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; 

        // Save order details to Firestore
        const ordersRef = db.collection('orders');
        await ordersRef.doc(orderId).set({
            productId: productId,
            customerEmail: email,
            amount: parseFloat(amount),
            currency: currency,
            paymentGateway: 'direct',
            status: 'completed', // Direct purchase is immediately completed
            createdAt: new Date().toISOString(),
            fulfilledAt: new Date().toISOString()
        });
        console.log(`Direct Order ${orderId} details saved to Firestore.`);

        const key = await getAndMarkKeyAsUsed(email, orderId); 

        if (key === null) {
            console.error("No digital keys available for direct purchase. Manual intervention needed.");
            await transporter.sendMail({
                from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                to: process.env.GMAIL_USER, 
                subject: `ALERT: No Key Available for Direct Purchase`,
                text: `A direct key purchase attempt was made by ${email}, but no digital key could be retrieved from inventory. Manual fulfillment required.`
            });
            // Update order status to 'key_unavailable'
            await ordersRef.doc(orderId).update({ status: 'key_unavailable', updatedAt: new Date().toISOString() });
            return { 
                statusCode: 200, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ key: "Sorry, no keys available right now. Admin has been notified." }) 
            };
        }

        await transporter.sendMail({
            from: `"KeyZone" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your Digital Key',
            text: `Thank you for your purchase!\n\nHere is your key: ${key}\n\nIf you have any questions, please reply to this email.`
        });

        console.log(`Digital key sent to ${email} for direct purchase.`);

        return { 
            statusCode: 200, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ key }) 
        };

    } catch (err) {
        console.error('Error in buy-key function:', err);
        // Attempt to update order status to error
        const orderId = JSON.parse(event.body).orderId || `DIRECT-ERROR-${Date.now()}`;
        const ordersRef = db.collection('orders');
        await ordersRef.doc(orderId).update({ status: 'error', errorDetails: err.message, updatedAt: new Date().toISOString() }).catch(e => console.error("Failed to update order status on error:", e));

        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ error: "Server error", details: err.message }) 
        };
    }
};
