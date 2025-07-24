// Final, Combined, and Fully Corrected main.js for DigiWorld
import { initializeCart, addToCart, renderMiniCart } from './cart-manager.js';

// This is the main wrapper that ensures all HTML is loaded before running any code.
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
    let currentLang = 'en';
    let currentCurr = localStorage.getItem('userCurrency') || 'USD';
    const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };
    const langFlags = { en: '🇺🇸', si: '🇱🇰', ta: '🇮🇳', ru: '🇷🇺', zh: '🇨🇳', es: '🇪🇸' };

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
            renderMiniCart();
            closeModal();
        });
    }

// This is the updated renderProducts function for main.js

function renderProducts(list) {
    if (!productGrid) return;
    productGrid.innerHTML = list.map((prod) => {
        const name = (prod.name && prod.name[currentLang]) || (prod.name && prod.name['en']) || 'Unnamed Product';
        const price = (prod.price && prod.price[currentCurr]) || (prod.price && prod.price['USD']) || 0;
        const deliveryText = (prod.delivery && prod.delivery[currentLang]) || (prod.delivery && prod.delivery['en']) || '';
        const hotBadgeHTML = prod.isHot ? '<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>' : '';
        
        // The only change is adding the <button class="wishlist-btn">...</button>
        return `
            <div class="product-card" data-product-id="${prod.id}">
                ${hotBadgeHTML}
                
                <button class="wishlist-btn" data-product-id="${prod.id}" aria-label="Add to Wishlist">
                    <i class="fas fa-heart"></i>
                </button>
                
                <div class="card-image-container">
                    <a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${name}" loading="lazy" /></a>
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
            </div>`;
    }).join('');
}
    function showSkeletonLoaders() {
        if (!productGrid) return;
        productGrid.innerHTML = Array(8).fill('').map(() => `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-content"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>`).join('');
    }

    function applyFiltersAndSorting() {
        if (!allProducts || allProducts.length === 0) return;
        let filteredProducts = [...allProducts];
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
                    filteredProducts.sort((a, b) => ((a.name[currentLang] || a.name.en).localeCompare(b.name[currentLang] || b.name.en)));
                    break;
                case 'name-desc':
                    filteredProducts.sort((a, b) => ((b.name[currentLang] || b.name.en).localeCompare(a.name[currentLang] || a.name.en)));
                    break;
            }
        }
        renderProducts(filteredProducts);
    }
    
    // --- Search Functionality ---
    function handleSearch(inputElement, suggestionsElement) {
        if (!suggestionsElement) return;
        const val = inputElement.value.trim().toLowerCase();
        if (val.length < 1) {
            suggestionsElement.style.display = 'none';
            return;
        }
        const result = allProducts.filter(p => (p.name[currentLang] || p.name.en).toLowerCase().includes(val));
        if (result.length === 0) {
            suggestionsElement.style.display = 'none';
            return;
        }
        suggestionsElement.innerHTML = result.map(p => {
            const name = p.name[currentLang] || p.name.en;
            const highlightedName = name.replace(new RegExp(val, 'gi'), `<b>$&</b>`);
            return `<div class="suggestion-item" onclick="window.location='product-details.html?id=${p.id}'">${highlightedName}</div>`;
        }).join('');
        suggestionsElement.style.display = 'block';
    }

    // --- Data Fetching & Initialization ---
    if (productGrid) {
        showSkeletonLoaders();
        try {
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'API error');
            allProducts = data.products;
            applyFiltersAndSorting();
            initializeCart(allProducts);
        } catch (error) {
            console.error("Error fetching products:", error);
            productGrid.innerHTML = `<p class="error-message">Could not load products.</p>`;
        }
    } else {
        initializeCart([]);
    }

    // --- Global Event Listeners ---
document.body.addEventListener('click', async function(e) {
    const wishlistBtn = e.target.closest('.wishlist-btn');
    if (wishlistBtn) {
        // Prevent other clicks while processing
        wishlistBtn.disabled = true;

        const productId = wishlistBtn.dataset.productId;
        const user = firebase.auth().currentUser;

        if (!user) {
            // If the user is not logged in, open the authentication modal
            openAuthModal();
            wishlistBtn.disabled = false;
            return;
        }

        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/.netlify/functions/add-to-wishlist', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId: productId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Toggle the 'active' class to show it's been added
                wishlistBtn.classList.toggle('active'); 
                // You could add a more sophisticated notification here if you like
            } else {
                throw new Error(result.message || 'Failed to add to wishlist.');
            }
        } catch (error) {
            console.error('Wishlist Error:', error);
            // Optionally, show an error message to the user
        } finally {
            wishlistBtn.disabled = false;
        }
    }
});
    // =================================================================
    // SECTION 2: ADVANCED BANNER SLIDER LOGIC
    // =================================================================

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
            prevBtn.addEventListener('click', () => { stopSlider(); prevSlide(); startSlider(); });
            startSlider();
        }
        
        loadBanners();
    }

    // --- OBSERVER FOR BANNER-SPECIFIC JS (Countdown, Parallax) ---
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
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            document.getElementById("days").innerText = d.toString().padStart(2, '0');
            document.getElementById("hours").innerText = h.toString().padStart(2, '0');
            document.getElementById("minutes").innerText = m.toString().padStart(2, '0');
            document.getElementById("seconds").innerText = s.toString().padStart(2, '0');
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
});