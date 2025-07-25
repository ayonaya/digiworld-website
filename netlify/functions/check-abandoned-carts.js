// /netlify/functions/check-abandoned-carts.js
const { db } = require('./firebase-admin');
const nodemailer = require('nodemailer');

// Configure the email transporter using your environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

exports.handler = async () => {
    console.log('Running Abandoned Cart Check...');

    try {
        const now = new Date();
        // Carts are considered abandoned if they were last updated between 3 and 24 hours ago
        const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        // Query Firestore for carts updated in the abandoned window
        const snapshot = await db.collection('carts')
            .where('updatedAt', '<=', threeHoursAgo)
            .where('updatedAt', '>', twentyFourHoursAgo)
            .get();

        if (snapshot.empty) {
            console.log('No abandoned carts found in the target window.');
            return { statusCode: 200, body: 'No abandoned carts to process.' };
        }

        let emailsSent = 0;
        for (const doc of snapshot.docs) {
            const cartData = doc.data();
            const userEmail = cartData.userEmail;

            // Prevent sending multiple reminders for the same cart
            if (cartData.reminderSent) {
                continue;
            }

            console.log(`Found abandoned cart for ${userEmail}. Sending reminder.`);

            // Email content
            const emailBody = `
                <h2>Forgot Something?</h2>
                <p>Hi there,</p>
                <p>We noticed you left some items in your shopping cart at DigiWorld. Don't miss out on these great products!</p>
                <p>Your cart is saved and waiting for you. <a href="https://digiworldnew.com/cart.html">Click here to complete your purchase.</a></p>
                <br>
                <p>Thanks,</p>
                <p>The DigiWorld Team</p>
            `;

            await transporter.sendMail({
                from: `"DigiWorld" <${process.env.GMAIL_USER}>`,
                to: userEmail,
                subject: 'You left something in your cart!',
                html: emailBody,
            });

            // Mark the cart so we don't email them again
            await doc.ref.update({ reminderSent: true });
            emailsSent++;
        }

        console.log(`Successfully sent ${emailsSent} reminder emails.`);
        return {
            statusCode: 200,
            body: `Processed abandoned carts. Sent ${emailsSent} emails.`,
        };

    } catch (error) {
        console.error('Error during abandoned cart check:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred during the process.' }),
        };
    }
};