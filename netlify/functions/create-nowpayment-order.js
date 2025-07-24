// netlify/functions/create-nowpayment-order.js
const axios = require('axios');
const { db } = require('./firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // FIX: Now correctly accepts a 'cart' array
        const { cart, email, amount, currency } = JSON.parse(event.body);
        const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

        // FIX: Updated validation to check for the cart
        if (!cart || cart.length === 0 || !email || !amount || !currency) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ message: 'Missing one or more required fields.' }) 
            };
        }

        if (!NOWPAYMENTS_API_KEY) {
            return { 
                statusCode: 500, 
                body: JSON.stringify({ message: "Payment service is not configured on the server." }) 
            };
        }

        const orderId = `DIGIWORLD-NP-${Date.now()}`;
        const orderDocRef = db.collection('orders').doc(orderId);
        await orderDocRef.set({
            cart: cart, // Save the full cart
            customerEmail: email,
            totalAmount: parseFloat(amount),
            currency: currency,
            paymentGateway: 'nowpayments',
            status: 'initiated',
            createdAt: new Date().toISOString()
        });

        const orderDescription = `DigiWorld purchase of ${cart.length} item(s) for ${email}`;

        const invoiceData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            order_id: orderId,
            order_description: orderDescription,
        };

        const headers = {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
        };

        const response = await axios.post('https://api.nowpayments.io/v1/invoice', invoiceData, { headers });
        
        const invoiceUrl = response.data.invoice_url;
        if (!invoiceUrl) {
            throw new Error("Failed to get redirection URL from NowPayments.");
        }

        await orderDocRef.update({ nowPaymentsId: response.data.id });

        return {
            statusCode: 200,
            body: JSON.stringify({ invoice_url: invoiceUrl }),
        };

    } catch (error) {
        console.error('Error creating NowPayments invoice:', error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to create NowPayments invoice.' }),
        };
    }
};