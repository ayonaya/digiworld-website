// /netlify/functions/get-user-orders.js

const { db, admin } = require('./firebase-admin'); // We need 'admin' for auth

exports.handler = async (event) => {
    // 1. Get the Firebase ID token from the Authorization header.
    const token = event.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Missing authentication token.' }) };
    }

    try {
        // 2. Verify the token using Firebase Admin SDK. This is the security check.
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        if (!userEmail) {
             return { statusCode: 403, body: JSON.stringify({ message: 'Token is valid, but email is missing.' }) };
        }

        // 3. If the token is valid, query the database for orders matching the user's email.
        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef
            .where('customerEmail', '==', userEmail)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, orders: [] })
            };
        }

        // For each order, fetch the latest product name and image
        const productsRef = db.collection('products');
        const ordersWithDetails = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const orderData = { id: doc.id, ...doc.data() };
                const enrichedCart = [];

                if (orderData.cart && orderData.cart.length > 0) {
                    for (const item of orderData.cart) {
                        const productDoc = await productsRef.doc(item.id).get();
                        if (productDoc.exists) {
                            const productData = productDoc.data();
                            enrichedCart.push({
                                ...item,
                                name: productData.name.en,
                                image: productData.image
                            });
                        }
                    }
                }

                orderData.cart = enrichedCart;
                return orderData;
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, orders: ordersWithDetails })
        };

    } catch (error) {
        console.error('Error verifying token or fetching orders:', error);
        // If the token is invalid, verifyIdToken will throw an error.
        return {
            statusCode: 403, // Forbidden
            body: JSON.stringify({ message: 'Invalid or expired authentication token.' })
        };
    }
};
