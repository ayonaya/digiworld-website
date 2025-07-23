// /cart-manager.js

// --- STATE & CONFIGURATION ---
let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
let allProducts = []; // This will be populated by the scripts that use this manager
const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };
let currentCurr = localStorage.getItem('userCurrency') || 'USD';

// --- CORE CART FUNCTIONS ---

/**
 * Saves the current cart state to localStorage.
 */
function saveCart() {
    localStorage.setItem('digiworldCart', JSON.stringify(cart));
}

/**
 * Adds a product to the cart or increments its quantity.
 * @param {string} productId - The ID of the product to add.
 */
export function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    saveCart();
    updateCartBadge();
}

/**
 * Removes a product completely from the cart.
 * @param {string} productId - The ID of the product to remove.
 */
export function removeFromCart(productId) {
    delete cart[productId];
    saveCart();
    updateCartBadge();
}

/**
 * Updates the quantity of a specific product in the cart.
 * @param {string} productId - The ID of the product to update.
 * @param {number} quantity - The new quantity.
 */
export function updateQuantity(productId, quantity) {
    if (quantity > 0) {
        cart[productId] = quantity;
    } else {
        delete cart[productId];
    }
    saveCart();
    updateCartBadge();
}

// --- UI UPDATE FUNCTIONS ---

/**
 * Updates the cart count badge in the header.
 */
export function updateCartBadge() {
    const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
    const cartCountDesktop = document.getElementById('cartCount');
    const cartCountMobile = document.getElementById('dwCartCount');
    if (cartCountDesktop) cartCountDesktop.textContent = count;
    if (cartCountMobile) cartCountMobile.textContent = count;
}

/**
 * Renders the contents of the mini-cart drawer.
 */
export function renderMiniCart() {
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

// --- INITIALIZATION & HELPERS ---

/**
 * Initializes the cart manager with product data and sets up UI listeners.
 * @param {Array} productsData - The array of all products from the server.
 */
export function initializeCart(productsData) {
    allProducts = productsData;
    currentCurr = localStorage.getItem('userCurrency') || 'USD';
    
    // Attach listeners for mini-cart functionality
    const miniCartDrawer = document.getElementById('miniCartDrawer');
    const miniCartOverlay = document.getElementById('miniCartOverlay');
    const miniCartClose = document.getElementById('miniCartClose');
    const cartBtn = document.getElementById('cartBtn');
    const dwNavCartBtn = document.getElementById('dwNavCart');

    const openMiniCart = () => {
        renderMiniCart();
        if (miniCartDrawer) miniCartDrawer.classList.add('active');
        if (miniCartOverlay) miniCartOverlay.classList.add('active');
    };

    const closeMiniCart = () => {
        if (miniCartDrawer) miniCartDrawer.classList.remove('active');
        if (miniCartOverlay) miniCartOverlay.classList.remove('active');
    };

    if (cartBtn) cartBtn.onclick = openMiniCart;
    if (dwNavCartBtn) dwNavCartBtn.onclick = openMiniCart;
    if (miniCartClose) miniCartClose.onclick = closeMiniCart;
    if (miniCartOverlay) miniCartOverlay.onclick = (e) => { if(e.target === miniCartOverlay) closeMiniCart(); };
    
    // Listener for removing items from the mini-cart
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('mini-cart-item-remove')) {
            const id = e.target.dataset.removeId;
            removeFromCart(id);
            renderMiniCart(); // Re-render after removal
        }
    });

    updateCartBadge();
}
