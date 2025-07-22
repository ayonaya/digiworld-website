// netlify/functions/get-products.js
const { db } = require('./firebase-admin');

exports.handler = async (event) => {
  const id = event.queryStringParameters?.id;

  try {
    // If an ID is provided, return that single product
    if (id) {
      const doc = await db.collection('products').doc(id).get();
      if (!doc.exists) {
        return {
          statusCode: 404,
          headers: {'Access-Control-Allow-Origin': '*'},
          body: JSON.stringify({ success: false, message: 'Product not found.' })
        };
      }
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: true, product: { id: doc.id, ...doc.data() } })
      };
    }

    // No ID → return the full list
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, products })
    };

  } catch (error) {
    console.error("Error in get-products:", error);
    return {
      statusCode: 500,
      headers: {'Access-Control-Allow-Origin': '*'},
      body: JSON.stringify({ success: false, message: 'Internal server error.' })
    };
  }
};
