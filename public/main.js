// Final, Combined, and Fully Commented main.js for DigiWorld
import { initializeCart, addToCart, renderMiniCart } from './cart-manager.js';

// This is the main wrapper that ensures all HTML is loaded before running any code.
document.addEventListener('DOMContentLoaded', async function() {

    // =================================================================
    // SECTION 1: E-COMMERCE & CORE UI LOGIC (From your first script)
    // =================================================================

    // --- DOM Elements ---
    const productGrid = document.getElementById('productGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortProductsControl = document.getElementById('sortProducts');
    const langCurrencyBtn = document.getElementById('langCurrencyBtn');
    const searchInputDesktop = document.getElementById('searchInput');
    const backBtn = document.getElementById('dwBackToTop');


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

    // --- Product Rendering Functions ---
    function renderProducts(list) {
        if (!productGrid) return;
        productGrid.innerHTML = list.map((prod) => {
            const name = (prod.name && prod.name[currentLang]) || (prod.name && prod.name['en']) || 'Unnamed Product';
            const price = (prod.price && prod.price[currentCurr]) || (prod.price && prod.price['USD']) || 0;
            const hotBadgeHTML = prod.isHot ? '<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>' : '';
            return `
                <div class="product-card" data-product-id="${prod.id}">
                    ${hotBadgeHTML}
                    <div class="card-image-container">
                        <a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${name}" loading="lazy" /></a>
                    </div>
                    <div class="card-content-wrapper">
                        <h3 class="product-name">${name}</h3>
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
            // Your sorting logic would go here based on the sort control's value
        }
        renderProducts(filteredProducts);
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
        // Still initialize the cart for pages that don't show products (like the homepage)
        initializeCart([]);
    }

    // --- Global Event Listeners ---
    document.body.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-cart')) {
            addToCart(e.target.closest('.add-to-cart').dataset.id);
        }
        if (e.target.closest('.buy-now')) {
            addToCart(e.target.closest('.buy-now').dataset.id);
            window.location.href = 'checkout.html';
        }
    });
    
    if(backBtn) {
        backBtn.onclick = () => window.scrollTo({top:0, behavior:'smooth'});
        window.addEventListener('scroll', () => {
             if (backBtn) backBtn.style.display = (window.scrollY > 300) ? 'flex' : 'none';
        });
    }

    // =================================================================
    // SECTION 2: ADVANCED BANNER SLIDER LOGIC (From your second script)
    // =================================================================

    const sliderContainer = document.getElementById('hero-slider');

    // Only run banner code if the hero-slider element exists on the page
    if (sliderContainer) {
        const bannerFiles = ['banner-1.html', 'banner-2.html', 'banner-3.html', 'banner-4.html'];

        // This function fetches your banner HTML files and injects them into the slider
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
            // After loading is done, start the slider functionality
            initializeSlider();
        }

        // This function controls the sliding behavior (next/prev buttons, autoplay)
        function initializeSlider() {
            const slides = document.querySelectorAll('.slider-slide');
            const nextBtn = document.querySelector('.slider-nav.next');
            const prevBtn = document.querySelector('.slider-nav.prev');
            let currentSlide = 0;
            let slideInterval;
            
            if (slides.length === 0) return; // Exit if no slides loaded
            slides[0].classList.add('active'); // Make the first slide visible

            function showSlide(index) {
                slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
            }
            function nextSlide() {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            }
            function prevSlide() {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                showSlide(currentSlide);
            }
            function startSlider() {
                slideInterval = setInterval(nextSlide, 8000); // Autoplay every 8 seconds
            }
            function stopSlider() {
                clearInterval(slideInterval);
            }

            // Add event listeners to buttons
            nextBtn.addEventListener('click', () => { stopSlider(); nextSlide(); startSlider(); });
            prevBtn.addEventListener('click', () => { stopSlider(); prevSlide(); startSlider(); });
            startSlider(); // Start autoplay
        }
        
        loadBanners(); // This is the first call that starts the banner process
    }

    // --- Observer for Banner-Specific JS (Countdown & Parallax) ---
    // This clever part waits for the banners to be loaded onto the page, and only THEN
    // tries to find elements like the countdown timer or parallax visuals.
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const countdownTimer = document.getElementById("countdown-timer");
                if (countdownTimer && !countdownTimer.hasAttribute('data-initialized')) {
                    initializeCountdown(countdownTimer);
                    countdownTimer.setAttribute('data-initialized', 'true'); // Mark as initialized
                }
                const uniqueBanner = document.querySelector('.unique-banner');
                if (uniqueBanner && !uniqueBanner.hasAttribute('data-initialized')) {
                    initializeParallax(uniqueBanner);
                    uniqueBanner.setAttribute('data-initialized', 'true'); // Mark as initialized
                }
            }
        }
    });

    if (sliderContainer) {
        // Tell the observer to watch the slider container for new children (the banners)
        observer.observe(sliderContainer, { childList: true, subtree: true });
    }
    
    // Logic for the countdown timer in the flash sale banner
    function initializeCountdown(timerElement) {
        const countDownDate = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours from now
        const timer = setInterval(() => {
            const distance = countDownDate - new Date().getTime();
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            
            // This expects you to have elements with these IDs inside your banner-3.html
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
    
    // Logic for the parallax mouse-move effect in the first banner
    function initializeParallax(bannerElement) {
        bannerElement.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = bannerElement.getBoundingClientRect();
            const x = (clientX - left - width / 2) / 25; // How much to move on X-axis
            const y = (clientY - top - height / 2) / 25; // How much to move on Y-axis
            const visuals = bannerElement.querySelectorAll('.visual-element');
            visuals.forEach(el => {
                const depth = parseFloat(el.getAttribute('data-depth')) || 0.2;
                el.style.transform = `translateX(${x * depth}px) translateY(${y * depth}px)`;
            });
        });
    }
});