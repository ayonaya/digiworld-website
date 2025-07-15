// netlify/functions/create-nowpayment-order.js
const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productId, email, amount, currency, payCurrency } = JSON.parse(event.body);
        const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

        if (!productId || !email || !amount || !currency ) {
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

        const invoiceData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            order_id: `DIGIWORLD-${productId}-${Date.now()}`,
            order_description: `Purchase of ${productId} for ${email}`,
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
