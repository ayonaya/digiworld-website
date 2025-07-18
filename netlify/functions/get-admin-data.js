// /netlify/functions/get-admin-data.js

const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { adminPassword } = JSON.parse(event.body);

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Incorrect password.' }) };
    }

    const inventorySnapshot = await db.collection('keys').get();
    
    const inventory = {};
    inventorySnapshot.forEach(doc => {
      inventory[doc.id] = doc.data().keys.length;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          inventory
        }
      }),
    };

  } catch (error) {
    console.error('Error fetching admin data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Failed to fetch admin data.' }),
    };
  }
};