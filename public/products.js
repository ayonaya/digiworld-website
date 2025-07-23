document.addEventListener('DOMContentLoaded', function() {
    const productGrid = document.getElementById('product-grid');

    const showSkeletonLoader = () => {
        if (!productGrid) return;
        productGrid.innerHTML = ''; // Clear previous content
        // Show 6 skeleton cards while loading
        for (let i = 0; i < 6; i++) {
            const skeleton = document.createElement('div');
            skeleton.classList.add('skeleton-card');
            skeleton.innerHTML = `
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            `;
            productGrid.appendChild(skeleton);
        }
    };

    const loadProducts = async () => {
        if (!productGrid) return;
        showSkeletonLoader();

        try {
            // --- IMPORTANT ---
            // Replace this setTimeout with your actual product fetching logic.
            // For example: const response = await fetch('/.netlify/functions/get-products');
            // const products = await response.json();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulates a 2-second network delay

            // This is your mock product data. Replace with the actual fetched data.
            const products = [
                { id: 1, name: 'Digital Art Pack', image: 'https://placehold.co/300x200/3498db/FFFFFF?text=Product+1', price: 25.00 },
                { id: 2, name: 'E-book Template', image: 'https://placehold.co/300x200/2ecc71/FFFFFF?text=Product+2', price: 15.00 },
                { id: 3, name: 'Software License', image: 'https://placehold.co/300x200/e74c3c/FFFFFF?text=Product+3', price: 99.00 },
                { id: 4, name: 'Music Loops Pack', image: 'https://placehold.co/300x200/9b59b6/FFFFFF?text=Product+4', price: 30.00 },
                { id: 5, name: 'Video Course', image: 'https://placehold.co/300x200/f1c40f/FFFFFF?text=Product+5', price: 49.99 },
                { id: 6, name: 'Font Bundle', image: 'https://placehold.co/300x200/1abc9c/FFFFFF?text=Product+6', price: 19.50 },
            ];

            productGrid.innerHTML = ''; // Clear skeletons
            products.forEach(product => {
                const productCard = document.createElement('div');
                // Use the same class names as your original product cards
                productCard.className = 'product-card'; 
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="product-card-content">
                        <h3>${product.name}</h3>
                        <p class="price">$${product.price.toFixed(2)}</p>
                        <button class="btn add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                    </div>
                `;
                productGrid.appendChild(productCard);
            });
        } catch (error) {
            console.error("Failed to load products:", error);
            productGrid.innerHTML = '<p>Could not load products at this time. Please try again later.</p>';
        }
    };

    loadProducts();
});
