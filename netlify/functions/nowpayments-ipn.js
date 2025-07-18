// netlify/functions/nowpayments-ipn.js
const crypto = require('crypto');
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

    // NowPayments IPN validation:
    // This is crucial for security. Do NOT skip this step.
    const signature = event.headers['x-nowpayments-signature'];
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET; // Your IPN secret from NowPayments.io

    if (!ipnSecret) {
        console.error('NOWPAYMENTS_IPN_SECRET is not set in environment variables.');
        return { statusCode: 500, body: 'IPN secret not configured.' };
    }

    const hmac = crypto.createHmac('sha512', ipnSecret);
    const digested = Buffer.from(hmac.update(event.body).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (!crypto.timingSafeEqual(digested, signatureBuffer)) {
        console.warn('IPN signature mismatch. Possible tampering attempt.');
        return { statusCode: 403, body: 'Forbidden: Invalid IPN signature.' };
    }

    let ipnData;
    try {
        ipnData = JSON.parse(event.body);
    } catch (parseError) {
        console.error('Error parsing IPN data:', parseError);
        return { statusCode: 400, body: 'Invalid JSON payload.' };
    }

    const { payment_status, order_id } = ipnData;

    try {
        const orderDocRef = db.collection('orders').doc(order_id);
        const orderDoc = await orderDocRef.get();
        
        if (!orderDoc.exists) {
            console.warn(`Order ID ${order_id} not found in Firestore.`);
            return { statusCode: 404, body: 'Order not found.' };
        }

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

            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: customerEmail,
                subject: `Your DigiWorld Digital License for Order ${order_id} (NowPayments)`,
                text: `Thank you for your purchase from DigiWorld!\n\nYour NowPayments payment for order ${order_id} has been successfully processed.\n\nHere is your digital license key: ${key}\n\nIf you have any questions, please reply to this email.`
            });
            console.log(`Digital key sent to ${customerEmail} for NowPayments order ${order_id}.`);

            await orderDocRef.update({ status: 'completed', paymentStatusNowPayments: payment_status, fulfilledAt: new Date().toISOString() });
        
        } else if (payment_status === 'failed' || payment_status === 'canceled' || payment_status === 'refunded') {
            console.log(`Payment ${payment_status} for Order ID: ${order_id}`);
            await orderDocRef.update({ status: payment_status, paymentStatusNowPayments: payment_status });
        } else {
            console.log(`NowPayments IPN for Order ID ${order_id} with status: ${payment_status}`);
            await orderDocRef.update({ paymentStatusNowPayments: payment_status });
        }

        return { statusCode: 200, body: 'IPN received and processed' };

    } catch (error) {
        console.error('Error processing NowPayments IPN:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred during IPN processing.' }),
        };
    }
};