// /netlify/functions/get-related-products.js

const { db } = require('./firebase-admin');

exports.handler = async (event) => {
    // Get category and current product ID from the URL query
    const { category, currentProductId } = event.queryStringParameters;

    if (!category || !currentProductId) {
        return { 
            statusCode: 400, 
            body: JSON.stringify({ success: false, message: 'Category and current product ID are required.' }) 
        };
    }

    try {
        const productsRef = db.collection('products');
        
        // Query for other products in the same category, limit to 4 results
        const snapshot = await productsRef
            .where('category', '==', category)
            .where('id', '!=', currentProductId) // Make sure not to include the current product
            .limit(4)
            .get();

        if (snapshot.empty) {
            return { 
                statusCode: 200, 
                body: JSON.stringify({ success: true, products: [] }) 
            };
        }

        const relatedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { 
            statusCode: 200, 
            body: JSON.stringify({ success: true, products: relatedProducts }) 
        };

    } catch (error) {
        console.error('Error fetching related products:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ success: false, message: 'Failed to fetch related products.' }) 
        };
    }
};