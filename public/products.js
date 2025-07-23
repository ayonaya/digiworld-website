document.addEventListener('DOMContentLoaded', function() {
    const productGrid = document.getElementById('product-grid');

    // Shows a modern skeleton loading animation while products are being fetched.
    const showSkeletonLoader = () => {
        if (!productGrid) return;
        productGrid.innerHTML = ''; // Clear previous content
        // Display 8 skeleton cards as a placeholder
        for (let i = 0; i < 8; i++) {
            const skeleton = document.createElement('div');
            skeleton.classList.add('skeleton-card'); // Using your styling for this
            skeleton.innerHTML = `
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            `;
            productGrid.appendChild(skeleton);
        }
    };

    // Fetches and displays the products, restoring your original card design.
    const loadProducts = async () => {
        if (!productGrid) return;
        showSkeletonLoader();

        try {
            // STEP 1: Fetching products from your actual Netlify function.
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();

            productGrid.innerHTML = ''; // Clear the skeleton loaders

            // STEP 2: Creating a product card for each product with YOUR original structure.
            products.forEach(product => {
                const productCard = document.createElement('div');
                // Using your original class names for styling.
                productCard.className = 'product-card'; 
                
                // This HTML structure is designed to match your CSS for badges and buttons.
                productCard.innerHTML = `
                    <div class="product-image-container">
                        <a href="product-details.html?id=${product.id}">
                            <img src="${product.image}" alt="${product.name}" class="product-image">
                        </a>
                        <div class="badges">
                            ${product.hot ? '<span class="badge badge-hot">HOT</span>' : ''}
                            ${product.instant ? '<span class="badge badge-instant">INSTANT</span>' : ''}
                        </div>
                    </div>
                    <div class="product-card-content">
                        <h3>${product.name}</h3>
                        <p class="price">$${product.price.toFixed(2)}</p>
                        <div class="product-buttons">
                            <button class="btn btn-buy-now" data-product-id="${product.id}">Buy Now</button>
                            <button class="btn add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                        </div>
                    </div>
                `;
                productGrid.appendChild(productCard);
            });
        } catch (error) {
            console.error("Failed to load products:", error);
            productGrid.innerHTML = '<p style="color: red; text-align: center; width: 100%;">Could not load products. Please check the console for errors.</p>';
        }
    };

    loadProducts();
});
