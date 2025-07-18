// netlify/functions/firestore-key-manager.js
const { db } = require('./firebase-admin'); // Modified: Import db from firebase-admin.js

/**
 * UPGRADED: Retrieves a key for a SPECIFIC product.
 * @param {string} productId - The ID of the product being purchased.
 * @param {string} customerEmail - The email of the customer.
 * @param {string} orderId - The ID of the order.
 * @returns {Promise<string|null>} The key string, or null if none are available.
 */
async function getAndMarkKeyAsUsed(productId, customerEmail, orderId) {
    const keysRef = db.collection('digital_keys');
    try {
        const key = await db.runTransaction(async (transaction) => {
            // UPGRADE: Query now includes 'productId' to find the correct key.
            const querySnapshot = await transaction.get(
                keysRef.where('productId', '==', productId)
                       .where('status', '==', 'available')
                       .limit(1)
            );

            if (querySnapshot.empty) {
                // UPGRADE: Warning now includes the specific product that is out of stock.
                console.warn(`No available digital keys found for product: ${productId}`);
                return null;
            }

            const keyDoc = querySnapshot.docs[0];
            const keyData = keyDoc.data();

            transaction.update(keyDoc.ref, {
                status: 'used',
                assignedToEmail: customerEmail,
                orderId: orderId,
                assignedAt: new Date().toISOString()
            });

            console.log(`Key ${keyData.key} for product ${productId} marked as used for order ${orderId}.`);
            return keyData.key;
        });
        return key;
    } catch (error) {
        console.error('Error in Firestore transaction for key management:', error);
        return null;
    }
}

module.exports = {
    getAndMarkKeyAsUsed,
};