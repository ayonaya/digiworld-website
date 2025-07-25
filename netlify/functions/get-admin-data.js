// /netlify/functions/get-admin-data.js
const { db, admin } = require('./firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = event.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication token is required.' }) };
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.isAdmin !== true) {
      return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Forbidden. User does not have admin privileges.' }) };
    }

    // UPDATED: Added activationTokensSnapshot to the parallel fetch
    const [
      inventorySnapshot,
      reviewsSnapshot,
      ordersSnapshot,
      productsSnapshot,
      listUsersResult,
      activationTokensSnapshot
    ] = await Promise.all([
      db.collection('digital_keys').where('status', '==', 'available').get(),
      db.collection('reviews').where('isApproved', '==', false).get(),
      db.collection('orders').where('status', '==', 'completed').get(),
      db.collection('products').get(),
      admin.auth().listUsers(100),
      db.collection('activationTokens').where('status', '==', 'available').get()
    ]);

    // --- Process All Data ---
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const productMap = new Map(products.map(p => [p.id, p]));
    let totalRevenue = 0;
    const salesCounts = {};
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const amount = order.totalAmount || order.amount;
      if (amount && typeof amount === 'number') { totalRevenue += amount; }
      if (order.cart && Array.isArray(order.cart)) {
        order.cart.forEach(item => {
          salesCounts[item.id] = (salesCounts[item.id] || 0) + item.quantity;
        });
      }
    });
    const topSellers = Object.entries(salesCounts)
      .sort(([, a], [, b]) => b - a).slice(0, 5)
      .map(([id, sales]) => ({ id, sales, name: productMap.get(id)?.name?.en || 'Unknown' }));
    const inventory = {};
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      if(data.productId) { inventory[data.productId] = (inventory[data.productId] || 0) + 1; }
    });
    const pendingReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const recentOrders = ordersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
    const users = listUsersResult.users.map(userRecord => ({
        uid: userRecord.uid,
        email: userRecord.email,
        creationTime: userRecord.metadata.creationTime,
    }));
    
    // NEW: Process the available tokens
    const availableTokens = activationTokensSnapshot.docs.map(doc => doc.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          stats: { totalRevenue: totalRevenue.toFixed(2), totalOrders: ordersSnapshot.size, totalUsers: users.length },
          inventory,
          pendingReviews,
          orders: recentOrders,
          products,
          topSellers,
          users,
          availableTokens // Add the token list to the response
        }
      }),
    };

  } catch (error) {
    console.error('Error in get-admin-data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'An error occurred: ' + error.message }),
    };
  }
};