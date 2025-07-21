// File: netlify/functions/select-daily-flash-sale.js

const { db } = require('./firebase-config');

// Helper function to shuffle an array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

exports.handler = async function(event, context) {
  console.log("Starting daily flash sale selection...");

  try {
    const productsRef = db.collection('products');
    const batch = db.batch(); // Use a batch to perform multiple writes efficiently

    // --- Step 1: Clear yesterday's flash sale items ---
    const oldSaleSnapshot = await productsRef.where('isFlashSale', '==', true).get();
    if (!oldSaleSnapshot.empty) {
      console.log(`Clearing ${oldSaleSnapshot.size} old sale items.`);
      oldSaleSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          isFlashSale: false,
          salePrice: admin.firestore.FieldValue.delete() // Remove the salePrice field
        });
      });
    }

    // --- Step 2: Get all available products ---
    const allProductsSnapshot = await productsRef.get();
    const allProducts = [];
    allProductsSnapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));

    if (allProducts.length < 5) {
      throw new Error("Not enough products in the database to run a flash sale.");
    }

    // --- Step 3: Randomly select 5 products ---
    const selectedProducts = shuffleArray(allProducts).slice(0, 5);
    console.log(`Selected ${selectedProducts.length} new products for the flash sale.`);

    // --- Step 4: Tag new products and set the discounted price ---
    selectedProducts.forEach(product => {
      // Calculate 10% discount and round to 2 decimal places
      const salePrice = parseFloat((product.price * 0.9).toFixed(2));
      const productRef = productsRef.doc(product.id);
      batch.update(productRef, {
        isFlashSale: true,
        salePrice: salePrice,
        originalPrice: product.price // Ensure originalPrice is stored
      });
    });

    // --- Step 5: Commit all the changes to the database ---
    await batch.commit();

    console.log("Successfully updated flash sale products.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Flash sale products selected successfully." }),
    };

  } catch (error) {
    console.error("Error during flash sale selection:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};