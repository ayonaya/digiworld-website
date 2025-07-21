const { db } = require('./firebase-admin');

// Helper functions (no changes needed)
const createDailySeed = (dateString) => {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
};
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

    // Filter for products that have a valid price object
    const validProducts = allProducts.filter(p =>
      p.price && typeof p.price === 'object' && (p.price.LKR || p.price.USD)
    );

    const shuffledProducts = [...validProducts].sort(() => 0.5 - seededRandom(seed));

    // Just select the top 5 products. No price calculation here.
    const flashSaleProducts = shuffledProducts.slice(0, 5);

    return {
      statusCode: 200,
      body: JSON.stringify(flashSaleProducts),
    };
  } catch (error) {
    console.error("Error in get-flash-sale-products function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }
};