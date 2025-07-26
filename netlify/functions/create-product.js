// netlify/functions/create-product.js
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

        let { productData } = JSON.parse(event.body);
        
        if (!productData || !productData.id || !productData.name?.en || typeof productData.priceUSD !== 'number') {
             return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID, English Name, and a numeric priceUSD are required.' }) };
        }

        // *** FIX: Ensure the data saved to the database is clean and consistent ***
        const cleanData = {
            id: productData.id,
            name: { en: productData.name.en || '' },
            priceUSD: Number(productData.priceUSD),
            category: productData.category || 'Uncategorized',
            image: productData.image || '',
            desc: { en: productData.desc.en || '' },
            features: { en: productData.features?.en || [] },
            requirements: { en: productData.requirements?.en || [] },
            activation: { en: productData.activation?.en || [] },
            isHot: productData.isHot || false
        };

        const productRef = db.collection('products').doc(cleanData.id);
        await productRef.set(cleanData);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `Product "${cleanData.name.en}" has been saved.` }),
        };
    } catch (error) {
        console.error('Error in create-product function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'An error occurred while creating the product.' }),
        };
    }
};