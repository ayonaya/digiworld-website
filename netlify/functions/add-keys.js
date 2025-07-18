// This secure function handles adding new digital keys to the Firestore database.

const { db } = require('./firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { adminPassword, productId, keys } = JSON.parse(event.body);
        const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        // --- Security Check ---
        if (!SERVER_ADMIN_PASSWORD || adminPassword !== SERVER_ADMIN_PASSWORD) {
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized.' }) };
        }

        // --- Data Validation ---
        if (!productId || !keys) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID and keys are required.' }) };
        }

        const keysArray = keys.split('\n').map(k => k.trim()).filter(k => k.length > 0);
        if (keysArray.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Please provide at least one key.' }) };
        }

        // --- Add Keys to Firestore ---
        const keysRef = db.collection('digital_keys');
        const batch = db.batch();

        keysArray.forEach(key => {
            const newKeyRef = keysRef.doc(); // Firestore will generate a unique ID
            batch.set(newKeyRef, {
                productId: productId,
                key: key,
                status: 'available',
                createdAt: new Date().toISOString()
            });
        });

        await batch.commit();

        console.log(`Successfully added ${keysArray.length} new key(s) for product ${productId}.`);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: `Successfully added ${keysArray.length} new key(s).` 
            }),
        };

    } catch (error) {
        console.error('Error in add-keys function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An error occurred while adding keys.'
            }),
        };
    }
};