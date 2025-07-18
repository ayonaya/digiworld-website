// netlify/functions/buy-key.js
const nodemailer = require('nodemailer');
const { getAndMarkKeyAsUsed } = require('./firestore-key-manager'); 
const { db } = require('./firebase-admin'); // Modified: Import db from firebase-admin.js

// Configure the email transporter using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { email, productId, amount, currency } = JSON.parse(event.body); 
    if (!email || !productId || !amount || !currency) {
        return { 
            statusCode: 400, 
            body: JSON.stringify({ message: 'Missing one or more required fields.' }) 
        };
    }

    try {
        const orderId = `DIRECT-${Date.now()}`; 
        const orderDocRef = db.collection('orders').doc(orderId);
        await orderDocRef.set({
            productId: productId,
            customerEmail: email,
            amount: parseFloat(amount),
            currency: currency,
            paymentGateway: 'direct',
            status: 'initiated',
            createdAt: new Date().toISOString()
        });
        
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

        await transporter.sendMail({
            from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `Your DigiWorld Digital License for Order ${orderId}`,
            text: `Thank you for your purchase from DigiWorld!\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
        });
        console.log(`Digital key sent to ${email} for direct purchase.`);
        await orderDocRef.update({ status: 'completed', fulfilledAt: new Date().toISOString() });
        return { statusCode: 200, body: JSON.stringify({ key }) };

    } catch (error) {
        console.error('Error during direct key purchase:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An error occurred during direct purchase.'
            }),
        };
    }
};