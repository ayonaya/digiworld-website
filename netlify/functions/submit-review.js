// This function handles submitting a new product review and saving it to Firestore.

// CORRECT: Imports the initialized 'db' instance.
const { db } = require('./firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productId, authorName, rating, reviewText } = JSON.parse(event.body);

        // --- Data Validation ---
        if (!productId || !authorName || !rating || !reviewText) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ success: false, message: 'Missing required fields. All fields are required.' }) 
            };
        }
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'Rating must be a number between 1 and 5.' })
            };
        }
        if (authorName.trim().length < 2 || reviewText.trim().length < 10) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'Please provide a valid name and a more detailed review.' })
            };
        }
        // --- End Validation ---

        const reviewData = {
            productId: productId,
            authorName: authorName.trim(),
            rating: rating,
            reviewText: reviewText.trim(),
            createdAt: new Date().toISOString(),
            isApproved: false // Default to not approved
        };

        const reviewsRef = db.collection('reviews');
        await reviewsRef.add(reviewData);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Thank you for your review! It has been submitted for approval.' 
            }),
        };

    } catch (error) {
        console.error('Error submitting review:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An error occurred while submitting your review. Please try again later.'
            }),
        };
    }
};
