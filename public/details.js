// /details.js
import { initializeCart, addToCart, renderMiniCart } from './cart-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM ELEMENTS & STATE ---
    const detailsContainer = document.getElementById('product-details-container');
    const reviewsList = document.getElementById('reviews-list');
    const reviewForm = document.getElementById('review-form');
    const relatedProductsContainer = document.getElementById('related-products-list');

    let allProducts = [];
    let currentProduct = null;
    const currentCurr = localStorage.getItem('userCurrency') || 'USD';
    const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };
    
    // --- INITIALIZATION & FETCH ---
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        detailsContainer.innerHTML = '<p>No product ID provided.</p>';
        return;
    }

    try {
        // Show skeleton loader while fetching
        showSkeletonLoader();

        const [productResponse, allProductsResponse] = await Promise.all([
            fetch(`/.netlify/functions/get-products?id=${productId}`),
            fetch(`/.netlify/functions/get-products`)
        ]);

        if (!productResponse.ok) throw new Error('Failed to load product details.');
        const productData = await productResponse.json();
        if (!productData.success) throw new Error(productData.message);
        currentProduct = productData.product;
        
        if (allProductsResponse.ok) {
            const allProductsData = await allProductsResponse.json();
            if (allProductsData.success) allProducts = allProductsData.products;
        }

        // Render all page components with the fetched data
        renderProduct(currentProduct);
        renderInfoTabs(currentProduct);
        renderRelatedProducts(currentProduct, allProducts);
        fetchAndRenderReviews(productId);
        
        initializeCart(allProducts); // Initialize cart manager with all product data

    } catch (error) {
        console.error("Error loading page:", error);
        detailsContainer.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }

    // --- RENDER FUNCTIONS ---
    function renderProduct(product) {
        document.title = `Buy ${product.name.en} | DigiWorld`;
        const name = product.name?.en || 'Product Name';
        const image = product.image || 'https://placehold.co/600x400?text=No+Image';
        const delivery = product.delivery?.en || 'Standard Delivery';
        const price = product.price[currentCurr] || product.price.USD;
        const description = product.desc?.en || 'No description available.';
        const currencySymbol = currencySymbols[currentCurr] || '$';
        
        detailsContainer.innerHTML = `
            <div class="product-details-grid">
                <div class="product-image-container"><img src="${image}" alt="${name}"></div>
                <div class="product-info">
                    <h1 class="product-title">${name}</h1>
                    <p class="product-delivery"><i class="fas fa-check-circle"></i> ${delivery}</p>
                    <p class="product-price">${currencySymbol}${price.toFixed(2)}</p>
                    <div class="product-description">${description}</div>
                    <div class="product-actions">
                        <button class="action-button add-to-cart" data-id="${product.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
                        <a href="checkout.html" class="action-button buy-now"><i class="fas fa-bolt"></i> Buy Now</a>
                    </div>
                </div>
            </div>`;
        
        // Show the sections that were hidden during loading
        document.querySelector('.product-info-tabs').style.display = 'block';
        document.querySelector('.reviews-container').style.display = 'block';
        document.querySelector('.related-products-container').style.display = 'block';
    }

    function renderInfoTabs(product) {
        const lang = 'en';
        document.getElementById('features').innerHTML = `<ul>${(product.features?.[lang] || []).map(f => `<li>${f}</li>`).join('')}</ul>`;
        document.getElementById('requirements').innerHTML = `<ul>${(product.requirements?.[lang] || []).map(r => `<li>${r}</li>`).join('')}</ul>`;
        document.getElementById('activation').innerHTML = `<ol>${(product.activation?.[lang] || []).map(a => `<li>${a}</li>`).join('')}</ol>`;
    }

    function renderRelatedProducts(currentProd, allProds) {
        const related = allProds.filter(p => p.category === currentProd.category && p.id !== currentProd.id).slice(0, 4);
        if (related.length > 0) {
            relatedProductsContainer.innerHTML = related.map(product => {
                const price = product.price[currentCurr] || product.price.USD;
                const currencySymbol = currencySymbols[currentCurr] || '$';
                return `
                    <a href="product-details.html?id=${product.id}" class="product-card">
                        <img src="${product.image}" alt="${product.name.en}" class="product-card-img">
                        <div class="product-card-info">
                            <h3 class="product-card-title">${product.name.en}</h3>
                            <p class="product-card-price">${currencySymbol}${price.toFixed(2)}</p>
                        </div>
                    </a>`;
            }).join('');
        }
    }

    async function fetchAndRenderReviews(prodId) {
        reviewsList.innerHTML = '<p>Loading reviews...</p>';
        try {
            const response = await fetch(`/.netlify/functions/get-reviews?productId=${prodId}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            if (result.reviews.length === 0) {
                reviewsList.innerHTML = '<p>Be the first to review this product!</p>';
                return;
            }
            reviewsList.innerHTML = result.reviews.map(review => {
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                return `
                    <div class="review-card">
                        <div class="review-header">
                            <span class="review-author">${review.authorName}</span>
                            <span class="star-rating">${stars}</span>
                        </div>
                        <p class="review-text">${review.reviewText}</p>
                    </div>`;
            }).join('');
        } catch (error) {
            reviewsList.innerHTML = `<p style="color:red;">Could not load reviews.</p>`;
        }
    }
    
    function showSkeletonLoader() {
        detailsContainer.innerHTML = `
            <div class="skeleton-details-grid">
                <div class="skeleton-image-container"></div>
                <div class="skeleton-info">
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line price"></div>
                    <div class="skeleton-line text"></div>
                    <div class="skeleton-line text"></div>
                    <div class="skeleton-line text-short"></div>
                    <div class="skeleton-button"></div>
                </div>
            </div>`;
    }

    // --- EVENT LISTENERS ---
    document.body.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart');
        const buyNowBtn = e.target.closest('.buy-now');

        if (addToCartBtn) {
            const prodId = addToCartBtn.dataset.id;
            addToCart(prodId);
            renderMiniCart(); // Re-render the mini cart to show the new item
            // Open the mini-cart
            document.getElementById('miniCartDrawer')?.classList.add('active');
            document.getElementById('miniCartOverlay')?.classList.add('active');
        }

        if (buyNowBtn) {
            e.preventDefault(); // Prevent the link from navigating immediately
            const prodId = currentProduct.id;
            addToCart(prodId); // Add the item to the cart first
            window.location.href = 'checkout.html'; // Then go to checkout
        }
    });

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            formMessage.textContent = 'Submitting...';
            const formData = {
                productId: productId,
                authorName: reviewForm.authorName.value,
                rating: parseInt(reviewForm.rating.value, 10),
                reviewText: reviewForm.reviewText.value
            };

            try {
                const response = await fetch('/.netlify/functions/submit-review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                
                formMessage.style.color = 'green';
                formMessage.textContent = result.message;
                reviewForm.reset();
            } catch (error) {
                formMessage.style.color = 'red';
                formMessage.textContent = `Error: ${error.message}`;
            }
        });
    }
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === button.dataset.tab) {
                    content.classList.add('active');
                }
            });
        });
    });
});
