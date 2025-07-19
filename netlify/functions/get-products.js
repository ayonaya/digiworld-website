// /netlify/functions/get-products.js

const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    const productsRef = db.collection('products');
    const productId = event.queryStringParameters.id;

    // If an ID is provided in the URL, fetch only that product
    if (productId) {
      const doc = await productsRef.doc(productId).get();
      if (!doc.exists) {
        return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Product not found' }) };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, product: { id: doc.id, ...doc.data() } }),
      };
    } 
    // Otherwise, fetch all products
    else {
      const snapshot = await productsRef.orderBy('name.en').get();
      const products = snapshot.docs.map(doc => doc.data());
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