// server.js
const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
const fs = require('fs');

console.log("Starting server.js...");

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Handle POST requests to /buy-key
app.post('/buy-key', async (req, res) => {
    try {
        // 1. Read and update key inventory
        let keys = JSON.parse(fs.readFileSync('keys.json'));
        if (keys.length === 0) {
            return res.json({ key: "Sorry, no keys available right now." });
        }
        const key = keys.shift(); // Remove first key
        fs.writeFileSync('keys.json', JSON.stringify(keys)); // Update file

        // 2. Get user's email from request
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "No email provided" });
        }

        // 3. Configure nodemailer transporter with environment variables
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,  // From Render env vars
                pass: process.env.GMAIL_PASS,  // From Render env vars
            }
        });

        // 4. Send email
        await transporter.sendMail({
            from: `"KeyZone" <${process.env.GMAIL_USER}>`, // Sender address
            to: email,                                     // Recipient's email
            subject: 'Your Digital Key',                   // Email subject
            text: `Thank you for your purchase!\n\nHere is your key: ${key}\n\nIf you have any questions, reply to this email.`
        });

        // 5. Respond to client
        res.json({ key });

    } catch (err) {
        console.error(err); // Log full error to terminal
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// Use Render's provided port (for production) or fallback to 3000 (for local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
