// netlify/functions/create-product.js

const { db } = require('./firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { adminPassword, productData } = JSON.parse(event.body);
        
        // This should be the same password you use to log in.
        // For better security, you could use an environment variable here.
        const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        // --- Security Check ---
        if (adminPassword !== SERVER_ADMIN_PASSWORD) {
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized.' }) };
        }
        
        // --- Data Validation (basic) ---
        if (!productData || !productData.id || !productData.name?.en) {
             return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Product ID and English Name are required.' }) };
        }

        const productRef = db.collection('products').doc(productData.id);
        
        // Using .set() will create the document if it doesn't exist, or overwrite it if it does.
        await productRef.set(productData);

        console.log(`Successfully created or updated product: ${productData.id}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: `Product "${productData.name.en}" has been saved.` 
            }),
        };

    } catch (error) {
        console.error('Error in create-product function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An error occurred while creating the product.'
            }),
        };
    }
};
