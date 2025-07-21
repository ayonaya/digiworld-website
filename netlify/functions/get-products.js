const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    
    // Check if there are any products
    if (productsSnapshot.empty) {
      console.log('No products found in Firestore.');
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    // Map Firestore documents to a cleaner product array
    const products = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        category: data.category || 'Uncategorized',
        isHot: data.isHot || false,
        name: data.name || { en: 'Unnamed Product' },
        price: data.price || { LKR: 0, USD: 0 },
        // IMPORTANT: We map 'imageUrl' from the database to 'image' for the frontend
        image: data.imageUrl || '', 
        delivery: data.delivery || { en: '' },
        desc: data.desc || { en: '' },
        features: data.features || { en: [] },
        requirements: data.requirements || { en: [] },
        activation: data.activation || { en: [] }
      };
    });

    return {
      statusCode: 200,
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