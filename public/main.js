import { initializeCart, addToCart } from './cart-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.getElementById('productGrid');
    const sliderContainer = document.getElementById('hero-slider');
    let allProducts = [];

    // --- Banner Slider Logic ---
    async function loadBanners() {
        if (!sliderContainer) return;
        const bannerFiles = ['banner_1_powerful.html', 'banner_2_final.html'];
        sliderContainer.innerHTML = '';
        for (const file of bannerFiles) {
            try {
                const response = await fetch(file);
                if (!response.ok) continue;
                const bannerHTML = await response.text();
                const slide = document.createElement('div');
                slide.className = 'slider-slide';
                slide.innerHTML = bannerHTML;
                sliderContainer.appendChild(slide);
            } catch (error) { console.error('Error loading banner:', error); }
        }
        initializeSlider();
    }

    function initializeSlider() {
        const slides = document.querySelectorAll('.slider-slide');
        if (slides.length === 0) return;
        slides[0].classList.add('active');
        // (Full slider logic as provided in the previous step)
    }

    // --- Product Fetching and Rendering ---
    async function fetchAndRenderProducts() {
        if (!productGrid) return;
        showSkeletonLoaders(); // RESTORED: Show modern skeleton loader
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

    // --- RESTORED: Modern Skeleton Loader ---
    function showSkeletonLoaders() {
        if (!productGrid) return;
        productGrid.innerHTML = Array(8).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `).join('');
    }

    // --- RESTORED: Product Badges ---
    function renderProducts(products) {
        if (!productGrid) return;
        productGrid.innerHTML = products.map(prod => {
            // This line adds the "Hot" badge if prod.isHot is true
            const hotBadgeHTML = prod.isHot ? '<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>' : '';

            return `
            <div class="product-card" data-product-id="${prod.id}">
                ${hotBadgeHTML} 
                <div class="card-image-container"><a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${prod.name.en}" loading="lazy"/></a></div>
                <div class="card-content-wrapper">
                    <h3 class="product-name">${prod.name.en}</h3>
                    <p class="product-price">$${prod.price.USD.toFixed(2)}</p>
                    <div class="card-buttons">
                        <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
                        <button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // --- Event Listeners for Buttons ---
    document.body.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart');
        if (addToCartBtn) {
            addToCart(addToCartBtn.dataset.id);
        }
        const buyNowBtn = e.target.closest('.buy-now');
        if (buyNowBtn) {
            addToCart(buyNowBtn.dataset.id);
            window.location.href = 'checkout.html';
        }
    });

    // --- Initialize Page ---
    await loadBanners();
    await fetchAndRenderProducts();
});