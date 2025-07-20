// /netlify/functions/add-to-wishlist.js

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
        const { productId } = JSON.parse(event.body);
        if (!productId) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID is required.' }) };
        }

        // Verify the user's identity
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const wishlistRef = db.collection('wishlists').doc(userId);
        const productRef = db.collection('products').doc(productId);

        // Use a transaction to safely add the product reference
        await db.runTransaction(async (transaction) => {
            const wishlistDoc = await transaction.get(wishlistRef);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists) {
                throw new Error('Product does not exist.');
            }

            if (!wishlistDoc.exists) {
                // If the user has no wishlist, create one
                transaction.set(wishlistRef, {
                    productIds: [productId]
                });
            } else {
                // If wishlist exists, add the new product ID if it's not already there
                const existingIds = wishlistDoc.data().productIds || [];
                if (!existingIds.includes(productId)) {
                    transaction.update(wishlistRef, {
                        productIds: admin.firestore.FieldValue.arrayUnion(productId)
                    });
                }
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Product added to wishlist.' })
        };

    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};