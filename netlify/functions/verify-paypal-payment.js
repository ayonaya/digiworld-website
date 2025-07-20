// /netlify/functions/verify-paypal-payment.js
const axios = require('axios');
const nodemailer = require('nodemailer');
const { getAndMarkKeyAsUsed } = require('./firestore-key-manager'); 
const { db } = require('./firebase-admin');

// Configure the email transporter
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API_BASE_URL = 'https://api-m.paypal.com';

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // =================================================================
    // UPGRADE: Now expects a 'cart' array instead of a single 'productId'
    // =================================================================
    const { orderID, email, cart, amount, currency } = JSON.parse(event.body); 

    if (!orderID || !email || !cart || cart.length === 0 || !amount || !currency) {
        return { 
            statusCode: 400, 
            body: JSON.stringify({ success: false, message: 'Missing required fields for verification.' }) 
        };
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        console.error("PayPal API keys are not set.");
        return { 
            statusCode: 500, 
            body: JSON.stringify({ success: false, message: "PayPal service not configured." }) 
        };
    }

    try {
        // Create the main order document in Firestore
        const orderDocRef = db.collection('orders').doc(orderID);
        await orderDocRef.set({
            cart: cart, // Store the array of purchased items
            customerEmail: email,
            totalAmount: parseFloat(amount),
            currency: currency,
            paymentGateway: 'paypal',
            status: 'initiated',
            createdAt: new Date().toISOString()
        });

        // Verify the payment with PayPal API
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
        const tokenResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const accessToken = tokenResponse.data.access_token;

        const captureResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });

        const paypalStatus = captureResponse.data.status;

        if (paypalStatus === 'COMPLETED') {
            console.log(`PayPal payment COMPLETED for Order ID: ${orderID}`);

            let fulfilledKeys = [];
            let outOfStockItems = [];

            // =================================================================
            // UPGRADE: Loop through the cart and get a key for each item
            // =================================================================
            for (const item of cart) {
                // We need to get 'item.quantity' number of keys for this 'item.id'
                for (let i = 0; i < item.quantity; i++) {
                    const key = await getAndMarkKeyAsUsed(item.id, email, orderID);
                    if (key) {
                        fulfilledKeys.push({ productName: item.name, key: key });
                    } else {
                        outOfStockItems.push(item.name);
                    }
                }
            }

            // If any items were out of stock, notify the admin
            if (outOfStockItems.length > 0) {
                await transporter.sendMail({
                    from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER, 
                    subject: `URGENT: Key Stock Alert for Order ${orderID}`,
                    text: `Payment finished for order ${orderID}, but the following items were out of stock:\n\n${outOfStockItems.join('\n')}\n\nPlease restock and fulfill manually for customer: ${email}`
                });
            }
            
            // If at least one key was fulfilled, send it to the customer
            if (fulfilledKeys.length > 0) {
                const emailBody = `Thank you for your purchase from DigiWorld!\n\nYour PayPal payment for order ${orderID} has been successfully processed.\n\nHere are your digital license key(s):\n\n${fulfilledKeys.map(fk => `${fk.productName}:\n${fk.key}`).join('\n\n')}\n\nIf you have any questions, please reply to this email.`;
                
                await transporter.sendMail({
                    from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                    to: email,
                    subject: `Your DigiWorld Digital License(s) for Order ${orderID}`,
                    text: emailBody
                });
            }

            // Update the final order status
            const finalStatus = outOfStockItems.length > 0 ? 'partially_fulfilled' : 'completed';
            await orderDocRef.update({ status: finalStatus, paymentStatusPaypal: paypalStatus, fulfilledAt: new Date().toISOString() });

            return { 
                statusCode: 200, 
                body: JSON.stringify({ success: true, message: 'Payment verified and key(s) delivered.' }) 
            };

        } else {
            // Handle non-completed payment statuses
            await orderDocRef.update({ status: 'failed', paymentStatusPaypal: paypalStatus });
            return { 
                statusCode: 400, 
                body: JSON.stringify({ success: false, message: `PayPal payment not completed. Status: ${paypalStatus}` }) 
            };
        }

    } catch (error) {
        console.error('Error verifying PayPal payment:', error.response ? error.response.data : error.message);
        await db.collection('orders').doc(orderID).update({ status: 'error', errorDetails: error.message }).catch(e => console.error("Failed to update order status on error:", e));
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to verify PayPal payment.' }),
        };
    }
};
