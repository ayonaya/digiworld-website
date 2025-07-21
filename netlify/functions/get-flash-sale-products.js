const { db } = require('./firebase-admin');

// Helper functions (no changes here)
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

    // --- Start of New Diagnostic Logging ---
    console.log(`DIAGNOSTIC: Found ${allProducts.length} total products in the database.`);
    console.log("--- Checking each product's price and type before filtering: ---");
    allProducts.forEach(p => {
      console.log(`  - Product ID: ${p.id}, Price: ${p.price}, Type: ${typeof p.price}`);
    });
    // --- End of New Diagnostic Logging ---

    // Updated filter with more robust checking
    const validProducts = allProducts.filter(p => {
        // This check handles numbers, strings with numbers, but rejects empty strings or other text
        return p.price != null && p.price !== '' && !isNaN(parseFloat(p.price));
    });

    console.log(`DIAGNOSTIC: Found ${validProducts.length} products remaining after filtering for valid prices.`);
    
    if (validProducts.length < 5) {
        console.warn(`DIAGNOSTIC WARNING: Not enough valid products (${validProducts.length}) for the flash sale carousel to loop properly.`);
    }

    const shuffledProducts = [...validProducts].sort(() => 0.5 - seededRandom(seed));

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
    console.error("DIAGNOSTIC ERROR in get-flash-sale-products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error during flash sale processing." }),
    };
  }
};