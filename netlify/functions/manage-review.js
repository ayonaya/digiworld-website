// /netlify/functions/manage-review.js

const { db } = require('./firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { adminPassword, reviewId, action } = JSON.parse(event.body);

        // Security Check: Ensure the user is an admin
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized.' }) };
        }

        if (!reviewId || !action) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Review ID and action are required.' }) };
        }

        const reviewRef = db.collection('reviews').doc(reviewId);

        if (action === 'approve') {
            await reviewRef.update({ isApproved: true });
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Review approved successfully.' })
            };
        } else if (action === 'delete') {
            await reviewRef.delete();
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Review deleted successfully.' })
            };
        } else {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid action.' }) };
        }

    } catch (error) {
        console.error('Error in manage-review function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'An error occurred while managing the review.' })
        };
    }
};