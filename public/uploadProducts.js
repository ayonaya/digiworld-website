require('dotenv').config({ path: './.env.local' });
const admin = require('firebase-admin');

// Parse full service account JSON from env var
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Destructure products array from the module export
const { products } = require("../netlify/functions/_data/products-data.js");

async function uploadProducts() {
  const batch = db.batch();

  products.forEach((product) => {
    const docRef = db.collection('products').doc(product.id ? product.id.toString() : undefined);
    batch.set(docRef, product);
  });

  try {
    await batch.commit();
    console.log('Products uploaded successfully!');
  } catch (error) {
    console.error('Error uploading products:', error);
  }
}

uploadProducts();
