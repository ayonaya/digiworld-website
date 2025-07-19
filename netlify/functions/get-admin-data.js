// /netlify/functions/get-admin-data.js

const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { adminPassword } = JSON.parse(event.body);

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Incorrect password.' }) };
    }

    // Fetch all necessary data in parallel for better performance
    const [
      inventorySnapshot,
      reviewsSnapshot,
      ordersSnapshot,
      productsSnapshot // ✨ NEW: Fetching products
    ] = await Promise.all([
      db.collection('keys').get(),
      db.collection('reviews').where('status', '==', 'pending').get(),
      db.collection('orders').orderBy('createdAt', 'desc').limit(20).get(),
      db.collection('products').orderBy('name.en').get() // ✨ NEW: Fetching the products collection
    ]);

    // Process inventory
    const inventory = {};
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      inventory[doc.id] = data.keys ? data.keys.length : 0;
    });

    // Process pending reviews
    const pendingReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process recent orders
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // ✨ NEW: Process the fetched products
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          inventory,
          pendingReviews,
          orders,
          products // ✨ NEW: Including the products in the data response
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