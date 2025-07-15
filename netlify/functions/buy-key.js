// netlify/functions/buy-key.js
const nodemailer = require('nodemailer');
const { getAndMarkKeyAsUsed } = require('./firestore-key-manager'); 
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// --- Initialization (No changes needed) ---
if (!getApps().length) { /* ... */ }
const db = getFirestore();
let transporter = nodemailer.createTransport({ /* ... */ });

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') { /* ... */ }

    const { email, productId, amount, currency } = JSON.parse(event.body); 
    if (!email || !productId || !amount || !currency) { /* ... */ }

    try {
        const orderId = `DIRECT-${Date.now()}`; 
        const orderDocRef = db.collection('orders').doc(orderId);
        await orderDocRef.set({ /* ... */ });
        
        // UPGRADE: Pass the 'productId' to the key manager.
        const key = await getAndMarkKeyAsUsed(productId, email, orderId); 

        if (key === null) {
            console.error(`No key available for direct purchase, product: ${productId}.`);
            // UPGRADE: Alert email now includes the specific product ID.
            await transporter.sendMail({
                from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                to: process.env.GMAIL_USER, 
                subject: `URGENT: Key Stock Alert for Product: ${productId}`,
                text: `A direct purchase was made for product ID ${productId}, but no key was available. Manual fulfillment required for order ${orderId}.`
            });
            await orderDocRef.update({ status: 'key_unavailable' });
            return { statusCode: 200, body: JSON.stringify({ key: "Sorry, no keys available. Admin notified." }) };
        }

        await transporter.sendMail({ /* ... email to customer ... */ });
        console.log(`Digital key sent to ${email} for direct purchase.`);
        return { statusCode: 200, body: JSON.stringify({ key }) };

    } catch (err) { /* ... (handle errors) ... */ }
};
