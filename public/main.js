// /main.js
import { initializeCart, addToCart, renderMiniCart } from './cart-manager.js';

document.addEventListener('DOMContentLoaded', async function() {
    // --- DOM ELEMENTS ---
    // In main.js, add this inside the DOMContentLoaded listener, near the top

    // --- NEW: AliExpress Style Modal Logic ---
    const langCurrencyBtn = document.getElementById('langCurrencyBtn');
    
    // Create the modal HTML dynamically
    const modalHTML = `
    <div class="ali-modal" id="langCurrencyModal" aria-modal="true" role="dialog">
        <div class="ali-modal-content">
            <h3>Settings</h3>
            
            <label for="modalLangSelect">Language</label>
            <select id="modalLangSelect">
                <option value="en">🇺🇸 English</option>
                <option value="si">🇱🇰 සිංහල</option>
                <option value="ta">🇮🇳 தமிழ்</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="zh">🇨🇳 中文</option>
                <option value="es">🇪🇸 Español</option>
            </select>
            
            <label for="modalCurrSelect">Currency</label>
            <select id="modalCurrSelect">
                <option value="USD">$ USD</option>
                <option value="LKR">🇱🇰 LKR</option>
                <option value="INR">₹ INR</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
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

    langCurrencyBtn.addEventListener('click', () => {
        // Set current values in modal before showing
        modalLangSelect.value = currentLang;
        modalCurrSelect.value = currentCurr;
        langCurrencyModal.classList.add('show');
    });

    const closeModal = () => langCurrencyModal.classList.remove('show');
    
    modalCancelBtn.addEventListener('click', closeModal);
    langCurrencyModal.addEventListener('click', (e) => {
        if (e.target === langCurrencyModal) closeModal(); // Close if clicking on the overlay
    });

    modalSaveBtn.addEventListener('click', () => {
        // Save Language
        currentLang = modalLangSelect.value;
        document.getElementById('currentLangFlag').textContent = langFlags[currentLang];
        
        // Save Currency
        currentCurr = modalCurrSelect.value;
        localStorage.setItem('userCurrency', currentCurr);
        document.getElementById('currentCurrLabel').textContent = currentCurr;

        applyFiltersAndSorting();
        renderMiniCart();
        closeModal();
    });
    // --- End of New Modal Logic ---
    const productGrid = document.getElementById('productGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortProductsControl = document.getElementById('sortProducts');
    const langDropdown = document.getElementById('langDropdown');
    const currencyDropdown = document.getElementById('currencyDropdown');
    const searchInputDesktop = document.getElementById('searchInput');
    const searchSuggestionsDesktop = document.getElementById('searchSuggestionsDesktop');
    const searchInputMobile = document.getElementById('mobileSearch');
    const searchSuggestionsMobile = document.getElementById('searchSuggestionsMobile');
    const slides = document.querySelectorAll('.banner-slide');
    const controls = document.getElementById('bannerSliderControls');
    const backBtn = document.getElementById('dwBackToTop');

    // --- APP STATE ---
    let allProducts = [];
    let currentLang = 'en';
    let currentCurr = localStorage.getItem('userCurrency') || 'USD';
    let currentSlide = 0;
    let slideTimer = null;
    const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };
    const langFlags = { en: '🇺🇸', si: '🇱🇰', ta: '🇮🇳', ru: '🇷🇺', zh: '🇨🇳', es: '🇪🇸' };
    const langLabels = { en: 'English', si: 'සිංහල', ta: 'தமிழ்', ru: 'Русский', zh: '中文', es: 'Español' };

    // --- FUNCTIONS ---

    function renderProducts(list) {
        if (!productGrid) return;
        productGrid.innerHTML = list.map((prod) => {
            const name = (prod.name && prod.name[currentLang]) || (prod.name && prod.name['en']) || 'Unnamed Product';
            const price = (prod.price && prod.price[currentCurr]) || (prod.price && prod.price['USD']) || 0;
            const deliveryText = (prod.delivery && prod.delivery[currentLang]) || (prod.delivery && prod.delivery['en']) || '';
            const hotBadgeHTML = prod.isHot ? '<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>' : '';
            
            // =================================================================
            // RESTORED your preferred button design
            // =================================================================
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
        productGrid.innerHTML = Array(8).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>`).join('');
    }

    function applyFiltersAndSorting() {
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
    
    function animateImageToCart(event) {
        const mainCartIcon = window.innerWidth <= 650 ? document.getElementById('dwNavCart') : document.getElementById('cartBtn');
        const card = event.target.closest('.product-card');
        if (!card || !mainCartIcon) return;
        const productImage = card.querySelector('.card-image');
        const startRect = productImage.getBoundingClientRect();
        const flyingImage = productImage.cloneNode(true);
        flyingImage.classList.add('flying-image');
        Object.assign(flyingImage.style, {
            left: `${startRect.left}px`,
            top: `${startRect.top}px`,
            width: `${startRect.width}px`,
            height: `${startRect.height}px`
        });
        document.body.appendChild(flyingImage);
        requestAnimationFrame(() => {
            const endRect = mainCartIcon.getBoundingClientRect();
            Object.assign(flyingImage.style, {
                left: `${endRect.left + endRect.width / 2}px`,
                top: `${endRect.top + endRect.height / 2}px`,
                width: '20px',
                height: '20px',
                transform: 'scale(0.1)',
                opacity: '0'
            });
        });
        flyingImage.addEventListener('transitionend', () => flyingImage.remove());
    }

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

    function showSlide(i) {
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

    // --- INITIALIZATION & FETCH ---
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

    // --- EVENT LISTENERS ---
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
            applyFiltersAndSorting();
            renderMiniCart();
            closeDropdowns();
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
            applyFiltersAndSorting();
            renderMiniCart();
            closeDropdowns();
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
});
