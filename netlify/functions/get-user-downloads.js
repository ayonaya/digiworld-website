// /netlify/functions/get-user-downloads.js
const { db, admin } = require('./firebase-admin');

exports.handler = async (event) => {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Missing authentication token.' }) };
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        if (!userEmail) {
            return { statusCode: 403, body: JSON.stringify({ message: 'Token is valid, but email is missing.' }) };
        }

        // Fetch digital keys assigned to this user
        const downloadsRef = db.collection('digital_keys');
        const snapshot = await downloadsRef
            .where('assignedToEmail', '==', userEmail)
            .orderBy('assignedAt', 'desc')
            .get();

        if (snapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ success: true, downloads: [] }) };
        }

        const downloads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, downloads })
        };

    } catch (error) {
        console.error('Error verifying token or fetching downloads:', error);
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Invalid or expired authentication token.' })
        };
    }
};