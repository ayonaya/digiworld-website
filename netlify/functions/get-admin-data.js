// /netlify/functions/get-admin-data.js
const { db } = require('./firebase-admin');

exports.handler = async (event) => {
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
      db.collection('digital_keys').where('status', '==', 'available').get(),
      db.collection('reviews').where('isApproved', '==', false).get(),
      db.collection('orders').where('status', '==', 'completed').get(),
      db.collection('products').orderBy('name.en').get()
    ]);

    // --- Calculate Sales Analytics ---
    let totalRevenue = 0;
    ordersSnapshot.forEach(doc => {
        const order = doc.data();
        const amount = order.totalAmount || order.amount; // Handle both single and cart orders
        if (amount && typeof amount === 'number') {
            totalRevenue += amount;
        }
    });
    const totalOrders = ordersSnapshot.size;

    // Process other data
    const inventory = {};
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.productId) {
        inventory[data.productId] = (inventory[data.productId] || 0) + 1;
      }
    });
    const pendingReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Create a new array from the snapshot docs before sorting/slicing
    const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentOrders = allOrders.slice(0, 20);
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          stats: {
            totalRevenue: totalRevenue.toFixed(2),
            totalOrders: totalOrders,
          },
          inventory,
          pendingReviews,
          orders: recentOrders,
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