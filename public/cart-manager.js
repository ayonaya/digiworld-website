// --- STATE & CONFIGURATION ---
let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
let allProducts = [];
const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };
let currentCurr = localStorage.getItem('userCurrency') || 'USD';

// --- CORE CART FUNCTIONS ---

function saveCart() {
    localStorage.setItem('digiworldCart', JSON.stringify(cart));
}

 function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    saveCart();
    updateCartBadge();
    const cartCountDesktop = document.getElementById('cartCount');
    if (cartCountDesktop) {
        cartCountDesktop.classList.add('animated');
        setTimeout(() => cartCountDesktop.classList.remove('animated'), 400);
    }
}

function removeFromCart(productId) {
    delete cart[productId];
    saveCart();
    updateCartBadge();
}

 function updateQuantity(productId, quantity) {
    if (quantity > 0) {
        cart[productId] = quantity;
    } else {
        delete cart[productId];
    }
    saveCart();
    updateCartBadge();
}

// --- UI UPDATE FUNCTIONS ---

 function updateCartBadge() {
    const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
    const cartCountDesktop = document.getElementById('cartCount');
    const cartCountMobile = document.getElementById('dwCartCount');
    if (cartCountDesktop) cartCountDesktop.textContent = count;
    if (cartCountMobile) cartCountMobile.textContent = count;
}

 function renderMiniCart() {
    const miniCartItems = document.getElementById('miniCartItems');
    const miniCartTotal = document.getElementById('miniCartTotal');
    if (!miniCartItems || !miniCartTotal) return;

    let total = 0;
    const currencySymbol = currencySymbols[currentCurr] || '$';

    if (Object.keys(cart).length === 0 || allProducts.length === 0) {
        miniCartItems.innerHTML = `<div style="text-align:center; padding: 20px;">Your cart is empty.</div>`;
        miniCartTotal.textContent = `${currencySymbol}0.00`;
        return;
    }

    miniCartItems.innerHTML = Object.entries(cart).map(([id, qty]) => {
        const prod = allProducts.find(p => p.id === id);
        if (!prod) return '';
        const price = (prod.price[currentCurr] || prod.price.USD);
        total += price * qty;
        return `
            <div class="mini-cart-item">
                <img src="${prod.image}" class="mini-cart-item-img" alt="${prod.name.en}">
                <div class="mini-cart-item-details">
                    <div class="mini-cart-item-title">${prod.name.en}</div>
                    <div class="mini-cart-item-price">${qty} x ${currencySymbol}${price.toFixed(2)}</div>
                </div>
                <span class="mini-cart-item-remove" data-remove-id="${id}" role="button">&times;</span>
            </div>`;
    }).join('');

    miniCartTotal.textContent = `${currencySymbol}${total.toFixed(2)}`;
}

// --- INITIALIZATION ---

 function initializeCart(productsData) {
    allProducts = productsData;
    updateCartBadge();
}

 function initializeCartUI() {
    const openMiniCart = () => {
        const miniCartDrawer = document.getElementById('miniCartDrawer');
        const miniCartOverlay = document.getElementById('miniCartOverlay');
        renderMiniCart();
        if (miniCartDrawer) miniCartDrawer.classList.add('active');
        if (miniCartOverlay) miniCartOverlay.classList.add('active');
    };

    const closeMiniCart = () => {
        const miniCartDrawer = document.getElementById('miniCartDrawer');
        const miniCartOverlay = document.getElementById('miniCartOverlay');
        if (miniCartDrawer) miniCartDrawer.classList.remove('active');
        if (miniCartOverlay) miniCartOverlay.classList.remove('active');
    };

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#cartBtn') || e.target.closest('#dwNavCart')) {
            openMiniCart();
        }
        if (e.target.closest('#miniCartClose') || e.target.id === 'miniCartOverlay') {
            closeMiniCart();
        }
        if (e.target.classList.contains('mini-cart-item-remove')) {
            const id = e.target.dataset.removeId;
            removeFromCart(id);
            renderMiniCart();
        }
    });
}
