document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const productGrid = document.getElementById('productGrid');
    const sliderContainer = document.getElementById('hero-slider');
    let searchInput;
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};

    // ===============================
    // CART FUNCTIONS
    // ===============================
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
        // ---- Animation for Add to Cart button ----
        const button = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
        if (button) {
            button.disabled = true;
            const originalText = button.textContent;
            button.textContent = "Added!";
            button.classList.add("added");
            setTimeout(() => {
                button.disabled = false;
                button.textContent = originalText;
                button.classList.remove("added");
            }, 1300);
        }
        animateFlyToCart(productId);
    }

    function animateFlyToCart(productId) {
        const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        const img = card ? card.querySelector("img.card-image") : null;
        const cartIcon = document.getElementById("cartBtn");
        if (!img || !cartIcon) return;
        const imgRect = img.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();
        const flyImg = img.cloneNode(true);
        flyImg.style.position = "fixed";
        flyImg.style.left = imgRect.left + "px";
        flyImg.style.top = imgRect.top + "px";
        flyImg.style.width = imgRect.width + "px";
        flyImg.style.height = imgRect.height + "px";
        flyImg.style.zIndex = 9999;
        flyImg.style.pointerEvents = "none";
        flyImg.style.transition = "all 1s cubic-bezier(.67,-0.55,.27,1.55), opacity 0.8s";
        flyImg.style.opacity = "1";
        document.body.appendChild(flyImg);
        setTimeout(() => {
            flyImg.style.left = (cartRect.left + cartRect.width / 2 - imgRect.width / 4) + "px";
            flyImg.style.top = (cartRect.top + cartRect.height / 2 - imgRect.height / 4) + "px";
            flyImg.style.width = imgRect.width / 2 + "px";
            flyImg.style.height = imgRect.height / 2 + "px";
            flyImg.style.opacity = "0.3";
        }, 20);
        setTimeout(() => {
            document.body.removeChild(flyImg);
        }, 1020);
    }

    // ===============================
    // BANNERS / SLIDER
    // ===============================
    async function loadBanners() {
        if (!sliderContainer) return;
        const bannerFiles = [
            'banner_1_powerful.html',
            'banner_2_final.html',
            'banner_3_unique.html',
            'banner_4_flashsale.html'
        ];
        sliderContainer.innerHTML = "";
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

    // ===============================
    // FETCH AND RENDER PRODUCTS
    // ===============================
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
        if (!productsToRender.length) {
            productGrid.innerHTML = `<p style="text-align:center;color:#aaa;">No products found.</p>`;
            return;
        }
        productGrid.innerHTML = productsToRender.map(prod => {
            const hotBadgeHTML = prod.isHot ? '<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>' : '';
            const deliveryText = prod.delivery && prod.delivery.en ? `<div class="tag-delivery">${prod.delivery.en}</div>` : '';
            return `
            <div class="product-card" data-product-id="${prod.id}">
                ${hotBadgeHTML}
                <div class="card-image-container"><a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${prod.name && prod.name.en ? prod.name.en : ''}" loading="lazy"/></a></div>
                <div class="card-content-wrapper">
                    <h3 class="product-name">${prod.name && prod.name.en ? prod.name.en : ''}</h3>
                    ${deliveryText}
                    <p class="product-price">$${prod.price && prod.price.USD ? prod.price.USD.toFixed(2) : ''}</p>
                    <div class="card-buttons">
                        <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
                        <button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // ===============================
    // EVENT LISTENERS (PRODUCT BUTTONS)
    // ===============================
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart')) {
            addToCart(e.target.closest('.add-to-cart').dataset.id);
        }
        if (e.target.closest('.buy-now')) {
            addToCart(e.target.closest('.buy-now').dataset.id);
            window.location.href = 'checkout.html';
        }
    });

    // ===============================
    // SEARCH BAR FUNCTIONALITY
    // ===============================
    function setupSearchListener() {
        searchInput = document.getElementById('searchInput');
        const suggestionsBox = document.getElementById('searchSuggestionsDesktop');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase().trim();
                const filtered = allProducts.filter(
                    p => p.name && p.name.en && p.name.en.toLowerCase().includes(query)
                );
                renderProducts(filtered);
                // Show suggestions
                if (suggestionsBox) {
                    if (query && filtered.length) {
                        suggestionsBox.innerHTML = filtered.slice(0, 5).map(prod => `
                            <div class="suggestion-item" tabindex="0" data-id="${prod.id}">
                                <span>${prod.name.en}</span>
                            </div>
                        `).join('');
                        suggestionsBox.classList.add('visible');
                    } else {
                        suggestionsBox.innerHTML = '';
                        suggestionsBox.classList.remove('visible');
                    }
                }
            });
            if (suggestionsBox) {
                suggestionsBox.addEventListener('click', (e) => {
                    const item = e.target.closest('.suggestion-item');
                    if (item) {
                        const id = item.getAttribute('data-id');
                        window.location.href = `product-details.html?id=${id}`;
                    }
                });
                suggestionsBox.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.target.classList.contains('suggestion-item')) {
                        const id = e.target.getAttribute('data-id');
                        window.location.href = `product-details.html?id=${id}`;
                    }
                });
            }
            document.addEventListener('click', (e) => {
                if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.classList.remove('visible');
                }
                if (e.target.closest('.add-to-cart') || e.target.closest('.buy-now')) {
                    if (suggestionsBox) {
                        suggestionsBox.innerHTML = '';
                        suggestionsBox.classList.remove('visible');
                    }
                }
            });
        }
    }

    // Wait for header to load, then set up search listener and update cart badge
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        const observer = new MutationObserver((mutations, obs) => {
            if (document.getElementById('searchInput')) {
                setupSearchListener();
                updateCartBadge();
                obs.disconnect();
            }
        });
        observer.observe(headerPlaceholder, { childList: true, subtree: true });
    } else {
        updateCartBadge();
    }

    // ===============================
    // INITIALIZATION
    // ===============================
    await loadBanners();
    await fetchAndRenderProducts();
});
