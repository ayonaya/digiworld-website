// netlify/functions/create-nowpayment-order.js
const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productId, email, amount, currency, payCurrency } = JSON.parse(event.body);
        const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

        if (!productId || !email || !amount || !currency || !payCurrency) {
            console.error("Validation Error: Missing required fields.", { productId, email, amount, currency, payCurrency });
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

        const paymentData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            pay_currency: payCurrency,
            order_id: `DIGIWORLD-${productId}-${Date.now()}`,
            order_description: `Purchase of ${productId}`,
        };

        const headers = {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
        };

        console.log("Attempting to create NowPayments payment with data:", paymentData);
        const response = await axios.post('https://api.nowpayments.io/v1/payment', paymentData, { headers });
        console.log("Successfully received response from NowPayments:", response.data);

        // --- FIX: Handle cases where pay_url is missing ---
        let redirectionUrl = response.data.pay_url;

        // If pay_url is missing, but we have a purchase_id, construct the URL manually.
        if (!redirectionUrl && response.data.purchase_id) {
            console.log("pay_url was missing. Constructing URL from purchase_id.");
            redirectionUrl = `https://nowpayments.io/payment/${response.data.purchase_id}`;
        }

        if (!redirectionUrl) {
            console.error("Critical Error: Could not determine redirection URL from NowPayments response.", response.data);
            throw new Error("Failed to get redirection URL from NowPayments.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ payUrl: redirectionUrl }),
        };

    } catch (error) {
        console.error('Error creating NowPayments order:', error);
        const errorResponse = error.response ? error.response.data : { message: error.message };
        console.error('Detailed Error:', errorResponse);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to create NowPayments order.',
                error: errorResponse
            }),
        };
    }
};
