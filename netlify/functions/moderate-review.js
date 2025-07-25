// netlify/functions/moderate-review.js
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

        const { reviewId, action } = JSON.parse(event.body);

        if (!reviewId || !action) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Review ID and action are required.' }) };
        }

        const reviewRef = db.collection('reviews').doc(reviewId);

        if (action === 'approve') {
            await reviewRef.update({ isApproved: true });
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Review approved.' }) };
        } else if (action === 'delete') {
            await reviewRef.delete();
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Review deleted.' }) };
        } else {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid action.' }) };
        }

    } catch (error) {
        console.error('Error in moderate-review function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'An error occurred while moderating the review.' }),
        };
    }
};