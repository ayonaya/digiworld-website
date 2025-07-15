// netlify/functions/create-nowpayment-order.js
// This function handles the request from your frontend to create a NowPayments order.

const axios = require('axios');
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
        console.log("Firebase Admin SDK initialized in create-nowpayment-order.");
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK in create-nowpayment-order:", e);
    }
}
const db = getFirestore();

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { productId, email, amount, currency, payCurrency } = JSON.parse(event.body);

    const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
    const NOWPAYMENTS_API_BASE_URL = 'https://api.nowpayments.io/v1';

    if (!productId || !email || !amount || !currency || !payCurrency) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: 'Missing required fields for payment, including payCurrency.' }) 
        };
    }

    if (!NOWPAYMENTS_API_KEY) {
        console.error("NowPayments API key is not set. Please check your Netlify environment variables.");
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: "Payment service not configured." }) 
        };
    }

    try {
        const order_id = `DIGIWORLD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Corrected ipn_callback_url (removed double https://)
        const ipn_callback_url = `${process.env.URL}/.netlify/functions/nowpayments-ipn`; 

        const paymentData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            pay_currency: payCurrency, // Dynamic payCurrency (e.g., 'usdt', 'eth')
            order_id: order_id,
            order_description: `Digital License for Product ID: ${productId}`,
            ipn_callback_url: ipn_callback_url,
            success_url: `https://${process.env.URL}/payment-success.html?order_id=${order_id}`,
            cancel_url: `https://${process.env.URL}/payment-cancelled.html?order_id=${order_id}`,
            // Removed ipn_extra_data as NowPayments does not allow it in this endpoint.
        };

        const headers = {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
        };

        const response = await axios.post(`${NOWPAYMENTS_API_BASE_URL}/payment`, paymentData, { headers });

        console.log('Full NowPayments API response data:', response.data); 

        // IMPORTANT: Check if pay_url is present in the response before proceeding
        if (!response.data.pay_url) {
            console.error('NowPayments did not return pay_url in response:', response.data);
            return {
                statusCode: 500, // Return 500 to indicate an issue to the frontend
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'Failed to get redirection URL from NowPayments. PayURL missing.',
                    details: response.data // Include details for debugging
                }),
            };
        }

        // --- Store initial order details in Firestore ---
        const ordersRef = db.collection('orders');
        await ordersRef.doc(order_id).set({
            productId: productId,
            customerEmail: email,
            amount: parseFloat(amount),
            currency: currency,
            payCurrency: payCurrency,
            paymentId: response.data.payment_id,
            payAddress: response.data.pay_address, // Store the crypto address
            payUrl: response.data.pay_url, // Store the payUrl for reference
            status: 'initiated', // Initial status
            createdAt: new Date().toISOString()
        });
        console.log(`Order ${order_id} details saved to Firestore.`);
        // --- End Firestore save ---

        console.log(`NowPayments payment created: ${response.data.payment_id} for order ${order_id}`);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'NowPayments order created successfully',
                paymentId: response.data.payment_id,
                payUrl: response.data.pay_url,
                order_id: order_id 
            }),
        };

    } catch (error) {
        console.error('Error creating NowPayments order:', error.response ? error.response.data : error.message);
        return {
            statusCode: error.response && error.response.status ? error.response.status : 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Failed to create NowPayments order.',
                error: error.response ? error.response.data : error.message
            }),
        };
    }
};
