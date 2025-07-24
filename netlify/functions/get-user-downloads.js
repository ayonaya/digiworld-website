// /netlify/functions/get-user-orders.js
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

        const ordersRef = db.collection('orders');
        const ordersSnapshot = await ordersRef
            .where('customerEmail', '==', userEmail)
            .orderBy('createdAt', 'desc')
            .get();

        if (ordersSnapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ success: true, orders: [] }) };
        }

        // --- NEW: Fetch Product Details for Each Order ---
        const productsRef = db.collection('products');
        const ordersWithProductDetails = await Promise.all(
            ordersSnapshot.docs.map(async (orderDoc) => {
                const orderData = { id: orderDoc.id, ...orderDoc.data() };
                const detailedCart = [];

                if (orderData.cart && orderData.cart.length > 0) {
                    for (const item of orderData.cart) {
                        const productDoc = await productsRef.doc(item.id).get();
                        if (productDoc.exists) {
                            const productData = productDoc.data();
                            detailedCart.push({
                                ...item,
                                name: productData.name.en,
                                image: productData.image
                            });
                        }
                    }
                }
                orderData.cart = detailedCart; // Replace old cart with detailed one
                return orderData;
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, orders: ordersWithProductDetails })
        };

    } catch (error) {
        console.error('Error verifying token or fetching orders:', error);
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Invalid or expired authentication token.' })
        };
    }
};