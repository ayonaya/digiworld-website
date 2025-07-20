// /netlify/functions/get-wishlist.js

const { db, admin } = require('./firebase-admin');

exports.handler = async (event) => {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication required.' }) };
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const wishlistDoc = await db.collection('wishlists').doc(userId).get();

        if (!wishlistDoc.exists || !wishlistDoc.data().productIds || wishlistDoc.data().productIds.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ success: true, products: [] }) };
        }

        const productIds = wishlistDoc.data().productIds;

        // Fetch all product documents from the 'products' collection based on the IDs
        const productsRef = db.collection('products');
        const productDocs = await productsRef.where(admin.firestore.FieldPath.documentId(), 'in', productIds).get();

        const products = productDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, products })
        };

    } catch (error) {
        console.error('Error getting wishlist:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to retrieve wishlist.' })
        };
    }
};