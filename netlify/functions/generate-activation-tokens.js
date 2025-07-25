// netlify/functions/generate-activation-tokens.js
const { db, admin } = require('./firebase-admin');
const crypto = require('crypto');

exports.handler = async (event) => {
    // 1. Secure this function for admins only
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication required.' }) };
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.isAdmin !== true) {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Forbidden. User is not an admin.' }) };
        }

        // 2. Generate a batch of 10 new, unique tokens
        const tokensCollection = db.collection('activationTokens');
        const batch = db.batch();
        const tokensToGenerate = 10;
        let generatedCount = 0;

        for (let i = 0; i < tokensToGenerate; i++) {
            const newToken = crypto.randomBytes(12).toString('hex').toUpperCase();
            const tokenRef = tokensCollection.doc(newToken);
            batch.set(tokenRef, {
                status: 'available',
                createdAt: new Date().toISOString()
            });
            generatedCount++;
        }
        
        // 3. Commit all new tokens to the database in a single operation
        await batch.commit();
        
        const successMessage = `Successfully generated a new batch of ${generatedCount} activation tokens.`;
        console.log(successMessage);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: successMessage })
        };

    } catch (error) {
        console.error("Error generating token batch:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};