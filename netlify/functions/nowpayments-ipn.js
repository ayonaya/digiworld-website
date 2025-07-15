// netlify/functions/nowpayments-ipn.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { getAndMarkKeyAsUsed } = require('./firestore-key-manager'); 
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// --- Initialization and IPN verification (No changes needed) ---
if (!getApps().length) { /* ... */ }
const db = getFirestore();
let transporter = nodemailer.createTransport({ /* ... */ });

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') { /* ... */ }
    // ... (IPN signature verification logic) ...
    let ipnData = JSON.parse(event.body);
    const { payment_status, order_id } = ipnData;

    try {
        const orderDocRef = db.collection('orders').doc(order_id);
        const orderDoc = await orderDocRef.get();
        if (!orderDoc.exists) { /* ... */ }

        const orderDetails = orderDoc.data();
        const customerEmail = orderDetails.customerEmail;
        const productId = orderDetails.productId; // Get productId from the stored order

        if (payment_status === 'finished') {
            console.log(`Payment FINISHED for Order ID: ${order_id}`);

            // UPGRADE: Pass the 'productId' to the key manager.
            const key = await getAndMarkKeyAsUsed(productId, customerEmail, order_id); 

            if (!key) {
                console.error(`No key available for NowPayments order ${order_id}, product: ${productId}.`);
                // UPGRADE: Alert email now includes the specific product ID.
                await transporter.sendMail({
                    from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER, 
                    subject: `URGENT: Key Stock Alert for Product: ${productId}`,
                    text: `Payment finished for NowPayments order ${order_id}, but no key could be retrieved for product ID: ${productId}. Please restock immediately.`
                });
                await orderDocRef.update({ status: 'key_unavailable', paymentStatusNowPayments: payment_status });
                return { statusCode: 200, body: 'IPN processed, but no key available.' }; 
            }

            await transporter.sendMail({ /* ... email to customer ... */ });
            await orderDocRef.update({ status: 'completed', paymentStatusNowPayments: payment_status, fulfilledAt: new Date().toISOString() });
        
        } else { /* ... (handle other payment statuses) ... */ }
        return { statusCode: 200, body: 'IPN received and processed' };
    } catch (error) { /* ... (handle errors) ... */ }
};
