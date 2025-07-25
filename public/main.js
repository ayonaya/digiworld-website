// Final, Completed, and Fully Corrected main.js for DigiWorld
import { initializeCart, addToCart, renderMiniCart } from './cart-manager.js';

// This function contains all the main application logic.
// It will only be called after the header, footer, and modals are loaded.
function runMainApp() {
    // --- DOM Elements (now safely accessed) ---
    const productGrid = document.getElementById('productGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortProductsControl = document.getElementById('sortProducts');
    const langCurrencyBtn = document.getElementById('langCurrencyBtn');
    const backBtn = document.getElementById('dwBackToTop');
    const searchInputDesktop = document.getElementById('searchInput');
    const searchSuggestionsDesktop = document.getElementById('searchSuggestionsDesktop');
    const accountControl = document.getElementById('accountControl');
    const authModal = document.getElementById('authModal');
    const authModalClose = document.getElementById('authModalClose');
    const authDropdownContent = document.getElementById('authDropdownContent');
    const modalMessage = document.getElementById('modal-message');

    // --- App State ---
    let allProducts = [];
    let flashSaleProducts = [];
    let currentLang = 'en';
    let currentCurr = localStorage.getItem('userCurrency') || 'USD';
    const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };
    const auth = firebase.auth();

    // --- Language/Currency Modal Logic ---
    if (langCurrencyBtn) {
        const modalHTML = `
        <div class="ali-modal" id="langCurrencyModal" aria-modal="true" role="dialog">
            <div class="ali-modal-content">
                <h3>Settings</h3>
                <label for="modalLangSelect">Language</label>
                <select id="modalLangSelect"><option value="en">🇺🇸 English</option><option value="si">🇱🇰 සිංහල</option><option value="ta">🇮🇳 தமிழ்</option><option value="ru">🇷🇺 Русский</option><option value="zh">🇨🇳 中文</option><option value="es">🇪🇸 Español</option></select>
                <label for="modalCurrSelect">Currency</label>
                <select id="modalCurrSelect"><option value="USD">$ USD</option><option value="LKR">🇱🇰 LKR</option><option value="INR">₹ INR</option><option value="EUR">€ EUR</option><option value="GBP">£ GBP</option></select>
                <div class="ali-modal-actions"><button class="ali-modal-btn cancel" id="modalCancelBtn">Cancel</button><button class="ali-modal-btn save" id="modalSaveBtn">Save</button></div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const langCurrencyModal = document.getElementById('langCurrencyModal');
        const modalSaveBtn = document.getElementById('modalSaveBtn');
        const modalCancelBtn = document.getElementById('modalCancelBtn');
        const modalLangSelect = document.getElementById('modalLangSelect');
        const modalCurrSelect = document.getElementById('modalCurrSelect');

        langCurrencyBtn.addEventListener('click', () => {
            modalLangSelect.value = currentLang;
            modalCurrSelect.value = currentCurr;
            langCurrencyModal.classList.add('show');
        });

        const closeModal = () => langCurrencyModal.classList.remove('show');
        modalCancelBtn.addEventListener('click', closeModal);
        langCurrencyModal.addEventListener('click', (e) => {
            if (e.target === langCurrencyModal) closeModal();
        });

        modalSaveBtn.addEventListener('click', () => {
            currentLang = modalLangSelect.value;
            currentCurr = modalCurrSelect.value;
            localStorage.setItem('userCurrency', currentCurr);
            if (document.getElementById('productGrid')) applyFiltersAndSorting();
            if (document.getElementById('flashSaleCarouselContainer')) renderFlashSaleProducts();
            renderMiniCart();
            closeModal();
        });
    }
    
    // --- Product Rendering & Page Initialization ---
    function renderProductCard(prod, context = 'grid') {
        const name = prod.name.en || 'Unnamed Product';
        const price = (prod.price[currentCurr] || prod.price.USD) || 0;
        const originalPriceValue = prod.isFlashSale ? (prod.originalPrice[currentCurr] || prod.originalPrice.USD) : 0;
        const priceHTML = prod.isFlashSale ? `<p class="product-price">${currencySymbols[currentCurr] || '$'}${price.toFixed(2)}<span class="original-price">${currencySymbols[currentCurr] || '$'}${originalPriceValue.toFixed(2)}</span></p>` : `<p class="product-price">${currencySymbols[currentCurr] || '$'}${price.toFixed(2)}</p>`;
        
        let badgeHTML = '';
        if (prod.isFlashSale && context === 'grid') {
            badgeHTML = `<div class="badge-flash-sale"><i class="fas fa-bolt"></i> Flash Sale</div>`;
        } else if (prod.isHot) {
            badgeHTML = `<div class="badge-hot">HOT</div>`;
        }
        
        const deliveryBadgeHTML = prod.delivery ? `<div class="tag-delivery">${prod.delivery.en || 'Instant Delivery'}</div>` : '';
        const stars = getStarRatingHTML(prod.averageRating);
        const reviewCount = prod.reviewCount || 0;
        const ratingHTML = `<div class="product-rating">${stars}<span class="review-count">(${reviewCount})</span></div>`;
        const buttonsHTML = context === 'carousel'
            ? `<div class="card-buttons"><button class="card-btn add-to-cart flash-sale-btn" data-id="${prod.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button></div>`
            : `<div class="card-buttons"><button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button><button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button></div>`;

        return `
            <div class="product-card" data-product-id="${prod.id}">
                ${badgeHTML}
                <button class="wishlist-btn" data-product-id="${prod.id}" aria-label="Add to Wishlist"><i class="far fa-heart"></i></button>
                <div class="card-image-container"><a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${name}" loading="lazy"/></a></div>
                <div class="card-content-wrapper">
                    ${deliveryBadgeHTML}
                    <h3 class="product-name">${name}</h3>
                    ${ratingHTML}
                    ${priceHTML}
                    ${buttonsHTML}
                </div>
            </div>`;
    }

    function renderProducts(list) {
        if (!productGrid) return;
        productGrid.innerHTML = !list || list.length === 0 ? `<p style="text-align: center; grid-column: 1 / -1;">No products found.</p>` : list.map(prod => renderProductCard(prod, 'grid')).join('');
    }
    
    function renderFlashSaleProducts() {
        const container = document.getElementById('flashSaleCarouselContainer');
        if (!container || !flashSaleProducts || flashSaleProducts.length === 0) return;
        container.innerHTML = flashSaleProducts.map(prod => `<div class="swiper-slide">${renderProductCard(prod, 'carousel')}</div>`).join('');
    }

    function getStarRatingHTML(rating) {
        let html = '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        for (let i = 0; i < fullStars; i++) html += '<i class="fas fa-star"></i>';
        if (halfStar) html += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < 5 - fullStars - halfStar; i++) html += '<i class="far fa-star"></i>';
        return html;
    }

    function showSkeletonLoaders() {
        if (!productGrid) return;
        productGrid.innerHTML = Array(8).fill('').map(() => `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-content"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>`).join('');
    }

    function applyFiltersAndSorting() {
        const combinedProducts = [...allProducts, ...flashSaleProducts];
        if (!combinedProducts.length) return;
        let filteredProducts = [...combinedProducts];
        
        if (categoryFilter && categoryFilter.value !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === categoryFilter.value);
        }
        if (sortProductsControl) {
            const sortValue = sortProductsControl.value;
            switch (sortValue) {
                case 'price-asc': filteredProducts.sort((a, b) => (a.price[currentCurr] || a.price.USD) - (b.price[currentCurr] || b.price.USD)); break;
                case 'price-desc': filteredProducts.sort((a, b) => (b.price[currentCurr] || b.price.USD) - (a.price[currentCurr] || a.price.USD)); break;
                case 'name-asc': filteredProducts.sort((a, b) => a.name.en.localeCompare(b.name.en)); break;
                case 'name-desc': filteredProducts.sort((a, b) => b.name.en.localeCompare(a.name.en)); break;
            }
        }
        renderProducts(filteredProducts);
    }

    function handleSearch(inputElement, suggestionsElement) {
        if (!inputElement || !suggestionsElement) return;
        const val = inputElement.value.trim().toLowerCase();
        const allAvailableProducts = [...allProducts, ...flashSaleProducts];
        if (val.length < 1) {
            suggestionsElement.style.display = 'none';
            return;
        }
        const result = allAvailableProducts.filter(p => (p.name.en || '').toLowerCase().includes(val));
        suggestionsElement.innerHTML = result.map(p => `<div class="suggestion-item" onclick="window.location='product-details.html?id=${p.id}'">${p.name.en.replace(new RegExp(val, 'gi'), `<b>$&</b>`)}</div>`).join('');
        suggestionsElement.style.display = result.length > 0 ? 'block' : 'none';
    }

    function initializeFlashSaleCountdown() {
        const hoursEl = document.getElementById('flash-hours');
        const minutesEl = document.getElementById('flash-minutes');
        const secondsEl = document.getElementById('flash-seconds');
        if (!hoursEl) return;
    
        const timerInterval = setInterval(() => {
            const now = new Date();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
            const distance = endOfDay - now;
            if (distance < 0) {
                clearInterval(timerInterval);
                window.location.reload();
                return;
            }
            hoursEl.textContent = Math.floor(distance / 3600000).toString().padStart(2, '0');
            minutesEl.textContent = Math.floor((distance % 3600000) / 60000).toString().padStart(2, '0');
            secondsEl.textContent = Math.floor((distance % 60000) / 1000).toString().padStart(2, '0');
        }, 1000);
    }

    async function initializePage() {
        if (productGrid) showSkeletonLoaders();
        // Product data is now pre-loaded by loadAllProductData
        applyFiltersAndSorting();
        renderFlashSaleProducts();
        
        if (document.getElementById('flashSaleCarousel') && typeof Swiper !== 'undefined') {
            new Swiper('#flashSaleCarousel', { slidesPerView: 1, spaceBetween: 30, navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }, breakpoints: { 640: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 }, 1200: { slidesPerView: 5 } } });
        }
    }

    // --- Banner Slider Logic ---
    const sliderContainer = document.getElementById('hero-slider');
    if (sliderContainer) {
        const bannerFiles = ['banner_1_powerful.html', 'banner_2_final.html', 'banner_3_unique.html', 'banner_4_flashsale.html'];
        Promise.all(bannerFiles.map(file => fetch(file).then(res => res.text())))
            .then(banners => {
                sliderContainer.innerHTML = banners.map(b => `<div class="slider-slide">${b}</div>`).join('');
                initializeSlider();
            });

        function initializeSlider() {
            const slides = sliderContainer.querySelectorAll('.slider-slide');
            if (slides.length === 0) return;
            let currentSlide = 0;
            slides[0].classList.add('active');
            const nextSlide = () => {
                currentSlide = (currentSlide + 1) % slides.length;
                slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
            };
            let slideInterval = setInterval(nextSlide, 8000);
            const nextBtn = sliderContainer.parentElement.querySelector('.slider-nav.next');
            const prevBtn = sliderContainer.parentElement.querySelector('.slider-nav.prev');
            if(nextBtn) nextBtn.addEventListener('click', () => { clearInterval(slideInterval); nextSlide(); slideInterval = setInterval(nextSlide, 8000); });
            if(prevBtn) prevBtn.addEventListener('click', () => { clearInterval(slideInterval); currentSlide = (currentSlide - 1 + slides.length) % slides.length; slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide)); slideInterval = setInterval(nextSlide, 8000); });
        }
    }

    // --- Authentication UI & Global Listeners ---
    const openAuthModal = () => { if(authModal) authModal.classList.add('show'); };
    const closeAuthModal = () => { if(authModal) authModal.classList.remove('show'); };
    
    function renderLoggedOutMenu() {
        if (!authDropdownContent) return;
        authDropdownContent.innerHTML = `<button class="auth-dropdown-signin-btn" id="dropdownSignInBtn">Sign In</button><a href="#" class="register-link" id="dropdownRegisterBtn">Register</a>`;
        document.getElementById('dropdownSignInBtn')?.addEventListener('click', openAuthModal);
        document.getElementById('dropdownRegisterBtn')?.addEventListener('click', openAuthModal);
    }

    function renderLoggedInMenu(user) {
        if (!authDropdownContent) return;
        authDropdownContent.innerHTML = `<a href="profile.html"><i class="fas fa-user-circle"></i> Profile</a><a href="orders.html"><i class="fas fa-box"></i> Orders</a><a href="downloads.html"><i class="fas fa-download"></i> Downloads</a><hr><a href="#" id="dropdownLogoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
        document.getElementById('dropdownLogoutBtn')?.addEventListener('click', () => auth.signOut());
    }

    auth.onAuthStateChanged(user => {
        if (!accountControl) return;
        const welcomeText = accountControl.querySelector('.welcome-text');
        const authAction = accountControl.querySelector('.auth-action');
        if (user) {
            welcomeText.textContent = 'Welcome';
            authAction.textContent = user.displayName || user.email.split('@')[0];
            renderLoggedInMenu(user);
        } else {
            welcomeText.textContent = 'Welcome';
            authAction.textContent = 'Sign In / Register';
            renderLoggedOutMenu();
        }
    });
    
    if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
    if (authModal) authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });

    const googleProvider = new firebase.auth.GoogleAuthProvider();
    document.getElementById('googleSignInBtn')?.addEventListener('click', () => auth.signInWithPopup(googleProvider).catch(err => { if(modalMessage) modalMessage.textContent = err.message; }));
    
    const appleProvider = new firebase.auth.OAuthProvider('apple.com');
    document.getElementById('appleSignInBtn')?.addEventListener('click', () => auth.signInWithPopup(appleProvider).catch(err => { if(modalMessage) modalMessage.textContent = err.message; }));

    document.getElementById('emailLoginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        auth.sendSignInLinkToEmail(email, { url: window.location.href, handleCodeInApp: true })
          .then(() => {
                window.localStorage.setItem('emailForSignIn', email);
                if(modalMessage) modalMessage.textContent = `A sign-in link has been sent to ${email}.`;
          })
          .catch(err => { if(modalMessage) modalMessage.textContent = err.message; });
    });
    
    if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersAndSorting);
    if (sortProductsControl) sortProductsControl.addEventListener('change', applyFiltersAndSorting);
    if (searchInputDesktop) searchInputDesktop.addEventListener('input', () => handleSearch(searchInputDesktop, searchSuggestionsDesktop));
    
    // --- FINAL, UPGRADED: Event Delegation for Product Buttons ---
    document.body.addEventListener('click', async (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart');
        const buyNowBtn = e.target.closest('.buy-now');
        const wishlistBtn = e.target.closest('.wishlist-btn');

        if (addToCartBtn && !addToCartBtn.classList.contains('added')) {
            const productId = addToCartBtn.dataset.id;
            addToCart(productId);

            // --- Haptic Feedback for Mobile ---
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }

            // --- UPGRADED: Curved Fly-to-Cart Animation ---
            const card = addToCartBtn.closest('.product-card');
            const img = card?.querySelector('.card-image');
            const cartIcon = document.getElementById('cartBtn');
            if (img && cartIcon) {
                const imgRect = img.getBoundingClientRect();
                const cartRect = cartIcon.getBoundingClientRect();

                const flyingImage = img.cloneNode(true);
                flyingImage.classList.add('flying-image');
                
                flyingImage.style.width = `${imgRect.width}px`;
                flyingImage.style.height = `${imgRect.height}px`;
                
                // Set CSS variables to control the start, end, and curve points of the animation
                flyingImage.style.setProperty('--start-x', `${imgRect.left}px`);
                flyingImage.style.setProperty('--start-y', `${imgRect.top}px`);
                flyingImage.style.setProperty('--end-x', `${cartRect.left + cartRect.width / 2}px`);
                flyingImage.style.setProperty('--end-y', `${cartRect.top + cartRect.height / 2}px`);
                flyingImage.style.setProperty('--control-x', `${(imgRect.left + cartRect.left) / 2}px`);
                flyingImage.style.setProperty('--control-y', `${imgRect.top - 70}px`);

                document.body.appendChild(flyingImage);

                // Animate the cart button after a slight delay
                setTimeout(() => {
                    cartIcon.classList.add('animated');
                }, 600);
                
                // Clean up the animations
                setTimeout(() => {
                    flyingImage.remove();
                    cartIcon.classList.remove('animated');
                }, 900);
            }
            
            // --- "Added!" Button Animation ---
            addToCartBtn.innerHTML = 'Added! <i class="fas fa-check"></i>';
            addToCartBtn.classList.add('added');
            setTimeout(() => {
                const originalText = addToCartBtn.classList.contains('flash-sale-btn') 
                    ? '<i class="fas fa-shopping-cart"></i> Add to Cart' 
                    : 'Add to Cart';
                addToCartBtn.innerHTML = originalText;
                addToCartBtn.classList.remove('added');
            }, 2000);
        }

        if (buyNowBtn) {
            addToCart(buyNowBtn.dataset.id);
            window.location.href = 'checkout.html';
        }
        if (wishlistBtn) { /* ... wishlist logic ... */ }
    });

    if (backBtn) {
        backBtn.onclick = () => window.scrollTo({top:0, behavior:'smooth'});
        window.addEventListener('scroll', () => { backBtn.style.display = (window.scrollY > 300) ? 'flex' : 'none'; });
    }
    
    // --- Centralized Data Fetching & Page Initialization ---
    async function loadApp() {
        await loadAllProductData();
        if (document.getElementById('productGrid') || document.getElementById('hero-slider')) {
            initializePage();
        }
        initializeFlashSaleCountdown();
    }

    async function loadAllProductData() {
        try {
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.success) {
                allProducts = data.products;
                flashSaleProducts = data.flashSaleProducts;
                initializeCart([...allProducts, ...flashSaleProducts]);
            } else {
                throw new Error(data.message || 'Could not retrieve products.');
            }
        } catch (error) {
            console.error("Error fetching products for search/cart:", error);
            initializeCart([]);
        }
    }
    
    loadApp();
}

// --- NEW SCRIPT STRUCTURE ---
// 1. Initialize Firebase as soon as possible by fetching the config securely.
async function initializeFirebase() {
    try {
        const response = await fetch('/.netlify/functions/get-firebase-config');
        if (!response.ok) throw new Error('Could not load Firebase configuration.');
        const firebaseConfig = await response.json();
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
    } catch (error) {
        console.error("Critical Error: Firebase Initialization Failed.", error);
        document.body.innerHTML = 'Error loading site configuration. Please try again later.';
    }
}

// 2. Main execution flow
async function startApp() {
    await initializeFirebase();
    // Listen for our custom 'componentsLoaded' event, then run the main app logic.
    document.addEventListener('componentsLoaded', runMainApp);
}

startApp();