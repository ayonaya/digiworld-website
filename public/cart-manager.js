// --- CART LOGIC (Based on your original files) ---

// Retrieves the cart from localStorage.
function getCartItems() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

// Saves the cart to localStorage.
function saveCartItems(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Adds a product to the cart or increments its quantity.
function addToCart(productId) {
    let cart = getCartItems();
    
    const existingProductIndex = cart.findIndex(item => item.id === productId);

    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity++;
    } else {
        // You might want to fetch product details here to add more info to the cart
        cart.push({ id: productId, quantity: 1 });
    }
    
    saveCartItems(cart);
    updateCartCount();
    // A more subtle notification could be used here instead of an alert
    console.log(`Product ${productId} added to cart.`);
}

// Updates the cart item count displayed in the header.
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        // Calculates total quantity of all items in the cart
        const itemCount = getCartItems().reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = itemCount;
        cartCountElement.style.display = itemCount > 0 ? 'block' : 'none';
    }
}

// --- FLY TO CART ANIMATION ---

// Creates and manages the "fly to cart" visual effect.
function flyToCart(startElement, endElement) {
    if (!startElement || !endElement) return;

    const flyingImage = startElement.cloneNode(true);
    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();

    flyingImage.classList.add('fly-to-cart-image');
    document.body.appendChild(flyingImage);

    // Set initial position and size of the flying image.
    flyingImage.style.top = `${startRect.top}px`;
    flyingImage.style.left = `${startRect.left}px`;
    flyingImage.style.width = `${startRect.width}px`;
    flyingImage.style.height = `${startRect.height}px`;

    // Animate the image towards the cart icon.
    requestAnimationFrame(() => {
        flyingImage.style.top = `${endRect.top + endElement.clientHeight / 2 - 10}px`;
        flyingImage.style.left = `${endRect.left + endElement.clientWidth / 2 - 10}px`;
        flyingImage.style.width = '20px';
        flyingImage.style.height = '20px';
        flyingImage.style.opacity = '0';
    });

    // Remove the flying image from the page after the animation completes.
    setTimeout(() => {
        flyingImage.remove();
    }, 1000); // This duration must match the transition time in your CSS.
}

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', function() {
    // Use event delegation on the body to handle clicks on dynamically added product buttons.
    document.body.addEventListener('click', function(e) {
        if (!e.target) return;

        const productId = e.target.dataset.productId;
        if (!productId) return;

        // Handle "Add to Cart" button click
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productCard = e.target.closest('.product-card');
            const productImage = productCard.querySelector('.product-image');
            const cartIcon = document.querySelector('#cart-icon');

            flyToCart(productImage, cartIcon);
            
            // Add item to cart after a short delay to allow animation to start
            setTimeout(() => {
                addToCart(productId);
            }, 100);
        }

        // Handle "Buy Now" button click
        if (e.target.classList.contains('btn-buy-now')) {
            // Add the product to the cart and immediately redirect to the checkout page.
            addToCart(productId);
            window.location.href = 'checkout.html';
        }
    });

    // Update the cart count when the page first loads.
    updateCartCount();
});
