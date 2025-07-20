// /main.js
import { initializeCart, addToCart, renderMiniCart } from './cart-manager.js';

'use strict';

/**
 * ===================================================================
 * YOUR ORIGINAL WEBSITE CODE
 * ===================================================================
 */

/**
 * add event on element
 */
const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
}

/**
 * navbar toggle
 */
const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const navLinks = document.querySelectorAll("[data-nav-link]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  if (navbar) navbar.classList.toggle("active");
  if (overlay) overlay.classList.toggle("active");
}

addEventOnElem(navTogglers, "click", toggleNavbar);

const closeNavbar = function () {
  if (navbar) navbar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

addEventOnElem(navLinks, "click", closeNavbar);

/**
 * header active when scroll down to 100px
 */
const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

const activeElem = function () {
  if (window.scrollY > 100) {
    if (header) header.classList.add("active");
    if (backTopBtn) backTopBtn.classList.add("active");
  } else {
    if (header) header.classList.remove("active");
    if (backTopBtn) backTopBtn.classList.remove("active");
  }
}

addEventOnElem(window, "scroll", activeElem);

/**
 * newslatter popup
 */
const newsletter = document.querySelector("[data-newsletter]");
const newsletterCloseBtn = document.querySelector("[data-newsletter-close]");

if (newsletter && newsletterCloseBtn) {
  const showNewsletter = function () {
    newsletter.classList.add("active");
  }

  setTimeout(showNewsletter, 10000);

  const closeNewsletter = function () {
    newsletter.classList.remove("active");
  }

  addEventOnElem(newsletterCloseBtn, "click", closeNewsletter);
}


/**
 * ===================================================================
 * COMBINED SCRIPT: ALL EXISTING LOGIC + NEW BANNER SLIDER
 * ===================================================================
 */
document.addEventListener('DOMContentLoaded', async function() {
    // --- YOUR EXISTING DOM ELEMENTS ---
    const productGrid = document.getElementById('productGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortProductsControl = document.getElementById('sortProducts');
    const langDropdown = document.getElementById('langDropdown');
    const currencyDropdown = document.getElementById('currencyDropdown');
    const searchInputDesktop = document.getElementById('searchInput');
    const searchSuggestionsDesktop = document.getElementById('searchSuggestionsDesktop');
    const searchInputMobile = document.getElementById('mobileSearch');
    const searchSuggestionsMobile = document.getElementById('searchSuggestionsMobile');
    const slides = document.querySelectorAll('.banner-slide'); // This is your ORIGINAL slider
    const controls = document.getElementById('bannerSliderControls'); // Your ORIGINAL slider controls
    const backBtn = document.getElementById('dwBackToTop');
    const langCurrencyBtn = document.getElementById('langCurrencyBtn');

    // --- YOUR EXISTING APP STATE ---
    let allProducts = [];
    let currentLang = 'en';
    let currentCurr = localStorage.getItem('userCurrency') || 'USD';
    let currentSlide = 0; // For your ORIGINAL slider
    let slideTimer = null; // For your ORIGINAL slider
    const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };
    const langFlags = { en: '🇺🇸', si: '🇱🇰', ta: '🇮🇳', ru: '🇷🇺', zh: '🇨🇳', es: '🇪🇸' };
    const langLabels = { en: 'English', si: 'සිංහල', ta: 'தமிழ்', ru: 'Русский', zh: '中文', es: 'Español' };

    // --- YOUR EXISTING ALIEXPRESS STYLE MODAL ---
    const modalHTML = `
    <div class="ali-modal" id="langCurrencyModal" aria-modal="true" role="dialog">
        <div class="ali-modal-content">
            <h3>Settings</h3>
            <label for="modalLangSelect">Language</label>
            <select id="modalLangSelect">
                <option value="en">🇺🇸 English</option> <option value="si">🇱🇰 සිංහල</option> <option value="ta">🇮🇳 தமிழ்</option> <option value="ru">🇷🇺 Русский</option> <option value="zh">🇨🇳 中文</option> <option value="es">🇪🇸 Español</option>
            </select>
            <label for="modalCurrSelect">Currency</label>
            <select id="modalCurrSelect">
                <option value="USD">$ USD</option> <option value="LKR">🇱🇰 LKR</option> <option value="INR">₹ INR</option> <option value="EUR">€ EUR</option> <option value="GBP">£ GBP</option>
            </select>
            <div class="ali-modal-actions">
                <button class="ali-modal-btn cancel" id="modalCancelBtn">Cancel</button>
                <button class="ali-modal-btn save" id="modalSaveBtn">Save</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const langCurrencyModal = document.getElementById('langCurrencyModal');
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalLangSelect = document.getElementById('modalLangSelect');
    const modalCurrSelect = document.getElementById('modalCurrSelect');

    if (langCurrencyBtn) {
        langCurrencyBtn.addEventListener('click', () => {
            modalLangSelect.value = currentLang;
            modalCurrSelect.value = currentCurr;
            langCurrencyModal.classList.add('show');
        });
    }

    const closeModal = () => langCurrencyModal.classList.remove('show');
    if(modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
    if(langCurrencyModal) langCurrencyModal.addEventListener('click', (e) => {
        if (e.target === langCurrencyModal) closeModal();
    });

    if(modalSaveBtn) modalSaveBtn.addEventListener('click', () => {
        currentLang = modalLangSelect.value;
        if(document.getElementById('currentLangFlag')) document.getElementById('currentLangFlag').textContent = langFlags[currentLang];
        
        currentCurr = modalCurrSelect.value;
        localStorage.setItem('userCurrency', currentCurr);
        if(document.getElementById('currentCurrLabel')) document.getElementById('currentCurrLabel').textContent = currentCurr;

        applyFiltersAndSorting();
        renderMiniCart();
        closeModal();
    });


    // --- YOUR EXISTING FUNCTIONS ---
    function renderProducts(list) {
        if (!productGrid) return;
        productGrid.innerHTML = list.map((prod) => {
            const name = (prod.name && prod.name[currentLang]) || (prod.name && prod.name['en']) || 'Unnamed Product';
            const price = (prod.price && prod.price[currentCurr]) || (prod.price && prod.price['USD']) || 0;
            const deliveryText = (prod.delivery && prod.delivery[currentLang]) || (prod.delivery && prod.delivery['en']) || '';
            const hotBadgeHTML = prod.isHot ? '<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>' : '';
            return `<div class="product-card" data-product-id="${prod.id}">${hotBadgeHTML}<div class="card-image-container"><a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${name}" loading="lazy" /></a></div><div class="card-content-wrapper"><h3 class="product-name">${name}</h3><div class="tag-delivery">${deliveryText}</div><p class="product-price">${currencySymbols[currentCurr] || '$'}${price.toFixed(2)}</p><div class="card-buttons"><button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button><button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button></div></div></div>`;
        }).join('');
    }

    function showSkeletonLoaders() {
        if (!productGrid) return;
        productGrid.innerHTML = Array(8).fill('').map(() => `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-content"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>`).join('');
    }

    function applyFiltersAndSorting() {
        let filteredProducts = [...allProducts];
        if (categoryFilter && categoryFilter.value !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === categoryFilter.value);
        }
        if (sortProductsControl) {
            const sortValue = sortProductsControl.value;
            switch (sortValue) {
                case 'price-asc': filteredProducts.sort((a, b) => (a.price[currentCurr] || a.price['USD']) - (b.price[currentCurr] || b.price['USD'])); break;
                case 'price-desc': filteredProducts.sort((a, b) => (b.price[currentCurr] || b.price['USD']) - (a.price[currentCurr] || a.price['USD'])); break;
                case 'name-asc': filteredProducts.sort((a, b) => ((a.name[currentLang] || a.name.en).localeCompare(b.name[currentLang] || b.name.en))); break;
                case 'name-desc': filteredProducts.sort((a, b) => ((b.name[currentLang] || b.name.en).localeCompare(a.name[currentLang] || a.name.en))); break;
            }
        }
        renderProducts(filteredProducts);
    }
    
    function animateImageToCart(event) {
        const mainCartIcon = window.innerWidth <= 650 ? document.getElementById('dwNavCart') : document.getElementById('cartBtn');
        const card = event.target.closest('.product-card');
        if (!card || !mainCartIcon) return;
        const productImage = card.querySelector('.card-image');
        const startRect = productImage.getBoundingClientRect();
        const flyingImage = productImage.cloneNode(true);
        flyingImage.classList.add('flying-image');
        Object.assign(flyingImage.style, { left: `${startRect.left}px`, top: `${startRect.top}px`, width: `${startRect.width}px`, height: `${startRect.height}px` });
        document.body.appendChild(flyingImage);
        requestAnimationFrame(() => {
            const endRect = mainCartIcon.getBoundingClientRect();
            Object.assign(flyingImage.style, { left: `${endRect.left + endRect.width / 2}px`, top: `${endRect.top + endRect.height / 2}px`, width: '20px', height: '20px', transform: 'scale(0.1)', opacity: '0' });
        });
        flyingImage.addEventListener('transitionend', () => flyingImage.remove());
    }

    function handleSearch(inputElement, suggestionsElement) {
        if (!suggestionsElement) return;
        const val = inputElement.value.trim().toLowerCase();
        if (val.length < 1) { suggestionsElement.style.display = 'none'; return; }
        const result = allProducts.filter(p => (p.name[currentLang] || p.name.en).toLowerCase().includes(val));
        if (result.length === 0) { suggestionsElement.style.display = 'none'; return; }
        suggestionsElement.innerHTML = result.map(p => {
            const name = p.name[currentLang] || p.name.en;
            const highlightedName = name.replace(new RegExp(val, 'gi'), `<b>$&</b>`);
            return `<div class="suggestion-item" onclick="window.location='product-details.html?id=${p.id}'">${highlightedName}</div>`;
        }).join('');
        suggestionsElement.style.display = 'block';
    }

    function showSlide(i) { // Your ORIGINAL showSlide
        if (!slides.length || !controls) return;
        slides.forEach((slide, idx) => slide.classList.toggle('active', idx === i));
        Array.from(controls.children).forEach((dot, idx) => dot.classList.toggle('active', idx === i));
        currentSlide = i;
    }

    function nextSlide() { if(slides.length > 0) showSlide((currentSlide + 1) % slides.length); }
    function resetSlideTimer() { clearInterval(slideTimer); if (slides.length > 1) slideTimer = setInterval(nextSlide, 5200); }
    function closeDropdowns() { document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open')); }
    function toggleDropdown(id) {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;
        const wasOpen = dropdown.classList.contains('open');
        closeDropdowns();
        if (!wasOpen) dropdown.classList.add('open');
    }

    // --- YOUR EXISTING INITIALIZATION & FETCH ---
    showSkeletonLoaders();
    try {
        const response = await fetch('/.netlify/functions/get-products');
        const data = await response.json();
        if (!data.success) throw new Error('Failed to fetch products');
        allProducts = data.products;
        renderProducts(allProducts);
        initializeCart(allProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        if (productGrid) productGrid.innerHTML = `<p style="color:red; text-align:center; grid-column: 1 / -1;">Could not load products.</p>`;
    }

    // --- YOUR EXISTING EVENT LISTENERS ---
    if(categoryFilter) categoryFilter.addEventListener('change', applyFiltersAndSorting);
    if(sortProductsControl) sortProductsControl.addEventListener('change', applyFiltersAndSorting);
    document.body.addEventListener('click', function(e) {
        const target = e.target;
        if (target.closest('.add-to-cart')) {
            const prodId = target.closest('.add-to-cart').dataset.id;
            addToCart(prodId);
            animateImageToCart(e);
        }
        if (target.closest('.buy-now')) {
            const prodId = target.closest('.buy-now').dataset.id;
            addToCart(prodId);
            window.location.href = `checkout.html`;
        }
    });
    document.querySelectorAll('#langMenu .dropdown-item').forEach(el => {
        el.onclick = () => {
            currentLang = el.getAttribute('data-lang');
            document.getElementById('currentLangFlag').textContent = langFlags[currentLang];
            document.getElementById('currentLangLabel').textContent = langLabels[currentLang];
            applyFiltersAndSorting(); renderMiniCart(); closeDropdowns();
        }
    });
    if (document.querySelector('#langDropdown .dropdown-toggle')) {
        document.querySelector('#langDropdown .dropdown-toggle').onclick = (e) => { e.stopPropagation(); toggleDropdown('langDropdown'); };
    }
    document.querySelectorAll('#currencyMenu .dropdown-item').forEach(el => {
        el.onclick = () => {
            currentCurr = el.getAttribute('data-curr');
            localStorage.setItem('userCurrency', currentCurr);
            document.getElementById('currentCurrSymbol').textContent = (currencySymbols[currentCurr] || '$');
            document.getElementById('currentCurrLabel').textContent = currentCurr;
            applyFiltersAndSorting(); renderMiniCart(); closeDropdowns();
        }
    });
    if (document.querySelector('#currencyDropdown .dropdown-toggle')) {
        document.querySelector('#currencyDropdown .dropdown-toggle').onclick = (e) => { e.stopPropagation(); toggleDropdown('currencyDropdown'); };
    }
    document.body.addEventListener('click', closeDropdowns);
    if (searchInputDesktop) searchInputDesktop.addEventListener('input', () => handleSearch(searchInputDesktop, searchSuggestionsDesktop));
    if (searchInputMobile) searchInputMobile.addEventListener('input', () => handleSearch(searchInputMobile, searchSuggestionsMobile));
    document.addEventListener('click', () => {
        if (searchSuggestionsDesktop) searchSuggestionsDesktop.style.display = 'none';
        if (searchSuggestionsMobile) searchSuggestionsMobile.style.display = 'none';
    });
    if (slides.length > 0 && controls) {
        slides.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.className = 'banner-slider-dot';
            dot.onclick = () => { showSlide(idx); resetSlideTimer(); }
            controls.appendChild(dot);
        });
        showSlide(0);
        resetSlideTimer();
    }
    if(backBtn) backBtn.onclick = () => window.scrollTo({top:0, behavior:'smooth'});
    window.addEventListener('scroll', () => {
        if(backBtn) backBtn.style.display = (window.scrollY > 300) ? 'flex' : 'none';
    });

    /**
     * ===================================================================
     * NEW HERO BANNER SLIDER CODE
     * ===================================================================
     */
    const newHeroSliderContainer = document.getElementById('hero-slider');
    const newBannerFiles = ['banner-1.html', 'banner-2.html', 'banner-3.html', 'banner-4.html'];

    if (newHeroSliderContainer) {
        async function loadHeroBanners() {
            for (const file of newBannerFiles) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) throw new Error(`Could not fetch ${file}`);
                    const bannerHTML = await response.text();
                    const slide = document.createElement('div');
                    slide.className = 'slider-slide'; // This is the class for the new hero banners
                    slide.innerHTML = bannerHTML;
                    newHeroSliderContainer.appendChild(slide);
                } catch (error) {
                    console.error('Error loading hero banner:', error);
                }
            }
            initializeHeroSlider();
        }

        function initializeHeroSlider() {
            const heroSlides = newHeroSliderContainer.querySelectorAll('.slider-slide');
            const nextBtn = document.querySelector('.slider-nav.next');
            const prevBtn = document.querySelector('.slider-nav.prev');
            
            if (heroSlides.length === 0) return;

            let currentHeroSlide = 0;
            let heroSlideInterval = setInterval(nextHeroSlide, 8000);

            heroSlides[0].classList.add('active');

            function showHeroSlide(index) {
                heroSlides.forEach((slide, i) => slide.classList.toggle('active', i === index));
                currentHeroSlide = index;
            }

            function nextHeroSlide() {
                showHeroSlide((currentHeroSlide + 1) % heroSlides.length);
            }

            function prevHeroSlide() {
                showHeroSlide((currentHeroSlide - 1 + heroSlides.length) % heroSlides.length);
            }

            function resetHeroInterval() {
                clearInterval(heroSlideInterval);
                heroSlideInterval = setInterval(nextHeroSlide, 8000);
            }

            if(nextBtn) nextBtn.addEventListener('click', () => { nextHeroSlide(); resetHeroInterval(); });
            if(prevBtn) prevBtn.addEventListener('click', () => { prevHeroSlide(); resetHeroInterval(); });
        }
        
        loadHeroBanners();
    }

    const bannerObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const uniqueBanner = document.querySelector('.unique-banner:not([data-initialized])');
                if (uniqueBanner) {
                    initializeParallax(uniqueBanner);
                    uniqueBanner.setAttribute('data-initialized', 'true');
                }
                const countdownTimer = document.getElementById("countdown-timer");
                if (countdownTimer && !countdownTimer.hasAttribute('data-initialized')) {
                    initializeCountdown(countdownTimer);
                    countdownTimer.setAttribute('data-initialized', 'true');
                }
            }
        }
    });

    if (newHeroSliderContainer) {
        bannerObserver.observe(newHeroSliderContainer, { childList: true, subtree: true });
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
        bannerElement.addEventListener('mouseleave', () => {
             const visuals = bannerElement.querySelectorAll('.visual-element');
             visuals.forEach(el => el.style.transform = `translateX(0) translateY(0)`);
        });
    }

    function initializeCountdown(timerElement) {
        const countDownDate = new Date().getTime() + (24 * 60 * 60 * 1000); 
        const timer = setInterval(() => {
            const distance = countDownDate - new Date().getTime();
            const daysEl = document.getElementById("days");
            const hoursEl = document.getElementById("hours");
            const minutesEl = document.getElementById("minutes");
            const secondsEl = document.getElementById("seconds");
            if (distance < 0) {
                clearInterval(timer);
                timerElement.innerHTML = "<h2>SALE EXPIRED</h2>";
                return;
            }
            if(daysEl) daysEl.innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
            if(hoursEl) hoursEl.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
            if(minutesEl) minutesEl.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            if(secondsEl) secondsEl.innerText = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
        }, 1000);
    }
});