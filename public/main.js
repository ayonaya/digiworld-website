// /public/main.js

// --- App State & Data Cache ---
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
let currentCurrency = localStorage.getItem('digiworldCurrency') || 'USD';
const currencySymbols = { USD: '$', LKR: 'Rs', EUR: '€', GBP: '£', INR: '₹' };

// --- Core Functions ---

/**
 * Fetches the product list from the server. Uses a cached version after the first load.
 */
async function fetchAllProducts() {
    if (allProducts.length > 0) return allProducts;
    try {
        const response = await fetch('/.netlify/functions/get-products');
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.products)) {
            allProducts = data.products;
            return allProducts;
        }
    } catch (error) {
        console.error("Could not fetch products:", error);
    }
    return [];
}

/**
 * Loads reusable HTML components like the header and footer.
 */
async function loadComponent(selector, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.text();
        const element = document.querySelector(selector);
        if (element) element.innerHTML = data;
    } catch (error) {
        console.error(`Failed to load component: ${error.message}`);
    }
}

// --- Cart Management ---

function saveCart() {
    localStorage.setItem('digiworldCart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    saveCart();
    const product = allProducts.find(p => p.id === productId);
    showNotification(`${product?.name.en || 'Item'} added to cart!`);
}

// --- UI Rendering ---

function updateCartBadge() {
    const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
    const badges = document.querySelectorAll('.cart-icon-badge');
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function renderProductGrid(gridElement) {
    if (!allProducts || allProducts.length === 0) {
        gridElement.innerHTML = '<p>No products found at this time. Please check back later.</p>';
        return;
    }
    const symbol = currencySymbols[currentCurrency] || '$';
    gridElement.innerHTML = allProducts.map(prod => `
        <div class="product-card">
            <a href="product-details.html?id=${prod.id}" class="product-link">
                <div class="card-image-container">
                    <img class="card-image" src="${prod.image}" alt="${prod.name.en}" loading="lazy">
                    ${prod.isHot ? '<span class="product-badge hot">HOT</span>' : ''}
                </div>
                <div class="card-content-wrapper">
                    <h3 class="product-name">${prod.name.en}</h3>
                    <p class="product-price">${symbol}${(prod.price[currentCurrency] || 0).toFixed(2)}</p>
                </div>
            </a>
            <div class="card-buttons">
                <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function renderProductDetailsPage(pageElement) {
    const productId = new URLSearchParams(window.location.search).get('id');
    const product = allProducts.find(p => p.id === productId);

    if (!product) {
        pageElement.innerHTML = `<p class="error-message">Sorry, this product could not be found.</p>`;
        return;
    }

    document.title = `DigiWorld - ${product.name.en}`;
    const symbol = currencySymbols[currentCurrency] || '$';
    const price = product.price[currentCurrency] || 0;

    pageElement.innerHTML = `
        <div class="product-details-container">
            <div class="product-hero">
                <div class="product-details-image">
                    <img src="${product.image}" alt="${product.name.en}">
                </div>
                <div class="product-details-info">
                    <h1>${product.name.en}</h1>
                    <p class="product-details-price">${symbol}${price.toFixed(2)}</p>
                    <p class="short-desc">${product.desc.en}</p>
                    <div class="product-actions">
                        <button class="btn-primary add-to-cart" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
            <div class="product-tabs">
                <nav class="tab-nav">
                    <button class="tab-link active" data-tab="features">Features</button>
                    <button class="tab-link" data-tab="requirements">Requirements</button>
                    <button class="tab-link" data-tab="activation">Activation Guide</button>
                </nav>
                <div id="features" class="tab-content active"><ul>${product.features.en.map(f => `<li>${f}</li>`).join('')}</ul></div>
                <div id="requirements" class="tab-content"><ul>${product.requirements.en.map(r => `<li>${r}</li>`).join('')}</ul></div>
                <div id="activation" class="tab-content"><ol>${product.activation.en.map(a => `<li>${a}</li>`).join('')}</ol></div>
            </div>
        </div>
    `;
    fetchAndRenderReviews(productId);
}

async function fetchAndRenderReviews(productId) {
    const placeholder = document.getElementById('reviews-section-placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = `<p>Loading reviews...</p>`;

    try {
        const response = await fetch(`/.netlify/functions/get-reviews?productId=${productId}`);
        if (!response.ok) throw new Error('Could not fetch reviews.');
        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        const reviews = data.reviews;
        const reviewCount = reviews.length;
        const averageRating = reviewCount > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1) : 0;
        const renderStars = (rating) => Array.from({length: 5}, (_, i) => `<i class="fa-star ${i < Math.round(rating) ? 'fas' : 'far'}"></i>`).join('');

        placeholder.innerHTML = `
            <div class="reviews-container">
                <h2>Customer Reviews</h2>
                <div class="reviews-summary">
                    <div class="summary-box">
                        <div class="big-number">${averageRating}</div>
                        <div class="stars">${renderStars(averageRating)}</div>
                        <div class="label">Based on ${reviewCount} reviews</div>
                    </div>
                </div>
                <div class="reviews-grid">
                    ${reviews.length > 0 ? reviews.map(review => `
                        <div class="review-card">
                            <div class="review-card-header">
                                <span class="author">${review.authorName}</span>
                                <span class="stars">${renderStars(review.rating)}</span>
                            </div>
                            <p class="review-text">${review.reviewText}</p>
                            <p class="review-date">${new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                    `).join('') : '<p style="text-align:center; grid-column: 1 / -1;">No reviews yet. Be the first to write one!</p>'}
                </div>
                <div class="review-form-container">
                    <h3>Write a Review</h3>
                    <form class="review-form" id="reviewForm">
                        <div class="form-group form-group-full star-rating-input">
                            <input type="radio" id="star5" name="rating" value="5" required><label for="star5" title="5 stars">★</label>
                            <input type="radio" id="star4" name="rating" value="4"><label for="star4" title="4 stars">★</label>
                            <input type="radio" id="star3" name="rating" value="3"><label for="star3" title="3 stars">★</label>
                            <input type="radio" id="star2" name="rating" value="2"><label for="star2" title="2 stars">★</label>
                            <input type="radio" id="star1" name="rating" value="1"><label for="star1" title="1 star">★</label>
                        </div>
                        <div class="form-group"><label for="authorName">Your Name</label><input type="text" id="authorName" name="authorName" required></div>
                        <div class="form-group form-group-full"><label for="reviewText">Your Review</label><textarea id="reviewText" name="reviewText" required minlength="10"></textarea></div>
                        <div class="form-group form-group-full"><button type="submit" class="btn-primary">Submit Review</button></div>
                        <div class="form-message" id="reviewFormMessage"></div>
                    </form>
                </div>
            </div>`;
        setupReviewForm(productId);
    } catch (error) {
        placeholder.innerHTML = `<p class="error-message">Could not load reviews.</p>`;
    }
}

function setupReviewForm(productId) {
    const reviewForm = document.getElementById('reviewForm');
    if (!reviewForm) return;
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formMessage = document.getElementById('reviewFormMessage');
        const submitButton = reviewForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        const reviewData = {
            productId: productId,
            authorName: reviewForm.authorName.value,
            rating: parseInt(reviewForm.rating.value, 10),
            reviewText: reviewForm.reviewText.value
        };

        try {
            const response = await fetch('/.netlify/functions/submit-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);
            formMessage.className = 'form-message success';
            formMessage.textContent = result.message;
            reviewForm.reset();
        } catch (error) {
            formMessage.className = 'form-message error';
            formMessage.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Review';
        }
    });
}

// --- Component Logic ---

function setupBannerSlider() {
    const banner = document.getElementById('bannerSlider');
    if (!banner) return;
    const slides = banner.querySelectorAll('.banner-slide');
    const controls = banner.querySelector('.banner-slider-controls');
    if (slides.length <= 1) return;

    let currentSlide = 0;
    let slideInterval = setInterval(nextSlide, 5000);

    function showSlide(index) {
        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        if (controls) Array.from(controls.children).forEach((dot, i) => dot.classList.toggle('active', i === index));
        currentSlide = index;
    }

    function nextSlide() {
        showSlide((currentSlide + 1) % slides.length);
    }

    if (controls) {
        controls.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'banner-slider-dot';
            dot.addEventListener('click', () => {
                showSlide(i);
                clearInterval(slideInterval);
                slideInterval = setInterval(nextSlide, 5000);
            });
            controls.appendChild(dot);
        });
    }
    showSlide(0);
}

// --- Event Listeners ---

function setupGlobalEventListeners() {
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.add-to-cart')) {
            addToCart(e.target.dataset.id);
        }
        if (e.target.matches('.tab-link')) {
            const tabId = e.target.dataset.tab;
            const container = e.target.closest('.product-tabs');
            if (container) {
                container.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                container.querySelector(`#${tabId}`).classList.add('active');
            }
        }
    });
}

// --- Main Execution ---

async function main() {
    await Promise.all([
        loadComponent('#header-placeholder', 'header.html'),
        loadComponent('#footer-placeholder', 'footer.html')
    ]);

    await fetchAllProducts();
    
    const productGrid = document.getElementById('productGrid');
    const productDetailsPage = document.getElementById('product-details-page');

    if (productGrid) {
        renderProductGrid(productGrid);
        document.addEventListener('currencyChanged', () => renderProductGrid(productGrid));
    }
    if (productDetailsPage) {
        renderProductDetailsPage(productDetailsPage);
        document.addEventListener('currencyChanged', () => renderProductDetailsPage(productDetailsPage));
    }
    
    setupGlobalEventListeners();
    updateCartBadge();
    setupBannerSlider();
}

document.addEventListener('DOMContentLoaded', main);
