import { initializeCart, initializeCartUI, addToCart } from './cart-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
    let allProducts = [];
    const productGrid = document.getElementById('productGrid');
    const sliderContainer = document.getElementById('hero-slider');

    // --- Banner Slider Logic ---
    async function loadBanners() { /* ... unchanged ... */ }
    function initializeSlider() { /* ... unchanged ... */ }

    // --- Product Fetching and Rendering ---
    async function fetchAndRenderProducts() {
        if (!productGrid) return;
        showSkeletonLoaders();
        try {
            const response = await fetch('/.netlify/functions/get-products');
            const data = await response.json();
            if (data.success) {
                allProducts = data.products;
                renderProducts(allProducts);
                // Initialize cart data first
                initializeCart(allProducts);
                // THEN, initialize all cart UI buttons
                initializeCartUI(); 
            } else {
                throw new Error('Could not fetch products.');
            }
        } catch (error) {
            productGrid.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        }
    }

    function showSkeletonLoaders() {
        if (!productGrid) return;
        productGrid.innerHTML = Array(8).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="skeleton-content"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
            </div>`).join('');
    }

    function renderProducts(productsToRender) {
        if (!productGrid) return;
        productGrid.innerHTML = productsToRender.map(prod => {
            const hotBadgeHTML = prod.isHot ? '<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>' : '';
            const deliveryText = prod.delivery && prod.delivery.en ? `<div class="tag-delivery">${prod.delivery.en}</div>` : '';
            return `
            <div class="product-card" data-product-id="${prod.id}">
                ${hotBadgeHTML}
                <div class="card-image-container"><a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${prod.name.en}" loading="lazy"/></a></div>
                <div class="card-content-wrapper">
                    <h3 class="product-name">${prod.name.en}</h3>
                    ${deliveryText}
                    <p class="product-price">$${prod.price.USD.toFixed(2)}</p>
                    <div class="card-buttons">
                        <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
                        <button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // --- Event Listeners for Buttons and Search Bar ---
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart')) {
            addToCart(e.target.closest('.add-to-cart').dataset.id);
        }
        if (e.target.closest('.buy-now')) {
            addToCart(e.target.closest('.buy-now').dataset.id);
            window.location.href = 'checkout.html';
        }
    });

    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        const observer = new MutationObserver(() => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const query = searchInput.value.toLowerCase().trim();
                    const filtered = allProducts.filter(p => p.name.en.toLowerCase().includes(query));
                    renderProducts(filtered);
                });
            }
        });
        observer.observe(headerPlaceholder, { childList: true, subtree: true });
    }

    // --- Initialize Page ---
    await loadBanners();
    await fetchAndRenderProducts();
});