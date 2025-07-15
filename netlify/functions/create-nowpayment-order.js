// netlify/functions/create-nowpayment-order.js
// This function handles the request from your frontend to create a NowPayments order.

const axios = require('axios');

exports.handler = async (event, context) => {
    // Ensure the request is a POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Parse the request body to get payment details
    const { productId, email, amount, currency } = JSON.parse(event.body);

    // Retrieve API keys from Netlify Environment Variables
    const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
    const NOWPAYMENTS_API_BASE_URL = 'https://api.nowpayments.io/v1';

    // Validate required fields
    if (!productId || !email || !amount || !currency) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: 'Missing required fields for payment.' }) 
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
        // FIX: Removed the redundant 'https://' prefix. process.env.URL already includes it.
        const ipn_callback_url = `${process.env.URL}/.netlify/functions/nowpayments-ipn`; 

        // Prepare the payment data payload for NowPayments API
        const paymentData = {
            price_amount: parseFloat(amount),
            price_currency: currency,
            pay_currency: 'btc', // You might make this dynamic if users can choose crypto
            order_id: order_id,
            order_description: `Digital License for Product ID: ${productId}`,
            ipn_callback_url: ipn_callback_url,
            success_url: `https://${process.env.URL}/payment-success.html?order_id=${order_id}`,
            cancel_url: `https://${process.env.URL}/payment-cancelled.html?order_id=${order_id}`,
            // Consider adding ipn_extra_data here to pass email and productId to the IPN handler
            // For example:
            // ipn_extra_data: { customerEmail: email, productId: productId } 
        };

        // Set up request headers, including your API key
        const headers = {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
        };

        // Make the API call to NowPayments
        const response = await axios.post(`${NOWPAYMENTS_API_BASE_URL}/payment`, paymentData, { headers });

        // --- NEW DEBUGGING LOG ---
        console.log('Full NowPayments API response data:', response.data);
        // --- END NEW DEBUGGING LOG ---

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
        // Log and return detailed error information
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
