// /netlify/functions/get-admin-data.js

const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { adminPassword } = JSON.parse(event.body);

    // IMPORTANT: Basic password check. Replace with more secure auth in a real app.
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Incorrect password.' }) };
    }

    // Fetch all data in parallel for efficiency
    const [
      inventorySnapshot,
      reviewsSnapshot,
      ordersSnapshot,
      productsSnapshot // ✨ NEW: Fetching products
    ] = await Promise.all([
      db.collection('keys').get(),
      db.collection('reviews').where('status', '==', 'pending').get(),
      db.collection('orders').orderBy('createdAt', 'desc').limit(20).get(),
      db.collection('products').orderBy('name.en').get() // ✨ NEW: Fetching products
    ]);

    // Process inventory
    const inventory = {};
    inventorySnapshot.forEach(doc => {
      inventory[doc.id] = doc.data().keys.length;
    });

    // Process pending reviews
    const pendingReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process recent orders
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // ✨ NEW: Process products
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          inventory,
          pendingReviews,
          orders,
          products // ✨ NEW: Including products in the response
        }
      }),
    };

  } catch (error) {
    console.error('Error fetching admin data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Failed to fetch admin data.' }),
    };
  }
};