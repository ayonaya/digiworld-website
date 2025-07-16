// main.js

// This is your product data. In a real application, you would fetch this from a server.
const products = [
    { id: "office365lifetime", category: "Office", name: { en: "Office 365 Lifetime Account (5 Devices)"}, price: { LKR: 7700, USD: 23 }, image: "https://static-01.daraz.lk/p/ae3f76f0c47cf3b1c4099c857784b1de.jpg" },
    { id: "win10pro", category: "Windows", name: { en: "Windows 10 Pro Key" }, price: { LKR: 3000, USD: 9 }, image: "https://img.drz.lazcdn.com/static/lk/p/6089ff29fc089609833e9df6008ed942.png_400x400q75.avif" },
    { id: "win11pro", category: "Windows", name: { en: "Windows 11 Pro Key" }, price: { LKR: 3700, USD: 11 }, image: "https://img.drz.lazcdn.com/static/lk/p/4ac77c5340b852dcfe5d0f0ba66fb1ed.png_400x400q75.avif" },
    { id: "office2021", category: "Office", name: { en: "Office 2021 Pro Plus Key" }, price: { LKR: 4500, USD: 13 }, image: "https://img.drz.lazcdn.com/g/kf/Sb9bc8d1802a04d8394d16f951736c65a2.jpg_400x400q75.avif" },
];

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL APP STATE & UTILS ---
    let currentCurr = localStorage.getItem('digiworld_curr') || 'USD';
    const currencySymbols = { USD: '$', LKR: 'Rs' };
    let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};

    // --- COMPONENT LOADER ---
    // Fetches and injects reusable HTML like the header and footer
    const loadComponent = (selector, url) => {
        fetch(url)
            .then(response => response.ok ? response.text() : Promise.reject('File not found'))
            .then(data => {
                document.querySelector(selector).innerHTML = data;
                // Re-run initialization for newly loaded content
                initializeSharedComponents();
            })
            .catch(error => console.error(`Failed to load ${url}:`, error));
    };
    
    loadComponent('#header-placeholder', 'header.html');
    loadComponent('#footer-placeholder', 'footer.html');


    // --- SHARED INITIALIZATION ---
    // This function runs after components are loaded to make them interactive
    const initializeSharedComponents = () => {
        // Dropdown Logic
        setupDropdown('currencyDropdown', (newCurr) => {
            currentCurr = newCurr;
            localStorage.setItem('digiworld_curr', newCurr);
            // We need a way to tell the page to re-render prices.
            // A custom event is perfect for this.
            document.dispatchEvent(new Event('currencyChanged'));
        });

        // Cart Logic
        const cartBtn = document.getElementById('cartBtn');
        const mobileCartBtn = document.getElementById('mobileCartBtn');
        if (cartBtn) cartBtn.addEventListener('click', openMiniCart);
        if (mobileCartBtn) mobileCartBtn.addEventListener('click', openMiniCart);
        
        const miniCartClose = document.getElementById('miniCartClose');
        const miniCartOverlay = document.getElementById('miniCartOverlay');
        if (miniCartClose) miniCartClose.addEventListener('click', closeMiniCart);
        if (miniCartOverlay) miniCartOverlay.addEventListener('click', (e) => {
            if (e.target === miniCartOverlay) closeMiniCart();
        });

        // Search Logic
        const searchInput = document.getElementById('searchInput');
        if(searchInput) searchInput.addEventListener('input', handleSearch);

        updateUICurrency();
        updateCartBadge();
    };


    // --- CURRENCY DROPDOWN ---
    const setupDropdown = (dropdownId, onSelect) => {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');

        // Populate menu
        menu.innerHTML = Object.keys(currencySymbols).map(curr => 
            `<div class="dropdown-item" data-value="${curr}">${currencySymbols[curr]} ${curr}</div>`
        ).join('');
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        menu.addEventListener('click', (e) => {
            if (e.target.matches('.dropdown-item')) {
                onSelect(e.target.dataset.value);
                dropdown.classList.remove('open');
            }
        });
    };

    const updateUICurrency = () => {
        const currLabel = document.getElementById('currentCurrLabel');
        const currSymbol = document.getElementById('currentCurrSymbol');
        if (currLabel) currLabel.textContent = currentCurr;
        if (currSymbol) currSymbol.textContent = currencySymbols[currentCurr] || '$';
    };


    // --- CART LOGIC ---
    const updateCartBadge = () => {
        const count = Object.keys(cart).length;
        const cartCountBadge = document.getElementById('cartCount');
        if (cartCountBadge) cartCountBadge.textContent = count;
    };

    const saveCart = () => {
        localStorage.setItem('digiworldCart', JSON.stringify(cart));
        updateCartBadge();
    };

    const openMiniCart = () => {
        updateMiniCartContent();
        document.getElementById('miniCartOverlay')?.classList.add('active');
    };

    const closeMiniCart = () => {
        document.getElementById('miniCartOverlay')?.classList.remove('active');
    };
    
    const updateMiniCartContent = () => {
        const container = document.getElementById('miniCartItems');
        const totalEl = document.getElementById('miniCartTotal');
        if (!container || !totalEl) return;
        
        let total = 0;
        const currencySymbol = currencySymbols[currentCurr] || '$';
        
        if (Object.keys(cart).length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">Your cart is empty.</p>';
            totalEl.innerHTML = `<span>Total:</span> <span>${currencySymbol}0.00</span>`;
            return;
        }
        
        container.innerHTML = Object.entries(cart).map(([id, quantity]) => {
            const product = products.find(p => p.id === id);
            if (!product) return '';
            const price = product.price[currentCurr] || product.price.USD;
            total += price * quantity;
            return `
                <div class="mini-cart-item" data-id="${id}">
                    <img src="${product.image}" class="mini-cart-item-img" alt="${product.name.en}">
                    <div class="mini-cart-item-details">
                        <div class="mini-cart-item-title">${product.name.en}</div>
                        <div class="mini-cart-item-price">${quantity} x ${currencySymbol}${price.toFixed(2)}</div>
                    </div>
                    <span class="mini-cart-item-remove" data-id="${id}">&times;</span>
                </div>
            `;
        }).join('');

        totalEl.innerHTML = `<span>Total:</span> <span>${currencySymbol}${total.toFixed(2)}</span>`;
    };
    
    // Global event listener for adding to cart and removing from mini-cart
    document.addEventListener('click', (e) => {
        // Add to cart from product card or product details page
        if (e.target.matches('.add-to-cart')) {
            const prodId = e.target.dataset.id;
            if (prodId) {
                cart[prodId] = (cart[prodId] || 0) + 1;
                saveCart();
                animateImageToCart(e.target);
                openMiniCart();
            }
        }

        // Remove from mini-cart
        if (e.target.matches('.mini-cart-item-remove')) {
            const itemId = e.target.dataset.id;
            delete cart[itemId];
            saveCart();
            updateMiniCartContent(); // Re-render the cart content
        }

        // Close dropdowns if clicking outside
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
        }
    });

    // --- ANIMATIONS ---
    const animateImageToCart = (button) => {
        const cartIcon = document.getElementById('cartBtn');
        const card = button.closest('.product-card') || button.closest('.product-details-grid');
        if (!card || !cartIcon) return;
        
        const productImage = card.querySelector('img');
        if (!productImage) return;

        const startRect = productImage.getBoundingClientRect();
        const endRect = cartIcon.getBoundingClientRect();

        const flyingImage = productImage.cloneNode(true);
        flyingImage.classList.add('flying-image');
        
        Object.assign(flyingImage.style, {
            left: `${startRect.left}px`,
            top: `${startRect.top}px`,
            width: `${startRect.width}px`,
            height: `${startRect.height}px`,
        });

        document.body.appendChild(flyingImage);

        requestAnimationFrame(() => {
            Object.assign(flyingImage.style, {
                left: `${endRect.left + endRect.width / 2}px`,
                top: `${endRect.top + endRect.height / 2}px`,
                width: '20px',
                height: '20px',
                transform: 'scale(0.1)',
                opacity: '0',
            });
        });

        flyingImage.addEventListener('transitionend', () => {
            flyingImage.remove();
            cartIcon.classList.add('animated');
            setTimeout(() => cartIcon.classList.remove('animated'), 430);
        });
    };

    // --- SEARCH LOGIC ---
    const handleSearch = () => {
        const input = document.getElementById('searchInput');
        const suggestions = document.getElementById('searchSuggestions');
        if (!input || !suggestions) return;

        const query = input.value.trim().toLowerCase();
        
        if (query.length < 2) {
            suggestions.style.display = 'none';
            return;
        }

        const results = products.filter(p => p.name.en.toLowerCase().includes(query));

        if (results.length > 0) {
            suggestions.innerHTML = results.map(p => `
                <div class="suggestion-item" onclick="window.location.href='product-details.html?id=${p.id}'">
                    ${p.name.en}
                </div>
            `).join('');
            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    };
});