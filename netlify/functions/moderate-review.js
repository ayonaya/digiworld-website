// This secure function handles approving or deleting a review.

// CORRECT: Imports the initialized 'db' instance.
const { db } = require('./firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { adminPassword, reviewId, action } = JSON.parse(event.body);
        const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        // --- Security Check ---
        if (!SERVER_ADMIN_PASSWORD || adminPassword !== SERVER_ADMIN_PASSWORD) {
            console.warn("Unauthorized moderation attempt.");
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized.' }) };
        }

        if (!reviewId || !action) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Review ID and action are required.' }) };
        }

        const reviewRef = db.collection('reviews').doc(reviewId);

        if (action === 'approve') {
            await reviewRef.update({ isApproved: true });
            console.log(`Review ${reviewId} has been approved.`);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Review approved.' }) };
        } else if (action === 'delete') {
            await reviewRef.delete();
            console.log(`Review ${reviewId} has been deleted.`);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Review deleted.' }) };
        } else {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid action.' }) };
        }

    } catch (error) {
        console.error('Error in moderate-review function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An error occurred while moderating the review.'
            }),
        };
    }
};
