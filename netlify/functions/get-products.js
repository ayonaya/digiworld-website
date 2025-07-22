const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    const productsSnapshot = await db.collection('products').get();

    if (productsSnapshot.empty) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([]),
      };
    }

    const products = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        category: data.category || 'Uncategorized',
        isHot: data.isHot || false,
        name: data.name || { en: 'Unnamed Product' },
        price: data.price || { LKR: 0, USD: 0 },
        image: data.image || '',   // fixed here
        delivery: data.delivery || { en: '' },
        desc: data.desc || { en: '' },
        features: data.features || { en: [] },
        requirements: data.requirements || { en: [] },
        activation: data.activation || { en: [] }
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(products),
    };

  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }
};
