import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbBDB38gK4lD-E3wYgfTSQbZ28WCmJB6M",
  authDomain: "digiworld-46a1e.firebaseapp.com",
  projectId: "digiworld-46a1e",
  storageBucket: "digiworld-46a1e.appspot.com",
  messagingSenderId: "242235397710",
  appId: "1:242235397710:web:a80c15cc285188610cd51f",
  measurementId: "G-R8C4BWHXBL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL APP STATE & DATA CACHE ---
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
    let currentCurrency = localStorage.getItem('digiworldCurrency') || 'USD';
    const currencySymbols = { USD: '$', LKR: 'Rs', EUR: '€', GBP: '£', INR: '₹' };

    // --- CORE DATA FETCHING ---
    async function fetchAllProducts() {
        if (allProducts.length > 0) return allProducts;
        try {
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            if (data.success && Array.isArray(data.products)) {
                allProducts = data.products;
                return allProducts;
            } else {
                throw new Error("Invalid data format from product API.");
            }
        } catch (error) {
            console.error("Could not fetch products:", error);
            allProducts = [];
        }
        return [];
    }

    // --- COMPONENT & UI RENDERING ---
    async function loadComponent(selector, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Could not load ${url}`);
            const data = await response.text();
            const element = document.querySelector(selector);
            if (element) element.innerHTML = data;
        } catch (error) {
            console.error(error);
        }
    }

    function renderProductGrid(gridElement) {
        if (!allProducts || allProducts.length === 0) {
            gridElement.innerHTML = '<p class="error-message">No products found at this time. Please check back later.</p>';
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
            </div>`).join('');
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
                </div>`;
        } catch (error) {
            placeholder.innerHTML = `<p class="error-message">Could not load reviews.</p>`;
        }
    }

    // --- COMPONENT LOGIC ---
    function setupBannerSlider() {
        const banner = document.getElementById('bannerSlider');
        if (!banner) return;
        const slides = banner.querySelectorAll('.banner-slide');
        const controls = banner.querySelector('.banner-slider-controls');
        if (slides.length <= 1) {
            if (controls) controls.style.display = 'none';
            return;
        }

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
    
    // --- INITIALIZATION ---
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
        }
        if (productDetailsPage) {
            renderProductDetailsPage(productDetailsPage);
        }
        
        setupBannerSlider();
    }

    main();
});
