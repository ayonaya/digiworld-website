// /netlify/functions/seed-products.js
const { db } = require('./firebase-admin');
const { products } = require('./_data/products-data.js'); // Imports your product data

exports.handler = async () => {
  if (!products || products.length === 0) {
    return { statusCode: 400, body: 'Product data file is empty. Nothing to seed.' };
  }

  const productsRef = db.collection('products');
  const batch = db.batch();
  let count = 0;

  // This loops through your products and prepares them to be saved in Firestore
  products.forEach(product => {
    const docRef = productsRef.doc(product.id); // Uses your product ID as the document ID
    batch.set(docRef, product);
    count++;
  });

  try {
    await batch.commit(); // This saves all products to Firestore at once
    const successMessage = `Success! Seeded ${count} products to Firestore. You can now delete this function.`;
    console.log(successMessage);
    return {
      statusCode: 200,
      body: successMessage,
    };
  } catch (error) {
    console.error('Error seeding products:', error);
    return { statusCode: 500, body: `Error seeding database: ${error.message}` };
  }
};