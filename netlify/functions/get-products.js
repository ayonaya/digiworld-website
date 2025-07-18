// /netlify/functions/get-products.js

// Import our initialized Firebase admin instance
const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    // 1. Get a reference to the 'products' collection in Firestore
    const productsRef = db.collection('products');
    
    // 2. Fetch all documents from the collection
    const snapshot = await productsRef.get();

    // 3. Check if the collection is empty
    if (snapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, products: [] }), // Return an empty list
      };
    }

    // 4. Map the documents to an array of product objects
    const products = snapshot.docs.map(doc => doc.data());

    // 5. Return the products, just like the old function did
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, products: products }),
    };

  } catch (error) {
    console.error('Error fetching products from Firestore:', error);
    // Return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Failed to fetch products.' }),
    };
  }
};