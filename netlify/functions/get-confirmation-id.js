// netlify/functions/get-confirmation-id.js
const { db } = require('./firebase-admin'); // We need our database connection
const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { orderId, installationId } = JSON.parse(event.body);
        const apiKey = process.env.GETCID_API_KEY;

        // --- 1. Basic Input Validation ---
        if (!apiKey) {
            console.error('GETCID_API_KEY is not set.');
            return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Activation service is not configured.' }) };
        }
        if (!orderId || !installationId) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Order ID and Installation ID are required.' }) };
        }

        // --- 2. Order Verification and Rate-Limiting ---
        const orderRef = db.collection('orders').doc(orderId.trim());
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Order ID not found. Please check the ID from your confirmation email.' }) };
        }

        const orderData = orderDoc.data();

        // Ensure the order was successfully completed
        if (orderData.status !== 'completed' && orderData.status !== 'partially_fulfilled') {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'This order is not marked as complete. Please contact support.' }) };
        }

        // Calculate the total number of keys purchased in this order
        const totalKeysPurchased = orderData.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Get the number of times this service has already been used for this order
        const timesUsed = orderData.cidRetrievalCount || 0;

        if (timesUsed >= totalKeysPurchased) {
            return { statusCode: 429, body: JSON.stringify({ success: false, message: 'Usage limit reached. You have already retrieved Confirmation IDs for all keys in this order.' }) };
        }

        // --- 3. Call the External API ---
        const apiUrl = `https://key.getcidapi.com/api/get_cid?api_key=${apiKey}&iid=${installationId.trim()}&just_check=0`;
        const response = await axios.get(apiUrl, {
            validateStatus: status => status >= 200 && status < 500
        });
        
        // Check if the external API itself returned an error-like message
        if (typeof response.data === 'string' && (response.data.toLowerCase().includes('error') || response.data.toLowerCase().includes('invalid'))) {
            throw new Error(`Activation API reported an error: ${response.data}`);
        }

        // --- 4. Update the Usage Count in Firestore ---
        // We use an atomic increment to safely update the count
        await orderRef.update({
            cidRetrievalCount: (timesUsed + 1)
        });

        // --- 5. Return the Confirmation ID ---
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, data: response.data })
        };

    } catch (error) {
        console.error('Error in get-confirmation-id function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
};