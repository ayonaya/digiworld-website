// netlify/functions/add-keys.js
const { db, admin } = require('./firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication required.' }) };
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.isAdmin !== true) {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Forbidden. User is not an admin.' }) };
        }

        const { productId, keys } = JSON.parse(event.body);
        
        if (!productId || !keys) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID and keys are required.' }) };
        }

        const keysArray = keys.split('\n').map(k => k.trim()).filter(k => k.length > 0);
        if (keysArray.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Please provide at least one key.' }) };
        }

        const keysRef = db.collection('digital_keys');
        const batch = db.batch();

        keysArray.forEach(key => {
            const newKeyRef = keysRef.doc();
            batch.set(newKeyRef, {
                productId: productId,
                key: key,
                status: 'available',
                createdAt: new Date().toISOString()
            });
        });

        await batch.commit();

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `Successfully added ${keysArray.length} new key(s).` }),
        };
    } catch (error) {
        console.error('Error in add-keys function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'An error occurred while adding keys.' }),
        };
    }
};