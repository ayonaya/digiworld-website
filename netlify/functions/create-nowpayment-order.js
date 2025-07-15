// netlify/functions/create-nowpayment-order.js
// This function handles the request from your frontend to create a NowPayments order.

const axios = require('axios');

exports.handler = async (event, context) => {
    // Ensure the request is a POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Parse the request body to get payment details
    // Now expecting 'payCurrency' from the frontend
    const { productId, email, amount, currency, payCurrency } = JSON.parse(event.body);

    // Retrieve API keys from Netlify Environment Variables
    const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
    const NOWPAYMENTS_API_BASE_URL = 'https://api.nowpayments.io/v1';

    // Validate required fields, including payCurrency
    if (!productId || !email || !amount || !currency || !payCurrency) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: 'Missing required fields for payment, including payCurrency.' }) 
        };
    }

    // Check if NowPayments API key is configured
    if (!NOWPAYMENTS_API_KEY) {
        console.error("NowPayments API key is not set. Please check your Netlify environment variables.");
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: "Payment service not configured." }) 
        };
    }

    try {
        // Generate a unique order ID
        const order_id = `DIGIWORLD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Construct the IPN Callback URL for NowPayments.
        const ipn_callback_url = `${process.env.URL}/.netlify/functions/nowpayments-ipn`; 

        // Prepare the payment data payload for NowPayments API
        const paymentData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            pay_currency: payCurrency, // <--- NOW DYNAMIC
            order_id: order_id,
            order_description: `Digital License for Product ID: ${productId}`,
            ipn_callback_url: ipn_callback_url,
            success_url: `https://${process.env.URL}/payment-success.html?order_id=${order_id}`,
            cancel_url: `https://${process.env.URL}/payment-cancelled.html?order_id=${order_id}`,
            // You might also want to pass email and productId in ipn_extra_data
            // to retrieve them easily in the IPN handler:
            ipn_extra_data: { customerEmail: email, productId: productId } 
        };

        // Set up request headers, including your API key
        const headers = {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
        };

        // Make the API call to NowPayments
        const response = await axios.post(`${NOWPAYMENTS_API_BASE_URL}/payment`, paymentData, { headers });

        console.log('Full NowPayments API response data:', response.data); // Keep this for debugging

        console.log(`NowPayments payment created: ${response.data.payment_id} for order ${order_id}`);

        // Return the payment URL (payUrl) to the frontend for redirection
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'NowPayments order created successfully',
                paymentId: response.data.payment_id,
                payUrl: response.data.pay_url, // This is the field we expect to be present
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
