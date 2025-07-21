const { db } = require('./firebase-admin');

// Helper function to create a consistent daily "random" seed from the date
const createDailySeed = (dateString) => {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// A seeded random number generator to make "randomness" predictable for the day
const seededRandom = (seed) => {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
};

exports.handler = async () => {
  try {
    // 1. Use today's date to ensure the products are the same for the whole day
    const today = new Date().toISOString().slice(0, 10);
    const seed = createDailySeed(today);

    // 2. Fetch all products from your database
    const productsSnapshot = await db.collection("products").get();
    const allProducts = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 3. Shuffle the products array using the daily seed
    const shuffledProducts = [...allProducts].sort(() => 0.5 - seededRandom(seed));

    // 4. Take the first 5 products and give them a 10% discount
    const flashSaleProducts = shuffledProducts.slice(0, 5).map((product) => ({
      ...product,
      originalPrice: product.price,
      price: parseFloat((product.price * 0.9).toFixed(2)), // Apply 10% discount
      discount: "10%",
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(flashSaleProducts),
    };
  } catch (error) {
    console.error("Error fetching flash sale products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }
};