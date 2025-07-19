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

    // UPDATED: Fetch inventory, products, and reviews concurrently
    const keysRef = db.collection('digital_keys');
    const productsRef = db.collection('products');
    const reviewsRef = db.collection('reviews');

    const [availableKeysSnapshot, productsSnapshot, pendingReviewsSnapshot] = await Promise.all([
        keysRef.where('status', '==', 'available').get(),
        productsRef.get(),
        reviewsRef.where('isApproved', '==', false).get()
    ]);

    // 1. Process Inventory
    const inventory = {};
    availableKeysSnapshot.forEach(doc => {
      const keyData = doc.data();
      if (keyData.productId) {
          inventory[keyData.productId] = (inventory[keyData.productId] || 0) + 1;
      }
    });

    // 2. Process Products
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 3. Process Pending Reviews
    const reviews = pendingReviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Return all data in the expected format
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          inventory,
          products,
          reviews
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