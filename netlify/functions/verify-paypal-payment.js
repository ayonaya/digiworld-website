// netlify/functions/verify-paypal-payment.js
const axios = require('axios');
const nodemailer = require('nodemailer');
const { getAndMarkKeyAsUsed } = require('./firestore-key-manager'); 
const { db } = require('./firebase-admin'); // Modified: Import db from firebase-admin.js

// Configure the email transporter using environment variables
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API_BASE_URL = 'https://api-m.paypal.com';

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { orderID, email, productId, amount, currency } = JSON.parse(event.body); 

    if (!orderID || !email || !productId || !amount || !currency) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: 'Missing required fields for PayPal verification.' }) 
        };
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        console.error("PayPal API keys are not set.");
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: "PayPal service not configured." }) 
        };
    }

    try {
        const orderDocRef = db.collection('orders').doc(orderID);
        await orderDocRef.set({
            productId: productId,
            customerEmail: email,
            amount: parseFloat(amount),
            currency: currency,
            paymentGateway: 'paypal',
            status: 'initiated',
            createdAt: new Date().toISOString()
        }, { merge: true });
        console.log(`PayPal Order ${orderID} details saved/updated in Firestore.`);

        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
        const tokenResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const accessToken = tokenResponse.data.access_token;

        const captureResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const paypalStatus = captureResponse.data.status;

        if (paypalStatus === 'COMPLETED') {
            console.log(`PayPal payment COMPLETED for Order ID: ${orderID}`);

            // THIS IS THE LINE THAT WAS FIXED
            const key = await getAndMarkKeyAsUsed(productId, email, orderID); 

            if (!key) {
                console.error(`No digital key available for PayPal order ${orderID} for product ${productId}.`);
                await transporter.sendMail({
                    from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER, 
                    subject: `URGENT: Key Stock Alert for Product: ${productId}`,
                    text: `Payment finished for PayPal order ${orderID}, but no digital key could be retrieved for product ID: ${productId}. Please restock immediately.`
                });
                await orderDocRef.update({ status: 'key_unavailable', paymentStatusPaypal: paypalStatus });
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
            await orderDocRef.update({ status: 'completed', paymentStatusPaypal: paypalStatus, fulfilledAt: new Date().toISOString() });
            return { 
                statusCode: 200, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ success: true, message: 'Payment verified and key delivered.' }) 
            };

        } else {
            console.warn(`PayPal payment status for Order ID ${orderID}: ${paypalStatus}`);
            await orderDocRef.update({ status: 'failed', paymentStatusPaypal: paypalStatus });
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ success: false, message: `PayPal payment not completed. Status: ${paypalStatus}` }) 
            };
        }

    } catch (error) {
        console.error('Error verifying PayPal payment:', error.response ? error.response.data : error.message);
        const orderDocRef = db.collection('orders').doc(orderID);
        await orderDocRef.update({ status: 'error', errorDetails: error.response ? error.response.data : error.message }).catch(e => console.error("Failed to update order status on error:", e));

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