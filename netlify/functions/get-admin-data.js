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

    const [
      reviewsSnapshot,
      ordersSnapshot,
      productsSnapshot,
      listUsersResult,
      activationTokensSnapshot
    ] = await Promise.all([
      db.collection('reviews').where('isApproved', '==', false).get(),
      db.collection('orders').where('status', '==', 'completed').get(),
      db.collection('products').get(),
      admin.auth().listUsers(100),
      db.collection('activationTokens').where('status', '==', 'available').get()
    ]);

    // *** FIX: Normalize product data before sending to client ***
    const products = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      const product = { id: doc.id, ...data };
      
      // Ensure priceUSD is always a number. Handles old format { price: { USD: 10 } } and new format { priceUSD: 10 }
      if (typeof product.priceUSD !== 'number') {
        if (product.price && typeof product.price.USD === 'number') {
          product.priceUSD = product.price.USD;
        } else {
          product.priceUSD = 0; // Default to 0 if price is missing or malformed
        }
      }
      delete product.price; // Remove the old price object if it exists
      return product;
    });

    let totalRevenue = 0;
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const amount = order.totalAmount || order.amount;
      if (amount && typeof amount === 'number') { totalRevenue += amount; }
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
    
    const availableTokens = activationTokensSnapshot.docs.map(doc => doc.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          stats: { totalRevenue: totalRevenue.toFixed(2), totalOrders: ordersSnapshot.size, totalUsers: users.length },
          pendingReviews,
          orders: recentOrders,
          products,
          users,
          availableTokens
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