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
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    const seed = createDailySeed(todayString);

    // Calculate the end of the current day
    const saleEndDate = new Date(today);
    saleEndDate.setHours(23, 59, 59, 999);

    const productsSnapshot = await db.collection("products").get();
    const allProducts = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const validProducts = allProducts.filter(p =>
      p.price && typeof p.price === 'object' && (p.price.LKR || p.price.USD)
    );

    const shuffledProducts = [...validProducts].sort(() => 0.5 - seededRandom(seed));
    const flashSaleProducts = shuffledProducts.slice(0, 5);

    // Return both the products and the calculated end date
    return {
      statusCode: 200,
      body: JSON.stringify({
        products: flashSaleProducts,
        saleEndDate: saleEndDate.toISOString() // Send as a string
      }),
    };
  } catch (error) {
    console.error("Error in get-flash-sale-products function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }
};