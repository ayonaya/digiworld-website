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

        // Data for creating an INVOICE, not a payment.
        const invoiceData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            order_id: `DIGIWORLD-${productId}-${Date.now()}`,
            order_description: `Purchase of ${productId} for ${email}`,
            ipn_callback_url: `https://YOUR_SITE_URL/.netlify/functions/nowpayments-ipn`, // Optional but recommended
            success_url: `https://YOUR_SITE_URL/payment-success.html`, // Optional
            cancel_url: `https://YOUR_SITE_URL/payment-cancelled.html` // Optional
        };

        const headers = {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
        };

        console.log("Attempting to create NowPayments INVOICE with data:", invoiceData);

        // FIX: Using the /v1/invoice endpoint to get a hosted payment page
        const response = await axios.post('https://api.nowpayments.io/v1/invoice', invoiceData, { headers });

        console.log("Successfully received INVOICE response from NowPayments:", response.data);

        // The response from the invoice endpoint contains an "invoice_url"
        const invoiceUrl = response.data.invoice_url;

        if (!invoiceUrl) {
            console.error("Critical Error: Could not get invoice_url from NowPayments response.", response.data);
            throw new Error("Failed to get redirection URL from NowPayments.");
        }

        return {
            statusCode: 200,
            // Send the correct invoice URL back to the frontend
            body: JSON.stringify({ invoice_url: invoiceUrl }),
        };

    } catch (error) {
        console.error('Error creating NowPayments invoice:', error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to create NowPayments invoice.',
                error: error.response ? error.response.data : { message: error.message }
            }),
        };
    }
};
