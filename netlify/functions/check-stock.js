// This is a scheduled function to automatically check for low product key stock.

// It uses the centralized firebase-admin.js file to connect to the database.
const { db } = require('./firebase-admin'); 
const nodemailer = require('nodemailer');

// Configure the email transporter using environment variables from your .env file
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

// You can change this number to define what "low stock" means.
const LOW_STOCK_THRESHOLD = 5;

// This is the main handler that Netlify will run on a schedule.
exports.handler = async () => {
    console.log('Running scheduled stock check...');

    try {
        // 1. Get the current count of all available keys from Firestore.
        const keysRef = db.collection('digital_keys');
        const availableKeysSnapshot = await keysRef.where('status', '==', 'available').get();
        
        const inventory = {};
        availableKeysSnapshot.docs.forEach(doc => {
            const keyData = doc.data();
            if (keyData.productId) {
                inventory[keyData.productId] = (inventory[keyData.productId] || 0) + 1;
            }
        });

        console.log('Current Inventory:', inventory);

        // 2. Identify which products are below the low stock threshold.
        const lowStockProducts = [];
        for (const productId in inventory) {
            if (inventory[productId] <= LOW_STOCK_THRESHOLD) {
                lowStockProducts.push({ id: productId, count: inventory[productId] });
            }
        }

        // 3. If any products are low on stock, send a single alert email.
        if (lowStockProducts.length > 0) {
            console.log('Low stock detected for:', lowStockProducts);
            
            const emailBody = `
                <p>This is an automated low stock alert from DigiWorld.</p>
                <p>The following products have reached the low stock threshold of ${LOW_STOCK_THRESHOLD} keys or fewer:</p>
                <ul>
                    ${lowStockProducts.map(p => `<li><strong>${p.id}</strong>: ${p.count} keys remaining</li>`).join('')}
                </ul>
                <p>Please restock these products as soon as possible to avoid running out.</p>
            `;

            await transporter.sendMail({
                from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                to: process.env.GMAIL_USER, // Send the alert to your admin email
                subject: 'URGENT: Low Stock Alert for DigiWorld',
                html: emailBody,
            });

            console.log('Low stock alert email sent successfully.');
            return {
                statusCode: 200,
                body: `Low stock alert sent for ${lowStockProducts.length} product(s).`,
            };
        } else {
            console.log('All products have sufficient stock.');
            return {
                statusCode: 200,
                body: 'Stock check complete. All products are sufficiently stocked.',
            };
        }

    } catch (error) {
        console.error('Error during scheduled stock check:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred during the stock check.' }),
        };
    }
};