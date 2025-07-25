// netlify/functions/get-confirmation-id.js
const { db } = require('./firebase-admin');
const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    try {
        const { orderId, installationId, activationToken } = JSON.parse(event.body);
        const apiKey = process.env.GETCID_API_KEY;

        // --- FIXED: Corrected Validation Logic ---
        if (!apiKey) {
            console.error('GETCID_API_KEY is not set.');
            return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Activation service is not configured.' }) };
        }
        if (!installationId) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Installation ID is required.' }) };
        }
        if (!orderId && !activationToken) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Either an Order ID or an Activation Token is required.' }) };
        }
        // --- END OF FIX ---

        // --- Token-based activation path ---
        if (activationToken) {
            const tokenRef = db.collection('activationTokens').doc(activationToken.trim());
            const tokenDoc = await tokenRef.get();

            if (!tokenDoc.exists || tokenDoc.data().status !== 'available') {
                return { statusCode: 403, body: JSON.stringify({ success: false, message: 'This activation token is invalid or has already been used.' }) };
            }
            await tokenRef.update({ status: 'used', usedAt: new Date().toISOString() });
        } 
        // --- Order-based activation path ---
        else if (orderId) {
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
            await orderRef.update({ cidRetrievalCount: (timesUsed + 1) });
        }

        // --- Call External API ---
        const apiUrl = `https://key.getcidapi.com/api/get_cid?api_key=${apiKey}&iid=${installationId.trim()}&just_check=0`;
        const response = await axios.get(apiUrl);
        
        let confirmationId = response.data.result || JSON.stringify(response.data);
        if (typeof confirmationId === 'string' && (confirmationId.toLowerCase().includes('error') || confirmationId.toLowerCase().includes('invalid'))) {
            throw new Error(`Activation API reported an error: ${confirmationId}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data: confirmationId })
        };

    } catch (error) {
        console.error('Error in get-confirmation-id function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
};