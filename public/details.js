document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. DEFINE ALL DOM ELEMENTS AND STATE VARIABLES ---
    const detailsContainer = document.getElementById('product-details-container');
    const cartBtn = document.getElementById('cartBtn');
    const cartCountBadge = document.getElementById('cartCount');
    const mobileCartBtn = document.getElementById('mobileCartBtn');
    const miniCartOverlay = document.getElementById('miniCartOverlay');
    const miniCartDrawer = document.getElementById('miniCartDrawer');
    const miniCartClose = document.getElementById('miniCartClose');
    const miniCartItemsContainer = document.getElementById('miniCartItems');
    const miniCartTotalEl = document.getElementById('miniCartTotal');
    const currencyDropdown = document.getElementById('currencyDropdown');
    const currencyMenu = document.getElementById('currencyMenu');
    const currentCurrLabel = document.getElementById('currentCurrLabel');
    const reviewsList = document.getElementById('reviews-list');
    const reviewForm = document.getElementById('review-form');

    let currentProduct = null;
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
    let currentCurr = localStorage.getItem('userCurrency') || 'USD';
    const currencySymbols = { USD: '$', LKR: 'Rs ', EUR: '€', GBP: '£', INR: '₹' };

    // --- 2. DEFINE ALL HELPER FUNCTIONS ---

    const updateCartBadge = () => {
        const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
        cartCountBadge.textContent = count;
    };

    const saveCart = () => {
        localStorage.setItem('digiworldCart', JSON.stringify(cart));
        updateCartBadge();
    };

    const updateMiniCartContent = () => {
        let total = 0;
        const currencySymbol = currencySymbols[currentCurr] || '$';
        if (Object.keys(cart).length === 0 || allProducts.length === 0) {
            miniCartItemsContainer.innerHTML = '<p style="padding: 20px; text-align: center;">Your cart is empty.</p>';
            miniCartTotalEl.innerHTML = `<span>Total:</span> <span>${currencySymbol}0.00</span>`;
        } else {
            miniCartItemsContainer.innerHTML = Object.entries(cart).map(([id, quantity]) => {
                const product = allProducts.find(p => p.id === id);
                if (!product) return '';
                const price = product.price[currentCurr] || product.price.USD;
                total += price * quantity;
                return `
                    <div class="mini-cart-item" data-id="${id}">
                        <img src="${product.image}" class="mini-cart-item-img" alt="${product.name?.en}">
                        <div class="mini-cart-item-details">
                            <div class="mini-cart-item-title">${product.name?.en}</div>
                            <div class="mini-cart-item-price">${quantity} x ${currencySymbol}${price.toFixed(2)}</div>
                        </div>
                        <span class="mini-cart-item-remove" data-id="${id}">&times;</span>
                    </div>`;
            }).join('');
            miniCartTotalEl.innerHTML = `<span>Total:</span> <span>${currencySymbol}${total.toFixed(2)}</span>`;
        }
    };
    
    const openMiniCart = () => {
        updateMiniCartContent();
        miniCartOverlay.classList.add('active');
    };

    const closeMiniCart = () => {
        miniCartOverlay.classList.remove('active');
    };

    const setCurrency = (newCurrency) => {
        currentCurr = newCurrency;
        localStorage.setItem('userCurrency', newCurrency);
        currentCurrLabel.textContent = newCurrency;
        if (currentProduct) {
            renderProduct(currentProduct);
            renderRelatedProducts(currentProduct, allProducts);
        }
        updateMiniCartContent();
    };
    
    const renderInfoTabs = (product) => {
        const lang = 'en';
        const features = product.features?.[lang] || ['No features listed.'];
        const requirements = product.requirements?.[lang] || ['No requirements listed.'];
        const activation = product.activation?.[lang] || ['No activation steps listed.'];
        document.getElementById('features').innerHTML = `<ul>${features.map(f => `<li>${f}</li>`).join('')}</ul>`;
        document.getElementById('requirements').innerHTML = `<ul>${requirements.map(r => `<li>${r}</li>`).join('')}</ul>`;
        document.getElementById('activation').innerHTML = `<ul>${activation.map(a => `<li>${a}</li>`).join('')}</ul>`;
    };

    const renderRelatedProducts = (currentProduct, allProducts) => {
        const relatedListContainer = document.getElementById('related-products-list');
        const relatedContainer = document.querySelector('.related-products-container');
        if (!relatedListContainer || !relatedContainer) return;
        const relatedProducts = allProducts.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id).slice(0, 4);
        if (relatedProducts.length === 0) {
            relatedContainer.style.display = 'none';
            return;
        }
        relatedContainer.style.display = 'block';
        const currencySymbol = currencySymbols[currentCurr] || '$';
        relatedListContainer.innerHTML = relatedProducts.map(product => {
            const price = product.price[currentCurr] || product.price.USD;
            const hotBadgeHTML = product.isHot ? `<div class="hot-badge"><i class="fas fa-fire"></i> Hot Deal</div>` : '';
            return `
                <a href="product-details.html?id=${product.id}" class="product-card">
                    ${hotBadgeHTML}
                    <img src="${product.image}" alt="${product.name?.en}" class="product-card-img" style="height:150px; object-fit:contain; padding:10px;">
                    <div class="product-card-info" style="padding:15px;">
                        <h3 class="product-card-title">${product.name?.en}</h3>
                        <p class="product-card-price">${currencySymbol}${price.toFixed(2)}</p>
                    </div>
                </a>`;
        }).join('');
    };

    const fetchAndRenderReviews = async (productId) => {
        reviewsList.innerHTML = '<p>Loading reviews...</p>';
        try {
            const response = await fetch(`/.netlify/functions/get-reviews?productId=${productId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            if (result.reviews.length === 0) {
                reviewsList.innerHTML = '<p>Be the first to review this product!</p>';
                return;
            }
            reviewsList.innerHTML = result.reviews.map(review => {
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                return `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="review-author-info">
                                <i class="fas fa-user-circle"></i>
                                <div>
                                    <div class="review-author">${review.authorName}</div>
                                    <div class="review-date">${reviewDate}</div>
                                </div>
                            </div>
                            <div class="star-rating">${stars}</div>
                        </div>
                        <p class="review-text">${review.reviewText}</p>
                    </div>`;
            }).join('');
        } catch (error) {
            console.error('Error fetching reviews:', error);
            reviewsList.innerHTML = `<p style="color: red;">Could not load reviews.</p>`;
        }
    };

    const renderProduct = (product) => {
        currentProduct = product;
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
                        <a href="checkout.html?product=${product.id}" class="action-button buy-now"><i class="fas fa-bolt"></i> Buy Now</a>
                    </div>
                </div>
            </div>`;
        
        document.querySelector('.product-info-tabs').style.display = 'block';
        document.querySelector('.reviews-container').style.display = 'block';
        document.querySelector('.related-products-container').style.display = 'block';

        renderInfoTabs(product); // Now this function is defined before being called
    };

    // --- 3. ADD EVENT LISTENERS ---
    if (cartBtn) cartBtn.addEventListener('click', openMiniCart);
    if (mobileCartBtn) mobileCartBtn.addEventListener('click', openMiniCart);
    if (miniCartClose) miniCartClose.addEventListener('click', closeMiniCart);
    if (miniCartOverlay) miniCartOverlay.addEventListener('click', (e) => { if (e.target === miniCartOverlay) closeMiniCart(); });
    
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.add-to-cart')) {
            const prodId = e.target.dataset.id;
            cart[prodId] = (cart[prodId] || 0) + 1;
            saveCart();
            openMiniCart();
        }
        if (e.target.matches('.mini-cart-item-remove')) {
            const itemId = e.target.dataset.id;
            delete cart[itemId];
            saveCart();
            updateMiniCartContent();
        }
    });

    currencyDropdown.addEventListener('click', (event) => { event.stopPropagation(); currencyDropdown.classList.toggle('open'); });
    document.addEventListener('click', () => { if (currencyDropdown.classList.contains('open')) { currencyDropdown.classList.remove('open'); } });
    currencyMenu.addEventListener('click', (e) => {
        if (e.target.matches('.dropdown-item')) {
            e.preventDefault();
            const newCurrency = e.target.dataset.currency;
            setCurrency(newCurrency);
        }
    });

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === button.dataset.tab) { content.classList.add('active'); }
            });
        });
    });

    if(reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            formMessage.textContent = 'Submitting...';
            const ratingValue = document.querySelector('input[name="rating"]:checked')?.value;
            if (!ratingValue) { formMessage.textContent = 'Please select a star rating.'; return; }
            const formData = {
                productId: new URLSearchParams(window.location.search).get('id'),
                authorName: document.getElementById('authorName').value,
                rating: parseInt(ratingValue, 10),
                reviewText: document.getElementById('reviewText').value
            };
            try {
                const response = await fetch('/.netlify/functions/submit-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
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

    // --- 4. RUN MAIN EXECUTION LOGIC ---
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        detailsContainer.innerHTML = '<p>No product ID provided.</p>';
    } else {
        try {
            const [productResponse, allProductsResponse] = await Promise.all([
                fetch(`/.netlify/functions/get-products?id=${productId}`),
                fetch(`/.netlify/functions/get-products`)
            ]);

            if (!productResponse.ok) throw new Error('Failed to load product details.');
            const productData = await productResponse.json();
            if (!productData.success) throw new Error(productData.message);
            
            if (allProductsResponse.ok) {
                const allProductsData = await allProductsResponse.json();
                if (allProductsData.success) allProducts = allProductsData.products;
            }

            renderProduct(productData.product);
            fetchAndRenderReviews(productId);
            renderRelatedProducts(productData.product, allProducts);
            updateMiniCartContent();

        } catch (error) {
            console.error("Error loading page:", error);
            detailsContainer.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        }
    }
    
    updateCartBadge();
    setCurrency(currentCurr);
});
