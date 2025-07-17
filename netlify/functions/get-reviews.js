exports.handler = async (event) => {
    const { productId } = event.queryStringParameters;

    if (!productId) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID is required.' }) };
    }

    try {
        const reviewsRef = db.collection('reviews');
        const snapshot = await reviewsRef
            .where('productId', '==', productId)
            .where('isApproved', '==', true) // Only approved reviews
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ success: true, reviews: [] }) };
        }

        const reviews = snapshot.docs.map(doc => doc.data());
        return { statusCode: 200, body: JSON.stringify({ success: true, reviews }) };
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Error fetching reviews.' }) };
    }
};
