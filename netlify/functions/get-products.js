// /netlify/functions/get-products.js

const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    const productsRef = db.collection('products');
    const productId = event.queryStringParameters.id;

    // If an ID is provided, fetch only that specific product.
    if (productId) {
      const doc = await productsRef.doc(productId).get();
      if (!doc.exists) {
        return { 
          statusCode: 404, 
          body: JSON.stringify({ success: false, message: 'Product not found' }) 
        };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, product: { id: doc.id, ...doc.data() } }),
      };
    } 
    // Otherwise, fetch all products.
    else {
      // Removed .orderBy() to prevent potential Firestore index errors.
      // Sorting should be handled on the client-side after fetching the data.
      const snapshot = await productsRef.get();
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, products: products }),
      };
    }

  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Failed to fetch products.' }),
    };
  }
};
