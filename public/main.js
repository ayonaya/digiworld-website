// Final, Combined, and Fully Corrected main.js for DigiWorld
import { initializeCart, addToCart, renderMiniCart } from './cart-manager.js';

document.addEventListener('DOMContentLoaded', async function() {

    // =================================================================
    // SECTION 1: E-COMMERCE & CORE UI LOGIC
    // =================================================================

    // --- DOM Elements ---
    const productGrid = document.getElementById('productGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortProductsControl = document.getElementById('sortProducts');
    const langCurrencyBtn = document.getElementById('langCurrencyBtn');
    const backBtn = document.getElementById('dwBackToTop');
    const searchInputDesktop = document.getElementById('searchInput');
    const searchSuggestionsDesktop = document.getElementById('searchSuggestionsDesktop');
    const searchInputMobile = document.getElementById('mobileSearch');
    const searchSuggestionsMobile = document.getElementById('searchSuggestionsMobile');

    // --- App State ---
    let allProducts = [];
    let flashSaleProducts = [];
    let currentLang = 'en';
    let currentCurr = localStorage.getItem('userCurrency') || 'USD';
    const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };

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
            applyFiltersAndSorting();
            renderFlashSaleProducts();
            renderMiniCart();
            closeModal();
        });
    }

    // --- Product Rendering Functions ---
    // FINAL version: Context-aware rendering for badges and buttons
    function renderProductCard(prod, context = 'grid') { // context can be 'grid' or 'carousel'
        const name = prod.name.en || 'Unnamed Product';
        const price = (prod.price[currentCurr] || prod.price.USD) || 0;
        const originalPriceValue = prod.isFlashSale ? (prod.originalPrice[currentCurr] || prod.originalPrice.USD) : 0;
        
        const priceHTML = prod.isFlashSale 
            ? `<p class="product-price">
                   ${currencySymbols[currentCurr] || '$'}${price.toFixed(2)}
                   <span class="original-price">${currencySymbols[currentCurr] || '$'}${originalPriceValue.toFixed(2)}</span>
               </p>`
            : `<p class="product-price">${currencySymbols[currentCurr] || '$'}${price.toFixed(2)}</p>`;
        
        // --- NEW: Context-aware Badge Logic ---
        let badgeHTML = '';
        if (prod.isFlashSale) {
            badgeHTML = `<div class="badge-flash-sale"><i class="fas fa-bolt"></i> Flash Sale</div>`;
        } else if (prod.isHot) {
            badgeHTML = `<div class="badge-hot">HOT</div>`;
        }
        
        const deliveryBadgeHTML = prod.delivery ? `<div class="tag-delivery">${prod.delivery.en || 'Instant Delivery'}</div>` : '';
        const stars = getStarRatingHTML(prod.averageRating);
        const reviewCount = prod.reviewCount || 0;
        const ratingHTML = `<div class="product-rating">${stars}<span class="review-count">(${reviewCount})</span></div>`;

        // --- NEW: Context-aware Button Logic ---
        const buttonsHTML = context === 'carousel'
            ? `<div class="card-buttons">
                   <button class="card-btn add-to-cart flash-sale-btn" data-id="${prod.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
               </div>`
            : `<div class="card-buttons">
                   <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
                   <button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button>
               </div>`;

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
        if (!list || list.length === 0) {
            productGrid.innerHTML = `<p style="text-align: center; grid-column: 1 / -1;">No products found.</p>`;
            return;
        }
        // Always render from the 'grid' context
        productGrid.innerHTML = list.map(prod => renderProductCard(prod, 'grid')).join('');
    }
    
    function renderFlashSaleProducts() {
        const container = document.getElementById('flashSaleCarouselContainer');
        if (!container || flashSaleProducts.length === 0) return;
        // Always render from the 'carousel' context
        container.innerHTML = flashSaleProducts.map(prod => `<div class="swiper-slide">${renderProductCard(prod, 'carousel')}</div>`).join('');
    }

    function getStarRatingHTML(rating) {
        let html = '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        for (let i = 0; i < fullStars; i++) html += '<i class="fas fa-star"></i>';
        if (halfStar) html += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < emptyStars; i++) html += '<i class="far fa-star"></i>';
        return html;
    }

    function showSkeletonLoaders() {
        if (!productGrid) return;
        productGrid.innerHTML = Array(8).fill('').map(() => `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-content"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>`).join('');
    }

    function applyFiltersAndSorting() {
        // --- NEW: Combine all products for the main grid ---
        const combinedProducts = [...allProducts, ...flashSaleProducts];

        if (!combinedProducts || combinedProducts.length === 0) return;
        let filteredProducts = [...combinedProducts];
        
        if (categoryFilter && categoryFilter.value !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === categoryFilter.value);
        }
        if (sortProductsControl) {
            const sortValue = sortProductsControl.value;
            switch (sortValue) {
                case 'price-asc':
                    filteredProducts.sort((a, b) => (a.price[currentCurr] || a.price['USD']) - (b.price[currentCurr] || b.price['USD']));
                    break;
                case 'price-desc':
                    filteredProducts.sort((a, b) => (b.price[currentCurr] || b.price['USD']) - (a.price[currentCurr] || a.price['USD']));
                    break;
                case 'name-asc':
                    filteredProducts.sort((a, b) => a.name.en.localeCompare(b.name.en));
                    break;
                case 'name-desc':
                    filteredProducts.sort((a, b) => b.name.en.localeCompare(a.name.en));
                    break;
            }
        }
        renderProducts(filteredProducts);
    }

    function handleSearch(inputElement, suggestionsElement) {
        if (!suggestionsElement) return;
        const val = inputElement.value.trim().toLowerCase();
        const allAvailableProducts = allProducts.concat(flashSaleProducts);
        if (val.length < 1) {
            suggestionsElement.style.display = 'none';
            return;
        }
        const result = allAvailableProducts.filter(p => (p.name[currentLang] || p.name.en).toLowerCase().includes(val));
        suggestionsElement.innerHTML = result.map(p => {
            const highlightedName = (p.name[currentLang] || p.name.en).replace(new RegExp(val, 'gi'), `<b>$&</b>`);
            return `<div class="suggestion-item" onclick="window.location='product-details.html?id=${p.id}'">${highlightedName}</div>`;
        }).join('');
        suggestionsElement.style.display = result.length > 0 ? 'block' : 'none';
    }

    function initializeFlashSaleCountdown() {
        const hoursEl = document.getElementById('flash-hours');
        const minutesEl = document.getElementById('flash-minutes');
        const secondsEl = document.getElementById('flash-seconds');
    
        function updateTimer() {
            const now = new Date();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
            const distance = endOfDay - now;
    
            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
            if(hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if(minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
            if(secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    
            if (distance < 0) {
                clearInterval(timerInterval);
                window.location.reload();
            }
        }
        const timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }

    async function initializePage() {
        if (productGrid) {
            showSkeletonLoaders();
        }
        try {
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            if (data.success) {
                allProducts = data.products;
                flashSaleProducts = data.flashSaleProducts;

                applyFiltersAndSorting();
                renderFlashSaleProducts();
                initializeFlashSaleCountdown();
                
                new Swiper('#flashSaleCarousel', {
                    slidesPerView: 1,
                    spaceBetween: 30,
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                    breakpoints: {
                        640: { slidesPerView: 2 },
                        768: { slidesPerView: 3 },
                        1024: { slidesPerView: 4 },
                        1200: { slidesPerView: 5 },
                    }
                });

            } else {
                throw new Error(data.message || 'Could not retrieve products.');
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            if(productGrid) productGrid.innerHTML = `<p style="text-align: center; grid-column: 1 / -1; color: red;">Error: Could not load products. Please try again later.</p>`;
        }
        
        initializeCart([...allProducts, ...flashSaleProducts]);
    }
    
    // --- Global Event Listeners & Other Functions ---
    if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersAndSorting);
    if (sortProductsControl) sortProductsControl.addEventListener('change', applyFiltersAndSorting);
    if (searchInputDesktop) searchInputDesktop.addEventListener('input', () => handleSearch(searchInputDesktop, searchSuggestionsDesktop));
    if (searchInputMobile) searchInputMobile.addEventListener('input', () => handleSearch(searchInputMobile, searchSuggestionsMobile));

    document.body.addEventListener('click', async function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart');
        const buyNowBtn = e.target.closest('.buy-now');
        const wishlistBtn = e.target.closest('.wishlist-btn');

        if (addToCartBtn) {
            const card = addToCartBtn.closest('.product-card');
            const img = card.querySelector('.card-image');
            const cartBtn = document.getElementById('cartBtn');
            if (img && cartBtn) {
                const flyingImage = img.cloneNode(true);
                flyingImage.classList.add('flying-image');
                const rect = img.getBoundingClientRect();
                flyingImage.style.left = `${rect.left}px`;
                flyingImage.style.top = `${rect.top}px`;
                flyingImage.style.width = `${rect.width}px`;
                document.body.appendChild(flyingImage);
                const cartRect = cartBtn.getBoundingClientRect();
                requestAnimationFrame(() => {
                    flyingImage.style.left = `${cartRect.left + cartRect.width / 2}px`;
                    flyingImage.style.top = `${cartRect.top + cartRect.height / 2}px`;
                    flyingImage.style.width = '20px';
                    flyingImage.style.opacity = '0';
                });
                setTimeout(() => {
                    flyingImage.remove();
                    cartBtn.classList.add('animated');
                    setTimeout(() => cartBtn.classList.remove('animated'), 430);
                }, 700);
            }
            addToCart(addToCartBtn.dataset.id);
        }

        if (buyNowBtn) {
            addToCart(buyNowBtn.dataset.id);
            window.location.href = 'checkout.html';
        }
        
        if (wishlistBtn) {
            wishlistBtn.disabled = true;
            const productId = wishlistBtn.dataset.productId;
            const user = firebase.auth().currentUser;
            if (!user) {
                if (typeof openAuthModal === 'function') openAuthModal();
                wishlistBtn.disabled = false;
                return;
            }
            try {
                const idToken = await user.getIdToken();
                const response = await fetch('/.netlify/functions/add-to-wishlist', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: productId })
                });
                if (response.ok) {
                    wishlistBtn.classList.toggle('active');
                }
            } catch (error) {
                console.error('Wishlist Error:', error);
            } finally {
                wishlistBtn.disabled = false;
            }
        }
    });

    if(backBtn) {
        backBtn.onclick = () => window.scrollTo({top:0, behavior:'smooth'});
        window.addEventListener('scroll', () => {
             if(backBtn) backBtn.style.display = (window.scrollY > 300) ? 'flex' : 'none';
        });
    }

    const sliderContainer = document.getElementById('hero-slider');
    if (sliderContainer) {
        const bannerFiles = [
            'banner_1_powerful.html',
            'banner_2_final.html',
            'banner_3_unique.html',
            'banner_4_flashsale.html'
        ];
        async function loadBanners() {
            for (const file of bannerFiles) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) throw new Error(`Could not fetch ${file}`);
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
            let currentSlide = 0;
            let slideInterval;
            if (slides.length === 0) return;
            slides[0].classList.add('active');
            function showSlide(index) {
                slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
            }
            function nextSlide() {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            }
            function startSlider() {
                slideInterval = setInterval(nextSlide, 8000);
            }
            function stopSlider() {
                clearInterval(slideInterval);
            }
            nextBtn.addEventListener('click', () => { stopSlider(); nextSlide(); startSlider(); });
            prevBtn.addEventListener('click', () => { 
                stopSlider(); 
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                showSlide(currentSlide);
                startSlider(); 
            });
            startSlider();
        }
        loadBanners();
    }

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const countdownTimer = document.getElementById("countdown-timer");
                if (countdownTimer && !countdownTimer.hasAttribute('data-initialized')) {
                    initializeCountdown(countdownTimer);
                    countdownTimer.setAttribute('data-initialized', 'true');
                }
                const uniqueBanner = document.querySelector('.unique-banner');
                if (uniqueBanner && !uniqueBanner.hasAttribute('data-initialized')) {
                    initializeParallax(uniqueBanner);
                    uniqueBanner.setAttribute('data-initialized', 'true');
                }
            }
        }
    });

    if (sliderContainer) {
        observer.observe(sliderContainer, { childList: true, subtree: true });
    }
    
    function initializeCountdown(timerElement) {
        const countDownDate = new Date().getTime() + (24 * 60 * 60 * 1000); 
        const timer = setInterval(() => {
            const distance = countDownDate - new Date().getTime();
            const daysEl = document.getElementById("days");
            const hoursEl = document.getElementById("hours");
            const minutesEl = document.getElementById("minutes");
            const secondsEl = document.getElementById("seconds");
            if(daysEl && hoursEl && minutesEl && secondsEl) {
                daysEl.innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
                hoursEl.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
                minutesEl.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                secondsEl.innerText = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
            }
            if (distance < 0) {
                clearInterval(timer);
                timerElement.innerHTML = "<h2>SALE EXPIRED</h2>";
            }
        }, 1000);
    }
    
    function initializeParallax(bannerElement) {
        bannerElement.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = bannerElement.getBoundingClientRect();
            const x = (clientX - left - width / 2) / 25;
            const y = (clientY - top - height / 2) / 25;
            const visuals = bannerElement.querySelectorAll('.visual-element');
            visuals.forEach(el => {
                const depth = parseFloat(el.getAttribute('data-depth')) || 0.2;
                el.style.transform = `translateX(${x * depth}px) translateY(${y * depth}px)`;
            });
        });
    }
    
    initializePage();
});