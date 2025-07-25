// /netlify/functions/delete-product.js
const { db, admin } = require('./firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = event.headers.authorization?.split('Bearer ')[1];
  if (!token) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication required.' }) };
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.isAdmin !== true) {
        return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Forbidden. User is not an admin.' }) };
    }

    const { productId } = JSON.parse(event.body);

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