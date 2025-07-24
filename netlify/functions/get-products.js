// /netlify/functions/get-products.js
const { db } = require('./firebase-admin');

// --- NEW: Flash Sale Logic ---
/**
 * Selects 5 products for a daily flash sale and applies a discount.
 * Uses the day of the year as a seed for the random selection, so the deals
 * are the same for all users for the entire day.
 * @param {Array} allProducts - The full list of products from the database.
 * @returns {Array} An array of 5 product objects with discounted prices.
 */
function getDailyFlashSaleProducts(allProducts) {
    // Calculate the current day of the year (1-366)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Create a simple seeded random number function
    const seededRandom = (seed) => {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    // Shuffle the products array using the day of the year as a seed for consistency
    const shuffled = [...allProducts].sort(() => 0.5 - seededRandom(dayOfYear));
    
    // Take the first 5 products for the flash sale
    const selectedProducts = shuffled.slice(0, 5);

    // Apply the 10% discount and add the original price
    return selectedProducts.map(product => {
        const discountedPrice = {};
        // Calculate the discounted price for each currency
        for (const currency in product.price) {
            discountedPrice[currency] = product.price[currency] * 0.90;
        }
        return {
            ...product,
            originalPrice: product.price, // Store the original price object
            price: discountedPrice,         // Overwrite the price object with discounted values
            isFlashSale: true               // Add a flag for easy identification on the frontend
        };
    });
}
// --- End of Flash Sale Logic ---

exports.handler = async (event) => {
  try {
    // --- Step 1: Fetch all approved reviews and calculate ratings ---
    const reviewsSnapshot = await db.collection('reviews').where('isApproved', '==', true).get();
    const ratings = {};
    reviewsSnapshot.forEach(doc => {
      const review = doc.data();
      if (!ratings[review.productId]) {
        ratings[review.productId] = { total: 0, count: 0 };
      }
      ratings[review.productId].total += review.rating;
      ratings[review.productId].count += 1;
    });

    // --- Step 2: Fetch all products and attach rating data ---
    const productsSnapshot = await db.collection('products').get();
    let productsWithRatings = productsSnapshot.docs.map(doc => {
      const product = { id: doc.id, ...doc.data() };
      const productRating = ratings[product.id];
      product.averageRating = productRating ? (productRating.total / productRating.count) : 0;
      product.reviewCount = productRating ? productRating.count : 0;
      return product;
    });

    // --- Step 3: Generate flash sale deals and separate the product lists ---
    const flashSaleProducts = getDailyFlashSaleProducts(productsWithRatings);
    const flashSaleIds = new Set(flashSaleProducts.map(p => p.id));
    
    // Create the main product list, excluding items that are in the flash sale
    let regularProducts = productsWithRatings.filter(p => !flashSaleIds.has(p.id));

    // --- Step 4: Handle API request ---
    const id = event.queryStringParameters?.id;
    if (id) {
        // If a single product is requested, find it in either list
        const singleProduct = flashSaleProducts.find(p => p.id === id) || regularProducts.find(p => p.id === id);
        if (!singleProduct) {
             return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Product not found.' }) };
        }
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true, product: singleProduct })
        };
    }

    // If all products are requested, return both lists
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
          success: true, 
          products: regularProducts,
          flashSaleProducts: flashSaleProducts // Add the flash sale list to the response
        })
    };

  } catch (error) {
    console.error("Error in get-products:", error);
    return {
      statusCode: 500,
      headers: {'Access-Control-Allow-Origin': '*'},
      body: JSON.stringify({ success: false, message: 'Internal server error.' })
    };
  }
};