// /netlify/functions/get-public-keys.js

exports.handler = async () => {
    // This function ONLY returns non-secret, public keys
    // that are safe to be used in the frontend.
    const publicKeys = {
        paypalClientId: process.env.PAYPAL_CLIENT_ID
    };

    if (!publicKeys.paypalClientId) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'PayPal Client ID is not configured on the server.' })
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, keys: publicKeys })
    };
};