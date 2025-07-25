// netlify/functions/get-confirmation-id.js
const { db } = require('./firebase-admin');
const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    try {
        // ... (Input validation and order verification logic is unchanged)
        const { orderId, installationId } = JSON.parse(event.body);
        const apiKey = process.env.GETCID_API_KEY;

        if (!apiKey || !orderId || !installationId) {
             return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing required data.' }) };
        }

        const orderRef = db.collection('orders').doc(orderId.trim());
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Order ID not found.' }) };
        }

        const orderData = orderDoc.data();

        if (orderData.status !== 'completed' && orderData.status !== 'partially_fulfilled') {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'This order is not marked as complete.' }) };
        }

        let totalKeysPurchased = (orderData.cart && Array.isArray(orderData.cart)) ? orderData.cart.reduce((sum, item) => sum + item.quantity, 0) : 1;
        const timesUsed = orderData.cidRetrievalCount || 0;

        if (timesUsed >= totalKeysPurchased) {
            return { statusCode: 429, body: JSON.stringify({ success: false, message: 'Usage limit reached for this order.' }) };
        }

        // --- NEW: Improved External API Call with Better Error Handling ---
        const apiUrl = `https://key.getcidapi.com/api/get_cid?api_key=${apiKey}&iid=${installationId.trim()}&just_check=0`;
        
        let apiResponse;
        try {
            apiResponse = await axios.get(apiUrl);
        } catch (apiError) {
            // This catches network errors or non-2xx responses from the external API
            if (apiError.response && apiError.response.status === 429) {
                throw new Error("Too many requests sent to the activation server. Please wait a few minutes and try again.");
            }
            throw new Error("Could not connect to the activation server. Please try again later.");
        }

        let confirmationId = apiResponse.data;
        if (typeof apiResponse.data === 'object' && apiResponse.data !== null) {
            confirmationId = apiResponse.data.result || JSON.stringify(apiResponse.data);
        }
        
        if (typeof confirmationId === 'string' && (confirmationId.toLowerCase().includes('error') || confirmationId.toLowerCase().includes('invalid'))) {
            throw new Error(`Activation API reported an error: ${confirmationId}`);
        }
        // --- END OF NEW LOGIC ---

        await orderRef.update({ cidRetrievalCount: (timesUsed + 1) });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data: confirmationId })
        };

    } catch (error) {
        console.error('Error in get-confirmation-id function:', error);
        // Ensure we always return a valid JSON error
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
};