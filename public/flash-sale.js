// File: public/flash-sale.js

document.addEventListener('DOMContentLoaded', () => {
  const productsContainer = document.getElementById('flash-sale-products-container');

  const displayProducts = (products) => {
    if (!products || !products.length) {
      productsContainer.innerHTML = '<p>No flash sale items right now. Check back tomorrow!</p>';
      return;
    }

    productsContainer.innerHTML = products.map(product => `
      <div class="flash-sale-product">
        <img src="${product.imageUrl}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p class="price">
          <span class="original-price" style="text-decoration: line-through; color: #888;">
            $${product.originalPrice.toFixed(2)}
          </span>
          <span class="sale-price" style="font-weight: bold; color: #d9534f;">
            $${product.salePrice.toFixed(2)}
          </span>
        </p>
      </div>
    `).join('');
  };

  const fetchFlashSaleProducts = async () => {
    try {
      // The endpoint is relative, so it works on local and live sites
      const response = await fetch('/.netlify/functions/get-flash-sale-products');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      console.error('Failed to fetch flash sale products:', error);
      productsContainer.innerHTML = '<p>Could not load flash sale products. Please try again later.</p>';
    }
  };

  // Fetch products as soon as the page loads
  fetchFlashSaleProducts();
});