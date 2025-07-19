// /netlify/functions/update-product.js

const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { adminPassword, productId, productData } = JSON.parse(event.body);

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized.' }) };
    }

    if (!productId || !productData) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID and data are required.' }) };
    }

    const productRef = db.collection('products').doc(productId);

    // .update() will change only the fields provided.
    await productRef.update(productData);

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