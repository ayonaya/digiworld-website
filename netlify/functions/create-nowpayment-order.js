// netlify/functions/create-nowpayment-order.js
const axios = require('axios');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// Initialize Firebase Admin SDK only once
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized in create-nowpayment-order.");
    } catch (e) {
        console.error("Failed to initialize Firebase Admin SDK in create-nowpayment-order:", e);
    }
}
const db = getFirestore();

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productId, email, amount, currency } = JSON.parse(event.body);
        const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

        if (!productId || !email || !amount || !currency) {
            console.error("Validation Error: Missing required fields.", { productId, email, amount, currency });
            return { 
                statusCode: 400, 
                body: JSON.stringify({ message: 'Missing one or more required fields.' }) 
            };
        }

        if (!NOWPAYMENTS_API_KEY) {
            console.error("Configuration Error: NOWPAYMENTS_API_KEY is not set in environment variables.");
            return { 
                statusCode: 500, 
                body: JSON.stringify({ message: "Payment service is not configured on the server." }) 
            };
        }

        // --- FIX: Create and save the order to Firestore BEFORE creating the payment ---
        const orderId = `DIGIWORLD-${productId}-${Date.now()}`;
        const orderDocRef = db.collection('orders').doc(orderId);
        await orderDocRef.set({
            productId: productId,
            customerEmail: email,
            amount: parseFloat(amount),
            currency: currency,
            paymentGateway: 'nowpayments',
            status: 'initiated', // Initial status
            createdAt: new Date().toISOString()
        });
        console.log(`NowPayments Order ${orderId} details saved to Firestore.`);
        // --- End Firestore Save ---

        const invoiceData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            order_id: orderId, // Use the same orderId for NowPayments
            order_description: `Purchase of ${productId} for ${email}`,
            // IMPORTANT: Set your IPN callback URL in your NowPayments account settings
            // ipn_callback_url: 'https://YOUR_SITE/.netlify/functions/nowpayments-ipn'
        };

        const headers = {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
        };

        console.log("Attempting to create NowPayments INVOICE with data:", invoiceData);

        const response = await axios.post('https://api.nowpayments.io/v1/invoice', invoiceData, { headers });

        console.log("Successfully received INVOICE response from NowPayments:", response.data);

        const invoiceUrl = response.data.invoice_url;

        if (!invoiceUrl) {
            console.error("Critical Error: Could not get invoice_url from NowPayments response.", response.data);
            throw new Error("Failed to get redirection URL from NowPayments.");
        }

        // Update the order with the payment ID from NowPayments
        await orderDocRef.update({ nowPaymentsId: response.data.id });

        return {
            statusCode: 200,
            body: JSON.stringify({ invoice_url: invoiceUrl }),
        };

    } catch (error) {
        console.error('Error creating NowPayments invoice:', error.response ? error.response.data : error.message);
        const errorResponse = error.response ? error.response.data : { message: error.message };
        console.error('Detailed Error:', errorResponse);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to create NowPayments invoice.',
                error: errorResponse
            }),
        };
    }
};
