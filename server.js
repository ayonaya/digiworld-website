// server.js
const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
const fs = require('fs');

console.log("Starting server.js...");

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Helper: Validate Email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Handle POST requests to /buy-key
app.post('/buy-key', async (req, res) => {
    try {
        // 1. Get data from request
        const { email, product } = req.body;
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ error: "Invalid or missing email." });
        }
        if (!product) {
            return res.status(400).json({ error: "No product selected." });
        }

        // 2. Read and update key inventory for selected product
        let keysData = JSON.parse(fs.readFileSync('keys.json'));
        let productKeys = keysData[product] || [];
        if (productKeys.length === 0) {
            return res.json({ key: "Sorry, no keys available for this product." });
        }
        const key = productKeys.shift(); // Remove first key for this product
        keysData[product] = productKeys; // Update key list for product
        fs.writeFileSync('keys.json', JSON.stringify(keysData, null, 2)); // Update file

        // 3. Configure nodemailer transporter
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'deandach790@gmail.com',       // Your Gmail
                pass: 'loaebgjspesvnehn',            // Your Gmail App Password
            }
        });

        // 4. Send email
        await transporter.sendMail({
            from: '"KeyZone" <deandach790@gmail.com>', // Sender address (must match auth user)
            to: email,                                 // Recipient's email
            subject: 'Your Digital Key',               // Email subject
            text: `Thank you for your purchase!\n\nHere is your key: ${key}\n\nIf you have any questions, reply to this email.`
        });

        // 5. Respond to client
        res.json({ key });

    } catch (err) {
        console.error(err); // Log full error to terminal
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

