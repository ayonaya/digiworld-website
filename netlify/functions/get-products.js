// /netlify/functions/get-products.js
const { db } = require('./firebase-admin');
const axios = require('axios');

// --- Caching for Exchange Rates ---
// This simple cache will store rates for a few hours to prevent
// hitting the API on every single request, which is efficient and saves your API quota.
let cachedRates = null;
let lastFetchTime = 0;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

async function getExchangeRates() {
    const now = Date.now();
    if (cachedRates && (now - lastFetchTime < CACHE_DURATION)) {
        console.log("Returning cached exchange rates.");
        return cachedRates;
    }

    console.log("Fetching new exchange rates from API...");
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    if (!apiKey) throw new Error('Exchange rate API key is not configured.');

    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
    if (response.data.result !== 'success') {
        throw new Error('Failed to fetch valid exchange rates from API.');
    }
    cachedRates = response.data.conversion_rates;
    lastFetchTime = now;
    return cachedRates;
}

// --- Daily Flash Sale Logic ---
function getDailyFlashSaleProducts(allProducts) {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const seededRandom = (seed) => {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const shuffled = [...allProducts].sort(() => 0.5 - seededRandom(dayOfYear));
    const selectedProducts = shuffled.slice(0, 5);

    return selectedProducts.map(product => {
        const discountedPrice = {};
        for (const currency in product.price) {
            discountedPrice[currency] = parseFloat((product.price[currency] * 0.9).toFixed(2));
        }
        return {
            ...product,
            originalPrice: product.price,
            price: discountedPrice,
            isFlashSale: true
        };
    });
}

exports.handler = async (event) => {
  try {
    // --- Step 1: Get All Necessary Data Concurrently ---
    const [rates, productsSnapshot, reviewsSnapshot] = await Promise.all([
        getExchangeRates(),
        db.collection('products').get(),
        db.collection('reviews').where('isApproved', '==', true).get()
    ]);

    // --- Step 2: Process Reviews ---
    const ratings = {};
    reviewsSnapshot.forEach(doc => {
      const review = doc.data();
      if (!ratings[review.productId]) {
        ratings[review.productId] = { total: 0, count: 0 };
      }
      ratings[review.productId].total += review.rating;
      ratings[review.productId].count += 1;
    });

    // --- Step 3: Process Products with Automatic Currency Conversion ---
    let products = productsSnapshot.docs.map(doc => {
        const productData = doc.data();
        const product = { id: doc.id, ...productData };

        // --- AUTOMATIC CURRENCY CONVERSION ---
        const priceUSD = productData.priceUSD;
        product.price = {
            USD: priceUSD,
            LKR: parseFloat((priceUSD * rates.LKR).toFixed(2)),
            INR: parseFloat((priceUSD * rates.INR).toFixed(2)),
            EUR: parseFloat((priceUSD * rates.EUR).toFixed(2)),
            GBP: parseFloat((priceUSD * rates.GBP).toFixed(2))
        };
        // --- END CONVERSION ---

        const productRating = ratings[product.id];
        product.averageRating = productRating ? (productRating.total / productRating.count) : 0;
        product.reviewCount = productRating ? productRating.count : 0;
      
        return product;
    });

    // --- Step 4: Generate Flash Sales and Final Product Lists ---
    const flashSaleProducts = getDailyFlashSaleProducts(products);
    const flashSaleIds = new Set(flashSaleProducts.map(p => p.id));
    const regularProducts = products.filter(p => !flashSaleIds.has(p.id));

    // --- Step 5: Handle API Response ---
    const id = event.queryStringParameters?.id;
    if (id) {
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
          success: true, 
          products: regularProducts, 
          flashSaleProducts 
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