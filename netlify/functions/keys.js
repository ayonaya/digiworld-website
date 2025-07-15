// netlify/functions/keys.js
// !!! IMPORTANT !!!
// This is a TEMPORARY, simplified key management for demonstration purposes ONLY.
// For a production system, you MUST replace this with a proper, persistent database
// solution (e.g., FaunaDB, Google Firestore, AWS DynamoDB) to store and manage your
// digital keys securely and reliably.
// File system operations (fs.readFile, fs.writeFile) DO NOT WORK
// persistently across serverless function invocations on Netlify.

// Define your list of digital keys here.
// In a real application, these would be fetched from a database.
const allDigitalKeys = [
    "DIGIWORLD-KEY-ALPHA-001",
    "DIGIWORLD-KEY-BETA-002",
    "DIGIWORLD-KEY-GAMMA-003",
    "DIGIWORLD-KEY-DELTA-004",
    "DIGIWORLD-KEY-EPSILON-005",
    "DIGIWORLD-KEY-ZETA-006",
    // Add all your actual digital keys here.
    // Ensure you have enough keys for your expected sales volume.
];

// This array will be used to "simulate" consumption for a single function run.
// It will reset with each new function invocation.
let currentAvailableKeys = [...allDigitalKeys]; 

/**
 * Simulates retrieving and "consuming" the next available digital key.
 * In a real-world scenario, this function would interact with a database
 * to fetch an unused key and then mark it as used.
 * @returns {Promise<string|null>} The next available key, or null if none are left (in this simulation).
 */
async function getNextAvailableKey() {
    // In a production setup with a database:
    // 1. Connect to your database (e.g., Firestore, FaunaDB).
    // 2. Query for an available (unused) key.
    // 3. Mark that key as used in the database.
    // 4. Return the key.
    // If no keys are available, return null.

    if (currentAvailableKeys.length === 0) {
        console.warn("Simulated: No more keys available in the in-memory array. THIS IS A CRITICAL ISSUE IN PRODUCTION WITHOUT A DATABASE!");
        return null;
    }

    // Simulate key consumption from the in-memory array
    const key = currentAvailableKeys.shift();
    console.log(`Simulated key retrieval: ${key}. Remaining in-memory keys for this invocation: ${currentAvailableKeys.length}`);
    return key;
}

module.exports = {
    getNextAvailableKey,
};
