document.addEventListener('DOMContentLoaded', async function() {
    // --- VARIABLE & STATE SETUP ---
    // DOM Elements
    const productGrid = document.getElementById('productGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortProductsControl = document.getElementById('sortProducts');
    const langDropdown = document.getElementById('langDropdown');
    const currencyDropdown = document.getElementById('currencyDropdown');
    const cartBtn = document.getElementById('cartBtn');
    const miniCartDrawer = document.getElementById('miniCartDrawer');
    const miniCartOverlay = document.getElementById('miniCartOverlay');
    const miniCartItems = document.getElementById('miniCartItems');
    const miniCartTotal = document.getElementById('miniCartTotal');
    const miniCartClose = document.getElementById('miniCartClose');
    const searchInputDesktop = document.getElementById('searchInput');
    const searchSuggestionsDesktop = document.getElementById('searchSuggestionsDesktop');
    const searchInputMobile = document.getElementById('mobileSearch');
    const searchSuggestionsMobile = document.getElementById('searchSuggestionsMobile');
    const slides = document.querySelectorAll('.banner-slide');
    const controls = document.getElementById('bannerSliderControls');
    const headerEl = document.querySelector('header.site-header');
    const banner = document.getElementById('bannerSlider');
    const sentinel = document.getElementById('headerSentinel');
    const dwBottomNav = document.getElementById('dwBottomNav');
    const dwNavCartBtn = document.getElementById('dwNavCart');
    const backBtn = document.getElementById('dwBackToTop');
    const modal = document.getElementById('langCurrModal');
    const openBtn = document.getElementById('mobileSwitcherBtn');
    const closeBtn = document.getElementById('langCurrCloseBtn');
    const saveBtn = document.getElementById('langCurrSaveBtn');
    const langSelect = document.getElementById('langSelect');
    const currSelect = document.getElementById('currSelect');

    // App State
    let allProducts = []; // This will be filled by our fetch call
    let currentLang = 'en';
    let currentCurr = localStorage.getItem('userCurrency') || 'USD';
    let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
    let currentSlide = 0;
    let slideTimer = null;
    let scrollPauseTimer;

    // Data Maps
    const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };
    const langFlags = { en: '🇺🇸', si: '🇱🇰', ta: '🇮🇳', ru: '🇷🇺', zh: '🇨🇳', es: '🇪🇸' };
    const langLabels = { en: 'English', si: 'සිංහල', ta: 'தமிழ்', ru: 'Русский', zh: '中文', es: 'Español' };

    // --- FUNCTIONS ---

    function renderProducts(list) {
        if (!productGrid) return;
        if (list.length === 0) {
            productGrid.innerHTML = `<p style="text-align:center; padding: 50px; grid-column: 1 / -1;">No products found.</p>`;
            return;
        }
        productGrid.innerHTML = list.map((prod) => {
            const name = (prod.name && prod.name[currentLang]) || (prod.name && prod.name['en']) || 'Unnamed Product';
            const price = (prod.price && prod.price[currentCurr]) || (prod.price && prod.price['USD']) || 0;
            const deliveryText = (prod.delivery && prod.delivery[currentLang]) || (prod.delivery && prod.delivery['en']) || '';
            const hotBadgeHTML = prod.isHot ? '<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>' : '';
            return `
                <div class="product-card" data-product-id="${prod.id}">
                    ${hotBadgeHTML}
                    <div class="card-image-container">
                        <a href="product-details.html?id=${prod.id}">
                            <img class="card-image" src="${prod.image}" alt="${name}" loading="lazy" />
                        </a>
                    </div>
                    <div class="card-content-wrapper">
                        <h3 class="product-name">${name}</h3>
                        <div class="tag-delivery">${deliveryText}</div>
                        <p class="product-price">${currencySymbols[currentCurr] || '$'}${price.toFixed(2)}</p>
                        <div class="card-buttons">
                            <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
                            <button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function showSkeletonLoaders() {
        if (!productGrid) return;
        let skeletons = '';
        for (let i = 0; i < 8; i++) {
            skeletons += `
                <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>`;
        }
        productGrid.innerHTML = skeletons;
    }

    function applyFiltersAndSorting() {
        let filteredProducts = [...allProducts];
        const selectedCategory = categoryFilter.value;
        if (selectedCategory !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
        }
        const sortValue = sortProductsControl.value;
        switch (sortValue) {
            case 'price-asc':
                filteredProducts.sort((a, b) => (a.price[currentCurr] || a.price['USD']) - (b.price[currentCurr] || b.price['USD']));
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => (b.price[currentCurr] || b.price['USD']) - (a.price[currentCurr] || a.price['USD']));
                break;
            case 'name-asc':
                filteredProducts.sort((a, b) => ((a.name && a.name[currentLang]) || '').localeCompare((b.name && b.name[currentLang]) || ''));
                break;
            case 'name-desc':
                filteredProducts.sort((a, b) => ((b.name && b.name[currentLang]) || '').localeCompare((a.name && a.name[currentLang]) || ''));
                break;
        }
        renderProducts(filteredProducts);
    }

    function animateImageToCart(event) {
        const mainCartIcon = window.innerWidth <= 650 ? document.getElementById('dwNavCart') : document.getElementById('cartBtn');
        const button = event.target;
        const card = button.closest('.product-card');
        if (!card || !mainCartIcon) return;
        const productImage = card.querySelector('.card-image');
        const startRect = productImage.getBoundingClientRect();
        const endRect = mainCartIcon.getBoundingClientRect();
        const flyingImage = productImage.cloneNode(true);
        flyingImage.classList.add('flying-image');
        flyingImage.style.left = `${startRect.left}px`;
        flyingImage.style.top = `${startRect.top}px`;
        flyingImage.style.width = `${startRect.width}px`;
        flyingImage.style.height = `${startRect.height}px`;
        document.body.appendChild(flyingImage);
        requestAnimationFrame(() => {
            flyingImage.style.left = `${endRect.left + endRect.width / 2}px`;
            flyingImage.style.top = `${endRect.top + endRect.height / 2}px`;
            flyingImage.style.width = '20px';
            flyingImage.style.height = '20px';
            flyingImage.style.transform = 'scale(0.1)';
            flyingImage.style.opacity = '0';
        });
        flyingImage.addEventListener('transitionend', () => {
            flyingImage.remove();
        });
    }

    function updateCartCount() {
        const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
        document.getElementById('cartCount').textContent = count;
        const dwCartCount = document.getElementById('dwCartCount');
        if(dwCartCount) dwCartCount.textContent = count;
    }

    function saveCart() {
        localStorage.setItem('digiworldCart', JSON.stringify(cart));
        updateCartCount();
    }

    function renderMiniCart() {
        let items = Object.entries(cart);
        if (items.length === 0) {
            miniCartItems.innerHTML = `<div style="color:#fe724c;font-weight:700;text-align:center;margin:44px 0 24px 0;">Your cart is empty.</div>`;
            miniCartTotal.textContent = (currencySymbols[currentCurr] || '$') + "0.00";
            return;
        }
        let total = 0;
        miniCartItems.innerHTML = items.map(([id, qty]) => {
            const prod = allProducts.find(p => p.id === id);
            if (!prod) return '';
            const price = (prod.price[currentCurr] || prod.price['USD']) * qty;
            const name = prod.name[currentLang] || prod.name['en'];
            total += price;
            return `
                <div class="mini-cart-item">
                    <img src="${prod.image}" class="mini-cart-item-img" alt="${name}">
                    <div class="mini-cart-item-details">
                        <div class="mini-cart-item-title">${name}</div>
                        <div class="mini-cart-item-qty">Qty: ${qty}</div>
                        <div class="mini-cart-item-price">${currencySymbols[currentCurr] || '$'}${prod.price[currentCurr] || prod.price['USD']}</div>
                    </div>
                    <span class="mini-cart-item-remove" data-remove-id="${prod.id}" role="button" tabindex="0" aria-label="Remove item">&times;</span>
                </div>
            `;
        }).join('');
        miniCartTotal.textContent = (currencySymbols[currentCurr] || '$') + total.toFixed(2);
    }

    function openMiniCart() { miniCartDrawer.classList.add('active'); miniCartOverlay.classList.add('active'); renderMiniCart(); }
    function closeMiniCart() { miniCartDrawer.classList.remove('active'); miniCartOverlay.classList.remove('active'); }

    function handleSearch(inputElement, suggestionsElement) {
        const val = inputElement.value.trim().toLowerCase();
        if (val.length === 0) { suggestionsElement.style.display = 'none'; inputElement.setAttribute('aria-expanded', 'false'); return; }
        let result = allProducts.filter(prod => {
            const prodName = ((prod.name && prod.name[currentLang]) || (prod.name && prod.name['en']) || '').toLowerCase();
            return prodName.includes(val);
        });
        if (result.length === 0) { suggestionsElement.style.display = 'none'; inputElement.setAttribute('aria-expanded', 'false'); return; }
        suggestionsElement.innerHTML = result.map(p => {
            let name = p.name[currentLang] || p.name['en'];
            let idx = name.toLowerCase().indexOf(val);
            if (idx >= 0) {
                name = name.substring(0, idx) + '<b>' + name.substring(idx, idx + val.length) + '</b>' + name.substring(idx + val.length);
            }
            return `<div class="suggestion-item" role="option" tabindex="0" onclick="window.location='product-details.html?id=${p.id}'">${name}</div>`;
        }).join('');
        suggestionsElement.style.display = 'block';
        inputElement.setAttribute('aria-expanded', 'true');
    }

    function showSlide(i) {
        slides.forEach((slide, idx) => { slide.classList.toggle('active', idx === i); });
        Array.from(controls.children).forEach((dot, idx) => { dot.classList.toggle('active', idx === i); });
        currentSlide = i;
    }

    function nextSlide() { let next = (currentSlide + 1) % slides.length; showSlide(next); }
    function resetSlideTimer() { clearInterval(slideTimer); slideTimer = setInterval(nextSlide, 5200); }
    function closeDropdowns() { document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open')); }
    
    function toggleDropdown(id) {
        const targetDropdown = document.getElementById(id);
        const wasOpen = targetDropdown.classList.contains('open');
        closeDropdowns();
        if (!wasOpen) {
            targetDropdown.classList.add('open');
        }
    }

    function showBottomNavIfMobile() {
        if (dwBottomNav) {
            dwBottomNav.style.display = window.innerWidth <= 650 ? 'flex' : 'none';
        }
    }

    // --- INITIALIZATION & FETCH ---
    showSkeletonLoaders();

    try {
        const response = await fetch('/.netlify/functions/get-products');
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || `Network error: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.success || !Array.isArray(data.products)) {
            throw new Error('API did not return a valid list of products.');
        }
        allProducts = data.products;
        renderProducts(allProducts);
    } catch (error) {
        console.error("Fatal Error fetching products:", error);
        if (productGrid) {
            productGrid.innerHTML = `<p style="text-align:center; padding: 50px; color: red; font-weight: 700; grid-column: 1 / -1;">Error loading products. Please try again later.</p>`;
        }
    }

    // --- EVENT LISTENERS ---
    categoryFilter.addEventListener('change', applyFiltersAndSorting);
    sortProductsControl.addEventListener('change', applyFiltersAndSorting);
    cartBtn.onclick = openMiniCart;
    miniCartOverlay.onclick = closeMiniCart;
    miniCartClose.onclick = closeMiniCart;
    if (dwNavCartBtn) dwNavCartBtn.onclick = openMiniCart;
    
    document.body.addEventListener('click', function(e) {
        const target = e.target;
        if (target.classList.contains('add-to-cart') || target.classList.contains('buy-now')) {
            const prodId = target.getAttribute('data-id');
            if (target.classList.contains('add-to-cart')) {
                cart[prodId] = (cart[prodId] || 0) + 1;
                saveCart();
                animateImageToCart(e);
            }
            if (target.classList.contains('buy-now')) {
                window.location.href = `checkout.html?product=${prodId}`;
            }
        }
        if (target.classList.contains('mini-cart-item-remove')) {
            const id = target.getAttribute('data-remove-id');
            if (cart[id]) {
                delete cart[id];
                saveCart();
                renderMiniCart();
            }
        }
    });

    document.querySelectorAll('#langMenu .dropdown-item').forEach(el => {
        el.onclick = () => {
            currentLang = el.getAttribute('data-lang');
            document.getElementById('currentLangFlag').textContent = langFlags[currentLang];
            document.getElementById('currentLangLabel').textContent = langLabels[currentLang];
            applyFiltersAndSorting();
            renderMiniCart();
            closeDropdowns();
        }
    });

    document.querySelector('#langDropdown .dropdown-toggle').onclick = function(e) { e.stopPropagation(); toggleDropdown('langDropdown'); };
    
    document.querySelectorAll('#currencyMenu .dropdown-item').forEach(el => {
        el.onclick = () => {
            currentCurr = el.getAttribute('data-curr');
            localStorage.setItem('userCurrency', currentCurr);
            document.getElementById('currentCurrSymbol').textContent = (currencySymbols[currentCurr] || '$');
            document.getElementById('currentCurrLabel').textContent = currentCurr;
            applyFiltersAndSorting();
            renderMiniCart();
            closeDropdowns();
        }
    });

    document.querySelector('#currencyDropdown .dropdown-toggle').onclick = function(e) { e.stopPropagation(); toggleDropdown('currencyDropdown'); };
    
    document.body.addEventListener('click', closeDropdowns);
    
    searchInputDesktop.addEventListener('input', () => handleSearch(searchInputDesktop, searchSuggestionsDesktop));
    searchInputMobile.addEventListener('input', () => handleSearch(searchInputMobile, searchSuggestionsMobile));
    
    document.addEventListener('click', () => {
        if (searchSuggestionsDesktop) searchSuggestionsDesktop.style.display = 'none';
        if (searchInputDesktop) searchInputDesktop.setAttribute('aria-expanded', 'false');
        if (searchSuggestionsMobile) searchSuggestionsMobile.style.display = 'none';
        if (searchInputMobile) searchInputMobile.setAttribute('aria-expanded', 'false');
    });

    searchInputDesktop.addEventListener('focus', () => { if (searchInputDesktop.value.trim() !== '') searchInputDesktop.dispatchEvent(new Event('input')); });
    searchInputMobile.addEventListener('focus', () => { if (searchInputMobile.value.trim() !== '') searchInputMobile.dispatchEvent(new Event('input')); });

    if (slides.length > 0 && controls) {
        slides.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.className = 'banner-slider-dot' + (idx === 0 ? ' active' : '');
            dot.onclick = () => { showSlide(idx); resetSlideTimer(); }
            controls.appendChild(dot);
        });
        if (slides.length > 1) {
            resetSlideTimer();
        }
    }
    
    updateCartCount();
    showBottomNavIfMobile();
    window.addEventListener('resize', showBottomNavIfMobile);
    if(backBtn) backBtn.onclick = () => window.scrollTo({top:0, behavior:'smooth'});
});
