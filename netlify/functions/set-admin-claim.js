// netlify/functions/set-admin-claim.js
const { admin } = require('./firebase-admin'); // Note: We need the full admin SDK here

exports.handler = async (event, context) => {
    // This function should only be run once manually to set up your admin account.
    // It is protected by your master admin password from the environment variables.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, adminPassword } = JSON.parse(event.body);
        const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (adminPassword !== SERVER_ADMIN_PASSWORD) {
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized.' }) };
        }
        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Email address is required.' }) };
        }

        // Look up the user by their email in Firebase Authentication
        const user = await admin.auth().getUserByEmail(email);
        
        // Set a custom claim on their account. This is the "admin role".
        await admin.auth().setCustomUserClaims(user.uid, { isAdmin: true });

        console.log(`Admin role set for user: ${email}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `Success! User ${email} has been granted admin privileges.` })
        };
    } catch (error) {
        console.error('Error setting admin claim:', error);
        return { statusCode: 500, body: JSON.stringify({ success: false, message: error.message }) };
    }
};