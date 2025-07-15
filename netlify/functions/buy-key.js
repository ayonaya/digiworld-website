// netlify/functions/buy-key.js
// This function handles direct digital key purchases (not tied to a specific payment gateway flow).

const nodemailer = require('nodemailer');
const { getNextAvailableKey } = require('./keys'); // Your temporary key management module

// Nodemailer Transporter Configuration (using environment variables)
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});

exports.handler = async (event, context) => {
    // Ensure the request is a POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Parse the request body
    const { email } = JSON.parse(event.body);

    // Validate email
    if (!email) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ error: "No email provided" }) 
        };
    }

    try {
        // !!! IMPORTANT: Replace this with proper database key retrieval !!!
        const key = await getNextAvailableKey(); // Get key from your temporary module (or real DB)

        if (key === null) {
            console.error("No digital keys available for direct purchase. Manual intervention needed.");
            // Send an alert email to your admin for manual fulfillment
            await transporter.sendMail({
                from: `"DigiWorld Alert" <${process.env.GMAIL_USER}>`,
                to: process.env.GMAIL_USER, // Send alert to your admin email
                subject: `ALERT: No Key Available for Direct Purchase`,
                text: `A direct key purchase attempt was made by ${email}, but no digital key could be retrieved from inventory. Manual fulfillment required.`
            });
            return { 
                statusCode: 200, // Return 200 so the frontend doesn't show a hard error
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ key: "Sorry, no keys available right now. Admin has been notified." }) 
            };
        }

        // Send the digital key to the customer via email
        await transporter.sendMail({
            from: `"KeyZone" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your Digital Key',
            text: `Thank you for your purchase!\n\nHere is your key: ${key}\n\nIf you have any questions, please reply to this email.`
        });

        console.log(`Digital key sent to ${email} for direct purchase.`);

        return { 
            statusCode: 200, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ key }) 
        };

    } catch (err) {
        console.error('Error in buy-key function:', err);
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ error: "Server error", details: err.message }) 
        };
    }
};
