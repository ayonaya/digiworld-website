// /netlify/functions/get-products.js
// This function is now much simpler. It just imports and returns the shared product data.
const { products } = require('./_data/products-data.js');

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Allows your frontend to call this function
    },
    body: JSON.stringify({ success: true, products: products }),
  };
};

// ---

// /netlify/functions/verify-paypal-payment.js
const axios = require('axios');
const nodemailer = require('nodemailer');
const { getAndMarkKeyAsUsed } = require('./firestore-key-manager');
const { db } = require('./firebase-admin'); // UPDATED: Use centralized db
const { products } = require('./_data/products-data'); // UPDATED: Import products for price check

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

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // UPDATED: We no longer trust the 'amount' from the client.
    const { orderID, email, productId, currency } = JSON.parse(event.body);

    // --- SECURITY FIX: Server-Side Price Verification ---
    const product = products.find(p => p.id === productId);
    if (!product) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Product not found.' }) };
    }
    const serverAmount = product.price[currency];
    if (typeof serverAmount === 'undefined') {
        return { statusCode: 400, body: JSON.stringify({ message: 'Currency not supported for this product.' }) };
    }
    // --- End of Security Fix ---

    try {
        const orderDocRef = db.collection('orders').doc(orderID);
        // Use the SECURE server-side amount when creating the order record
        await orderDocRef.set({
            productId: productId,
            customerEmail: email,
            amount: serverAmount, // Using the verified amount
            currency: currency,
            paymentGateway: 'paypal',
            status: 'initiated',
            createdAt: new Date().toISOString()
        }, { merge: true });

        // The rest of your PayPal logic remains the same...
        // It will capture the payment, get the key, and send the email.
        // ...
    } catch (error) {
        console.error('Error verifying PayPal payment:', error.response ? error.response.data : error.message);
        // ... your error handling ...
    }
};

// NOTE: Remember to apply the same centralized db and price-check logic to your
// other payment functions like 'create-nowpayment-order.js' and 'buy-key.js'.
// All other functions (`get-reviews.js`, `submit-review.js`, etc.) should also
// be updated to use `const { db } = require('./firebase-admin');` instead of
// initializing Firebase themselves.
