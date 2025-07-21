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
    const today = new Date().toISOString().slice(0, 10);
    const seed = createDailySeed(today);

    const productsSnapshot = await db.collection("products").get();
    const allProducts = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ** THE FIX IS HERE **
    // First, filter out any products that don't have a valid price.
    const validProducts = allProducts.filter(p => p.price != null && !isNaN(p.price));

    // Now, shuffle only the products that have a valid price.
    const shuffledProducts = [...validProducts].sort(() => 0.5 - seededRandom(seed));

    // Take the first 5 products and create the sale.
    const flashSaleProducts = shuffledProducts.slice(0, 5).map((product) => {
      const originalPrice = parseFloat(product.price);
      
      return {
        ...product,
        originalPrice: originalPrice,
        price: parseFloat((originalPrice * 0.9).toFixed(2)),
        discount: "10%",
      };
    });

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