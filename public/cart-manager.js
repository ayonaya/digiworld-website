// This function can be called from anywhere to update the cart count display
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        // Replace this with your logic to get the actual number of items in the cart
        // For example: const itemCount = JSON.parse(localStorage.getItem('cart') || '[]').length;
        const itemCount = 0; // Placeholder
        
        cartCountElement.textContent = itemCount;
        cartCountElement.style.display = itemCount > 0 ? 'block' : 'none';
    }
}

function flyToCart(startElement, endElement) {
    const flyingImage = startElement.cloneNode(true);
    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();

    flyingImage.classList.add('fly-to-cart-image');
    document.body.appendChild(flyingImage);

    // Set initial position and size
    flyingImage.style.top = `${startRect.top}px`;
    flyingImage.style.left = `${startRect.left}px`;
    flyingImage.style.width = `${startRect.width}px`;
    flyingImage.style.height = `${startRect.height}px`;

    // Trigger the animation to the cart
    requestAnimationFrame(() => {
        flyingImage.style.top = `${endRect.top + endElement.clientHeight / 2 - 10}px`;
        flyingImage.style.left = `${endRect.left + endElement.clientWidth / 2 - 10}px`;
        flyingImage.style.width = '20px';
        flyingImage.style.height = '20px';
        flyingImage.style.opacity = '0';
    });

    // Remove the flying image element from the DOM after the animation is complete
    setTimeout(() => {
        flyingImage.remove();
    }, 1000); // This duration should match the transition time in styles.css
}

document.addEventListener('DOMContentLoaded', function() {
    const productGrid = document.getElementById('product-grid');

    if (productGrid) {
        productGrid.addEventListener('click', function(e) {
            // Check if an "Add to Cart" button was clicked
            if (e.target.classList.contains('add-to-cart-btn')) {
                const productCard = e.target.closest('.product-card');
                const productImage = productCard.querySelector('.product-image');
                const cartIcon = document.querySelector('#cart-icon'); // The main cart icon in your header

                if (productImage && cartIcon) {
                    flyToCart(productImage, cartIcon);
                }
                
                // --- Your existing "add to cart" logic should go here ---
                const productId = e.target.dataset.productId;
                console.log(`Adding product ${productId} to cart.`);
                // Example: addToCart(productId);
                
                // Update the visual count after a short delay to let the animation start
                setTimeout(() => {
                    updateCartCount();
                }, 200);
            }
        });
    }

    // Initial update of the cart count when the page loads
    updateCartCount();
});
