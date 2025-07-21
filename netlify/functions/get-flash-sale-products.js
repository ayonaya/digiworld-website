// File: netlify/functions/get-flash-sale-products.js

const { db } = require('./firebase-config');

exports.handler = async function(event, context) {
  try {
    const productsRef = db.collection('products');
    // Find all products that are currently part of the flash sale
    const snapshot = await productsRef.where('isFlashSale', '==', true).get();

    if (snapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]), // Return an empty array if no sale products
      };
    }

    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products),
    };

  } catch (error) {
    console.error("Error fetching flash sale products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    };
  }
};