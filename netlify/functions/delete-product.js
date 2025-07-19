// /netlify/functions/delete-product.js

const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { adminPassword, productId } = JSON.parse(event.body);

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized.' }) };
    }

    if (!productId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID is required.' }) };
    }

    const productRef = db.collection('products').doc(productId);

    await productRef.delete();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Product deleted successfully!' }),
    };

  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Failed to delete product.' }),
    };
  }
};