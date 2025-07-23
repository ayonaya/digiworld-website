document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const productGrid = document.getElementById('productGrid');
    const sliderContainer = document.getElementById('hero-slider');
    let searchInput; // Will be assigned after header loads

    // --- App State ---
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};

    // =================================================================
    // SECTION 1: CORE LOGIC (CART, BANNERS, PRODUCTS)
    // =================================================================

    function saveCart() {
        localStorage.setItem('digiworldCart', JSON.stringify(cart));
    }

    function updateCartBadge() {
        const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
        const cartCountDesktop = document.getElementById('cartCount');
        const cartCountMobile = document.getElementById('dwCartCount');
        if (cartCountDesktop) cartCountDesktop.textContent = count;
        if (cartCountMobile) cartCountMobile.textContent = count;
    }

    function addToCart(productId) {
        cart[productId] = (cart[productId] || 0) + 1;
        saveCart();
        updateCartBadge();
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.classList.add('animated');
            setTimeout(() => cartBtn.classList.remove('animated'), 400);
        }
        // Optional: show toast or feedback here
    }
    
async function loadBanners() {
    if (!sliderContainer) return;
    // List all your banner HTML files here
    const bannerFiles = [
        'banner_1_powerful.html',
        'banner_2_final.html',
        'banner_3_unique.html',
        'banner_4_flashsale.html'
    ];
    sliderContainer.innerHTML = ""; // Clear existing slides if any
    for (const file of bannerFiles) {
        try {
            const response = await fetch(file);
            if (!response.ok) continue;
            const bannerHTML = await response.text();
            const slide = document.createElement('div');
            slide.className = 'slider-slide';
            slide.innerHTML = bannerHTML;
            sliderContainer.appendChild(slide);
        } catch (error) {
            console.error('Error loading banner:', error);
        }
    }
    initializeSlider();
}

    function initializeSlider() {
        const slides = document.querySelectorAll('.slider-slide');
        const nextBtn = document.querySelector('.slider-nav.next');
        const prevBtn = document.querySelector('.slider-nav.prev');
        if (slides.length <= 1) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (prevBtn) prevBtn.style.display = 'none';
            if (slides.length === 1) slides[0].classList.add('active');
            return;
        }
        let currentSlide = 0;
        slides[0].classList.add('active');
        const showSlide = (index) => slides.forEach((s, i) => s.classList.toggle('active', i === index));
        const nextSlide = () => { currentSlide = (currentSlide + 1) % slides.length; showSlide(currentSlide); };
        setInterval(nextSlide, 7000);
    }
    
    async function fetchAndRenderProducts() {
        if (!productGrid) return;
        showSkeletonLoaders();
        try {
            const response = await fetch('/.netlify/functions/get-products');
            const data = await response.json();
            if (data.success) {
                allProducts = data.products;
                renderProducts(allProducts);
            } else { throw new Error('Could not fetch products.'); }
        } catch (error) {
            productGrid.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        }
    }

    function showSkeletonLoaders() {
        if (!productGrid) return;
        productGrid.innerHTML = Array(8).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
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

    // =================================================================
    // SECTION 2: EVENT LISTENERS (GUARANTEED TO WORK)
    // =================================================================

    // Set up delegated event listeners for all product card buttons (and cart button)
    document.body.addEventListener('click', (e) => {
        // Add to Cart button
        if (e.target.closest('.add-to-cart')) {
            addToCart(e.target.closest('.add-to-cart').dataset.id);
        }
        // Buy Now button
        if (e.target.closest('.buy-now')) {
            addToCart(e.target.closest('.buy-now').dataset.id);
            window.location.href = 'checkout.html';
        }
        // Cart button (drawer logic, if present)
        if (e.target.closest('#cartBtn') || e.target.closest('#dwNavCart')) {
            const miniCartDrawer = document.getElementById('miniCartDrawer');
            const miniCartOverlay = document.getElementById('miniCartOverlay');
            if (miniCartDrawer) miniCartDrawer.classList.add('active');
            if (miniCartOverlay) miniCartOverlay.classList.add('active');
        }
    });

    // Set up search input live filtering (after header is loaded)
function setupSearchListener() {
    searchInput = document.getElementById('searchInput');
    if (searchInput) {
        console.log('Search input found! Adding listener.');
        searchInput.addEventListener('input', () => {
            console.log('Searching:', searchInput.value);
            const query = searchInput.value.toLowerCase().trim();
            const filtered = allProducts.filter(p => p.name.en.toLowerCase().includes(query));
            renderProducts(filtered);
        });
    } else {
        console.log('Search input NOT found!');
    }
}

    // Wait for header to load, then set up search listener and update cart badge
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        const observer = new MutationObserver((mutations, obs) => {
            if (document.getElementById('searchInput')) {
                setupSearchListener();
                updateCartBadge();
                obs.disconnect(); // Stop observing once done
            }
        });
        observer.observe(headerPlaceholder, { childList: true, subtree: true });
    } else {
        // If header not loaded, still update cart badge
        updateCartBadge();
    }

    // =================================================================
    // SECTION 3: INITIALIZATION
    // =================================================================

    await loadBanners();
    await fetchAndRenderProducts();
});
