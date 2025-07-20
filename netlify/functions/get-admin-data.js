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

    const [
      inventorySnapshot,
      reviewsSnapshot,
      ordersSnapshot,
      productsSnapshot
    ] = await Promise.all([
      // CORRECTED: Query the 'digital_keys' collection
      db.collection('digital_keys').where('status', '==', 'available').get(),
      // CORRECTED: Query for reviews where 'isApproved' is false
      db.collection('reviews').where('isApproved', '==', false).get(),
      db.collection('orders').orderBy('createdAt', 'desc').limit(20).get(),
      db.collection('products').orderBy('name.en').get()
    ]);

    // Process inventory by counting keys for each product ID
    const inventory = {};
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.productId) {
        inventory[data.productId] = (inventory[data.productId] || 0) + 1;
      }
    });

    // Process pending reviews
    const pendingReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process recent orders
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Process the fetched products
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          inventory,
          pendingReviews,
          orders,
          products
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