// /netlify/functions/update-product.js
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

    const { productId, productData } = JSON.parse(event.body);

    if (!productId || !productData) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID and data are required.' }) };
    }
    
    // *** FIX: Ensure data is in the correct format before updating ***
    const dataToUpdate = {
        'name.en': productData['name.en'],
        category: productData.category,
        priceUSD: Number(productData.priceUSD)
    };

    if (isNaN(dataToUpdate.priceUSD)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid price format.' }) };
    }

    const productRef = db.collection('products').doc(productId);

    await productRef.update(dataToUpdate);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Product updated successfully!' }),
    };

  } catch (error) {
    console.error('Error updating product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Failed to update product.' }),
    };
  }
};