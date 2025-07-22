import { initializeCart, addToCart } from './cart-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.getElementById('productGrid');
    let allProducts = [];

    async function fetchAndRenderProducts() {
        if (!productGrid) return;
        productGrid.innerHTML = '<p>Loading products...</p>';
        try {
            const response = await fetch('/.netlify/functions/get-products');
            const data = await response.json();
            if (data.success) {
                allProducts = data.products;
                renderProducts(allProducts);
                initializeCart(allProducts);
            } else {
                throw new Error('Could not fetch products.');
            }
        } catch (error) {
            productGrid.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        }
    }

    function renderProducts(products) {
        if (!productGrid) return;
        productGrid.innerHTML = products.map(prod => `
            <div class="product-card" data-product-id="${prod.id}">
                <div class="card-image-container"><a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${prod.name.en}" loading="lazy"/></a></div>
                <div class="card-content-wrapper">
                    <h3 class="product-name">${prod.name.en}</h3>
                    <p class="product-price">$${prod.price.USD.toFixed(2)}</p>
                    <div class="card-buttons">
                        <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
                        <button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button>
                    </div>
                </div>
            </div>`).join('');
    }

    // --- BUTTON FUNCTIONALITY FIX ---
    // This new event listener is attached to the body, so it will work for
    // all product cards, even those added to the page dynamically.
    document.body.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart');
        const buyNowBtn = e.target.closest('.buy-now');

        if (addToCartBtn) {
            const productId = addToCartBtn.dataset.id;
            addToCart(productId);
        }

        if (buyNowBtn) {
            const productId = buyNowBtn.dataset.id;
            addToCart(productId);
            window.location.href = 'checkout.html';
        }
    });

    fetchAndRenderProducts();
});