// main.js

// Import Firebase v9 modular SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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

    // --- GLOBAL APP STATE & DATA ---
    let products = [];
    const languages = {
        'EN': { name: 'English', flag: '🇬🇧' },
        'SI': { name: 'සිංහල', flag: '🇱🇰' }
        // Add more languages as needed
    };
    const currencies = ['LKR', 'USD', 'EUR', 'GBP']; // Add more currencies as needed

    // --- DOM ELEMENTS ---
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    // Load header and footer
    if (headerPlaceholder) {
        fetch('header.html')
            .then(response => response.text())
            .then(html => {
                headerPlaceholder.innerHTML = html;
                initializeHeaderElements();
                setupSmoothScrolling(); // Call the smooth scrolling setup after header is loaded
            })
            .catch(error => console.error('Error loading header:', error));
    }

    if (footerPlaceholder) {
        fetch('footer.html')
            .then(response => response.text())
            .then(html => {
                footerPlaceholder.innerHTML = html;
            })
            .catch(error => console.error('Error loading footer:', error));
    }

    // Language and Currency Switcher (EXISTING CODE - ANIMATION IS ALREADY IN CSS)
    let langCurrBtn;
    let langCurrDropdown;
    let langSelect;
    let currSelect;
    let langCurrSaveBtn;
    let currentLangSpan;
    let currentCurrSpan;
    let currentFlagSpan;

    function initializeHeaderElements() {
        langCurrBtn = document.getElementById('lang-curr-btn');
        langCurrDropdown = document.getElementById('lang-curr-dropdown');
        langSelect = document.getElementById('lang-select');
        currSelect = document.getElementById('curr-select');
        langCurrSaveBtn = document.getElementById('lang-curr-save-btn');
        currentLangSpan = document.getElementById('current-lang');
        currentCurrSpan = document.getElementById('current-curr');
        currentFlagSpan = document.getElementById('current-flag');

        if (langCurrBtn && langCurrDropdown) {
            langCurrBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent document click from closing immediately
                langCurrDropdown.classList.toggle('active');
            });
        }

        // Account Dropdown (EXISTING CODE - ANIMATION IS ALREADY IN CSS)
        const accountBtn = document.getElementById('accountBtn');
        const accountMenu = document.getElementById('accountMenu');

        if (accountBtn && accountMenu) {
            accountBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                accountMenu.classList.toggle('active');
            });
        }

        // Mini Cart Toggle
        const cartBtn = document.getElementById('cartBtn');
        const miniCart = document.getElementById('miniCart');
        const closeMiniCart = document.getElementById('closeMiniCart');

        if (cartBtn && miniCart && closeMiniCart) {
            cartBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent document click from closing immediately
                miniCart.classList.toggle('active');
            });

            closeMiniCart.addEventListener('click', () => {
                miniCart.classList.remove('active');
            });
        }


        // Close dropdowns when clicking outside
        document.addEventListener('click', (event) => {
            if (langCurrDropdown && !langCurrDropdown.contains(event.target) && langCurrDropdown.classList.contains('active')) {
                langCurrDropdown.classList.remove('active');
            }
            if (accountMenu && !accountMenu.contains(event.target) && accountMenu.classList.contains('active')) {
                accountMenu.classList.remove('active');
            }
            if (miniCart && !miniCart.contains(event.target) && miniCart.classList.contains('active')) {
                miniCart.classList.remove('active');
            }
        });

        // Populate language and currency selectors
        if (langSelect && currSelect) {
            Object.keys(languages).forEach(langCode => {
                const option = document.createElement('option');
                option.value = langCode;
                option.textContent = languages[langCode].name;
                langSelect.appendChild(option);
            });

            currencies.forEach(currencyCode => {
                const option = document.createElement('option');
                option.value = currencyCode;
                option.textContent = currencyCode;
                currSelect.appendChild(option);
            });

            // Set initial values from localStorage or defaults
            currentLangSpan.textContent = localStorage.getItem('siteLang') || 'EN';
            currentCurrSpan.textContent = localStorage.getItem('siteCurr') || 'LKR';
            currentFlagSpan.textContent = languages[currentLangSpan.textContent]?.flag || '🇬🇧';
            langSelect.value = currentLangSpan.textContent;
            currSelect.value = currentCurrSpan.textContent;

            langCurrSaveBtn.addEventListener('click', () => {
                localStorage.setItem('siteLang', langSelect.value);
                localStorage.setItem('siteCurr', currSelect.value);
                currentLangSpan.textContent = langSelect.value;
                currentCurrSpan.textContent = currSelect.value;
                currentFlagSpan.textContent = languages[langSelect.value]?.flag || '🇬🇧';
                langCurrDropdown.classList.remove('active');
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchResultsDiv = document.getElementById('searchResults');

        if (searchInput && searchResultsDiv) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                searchResultsDiv.innerHTML = ''; // Clear previous results

                if (query.length > 0) {
                    const filteredProducts = products.filter(product =>
                        product.name.toLowerCase().includes(query) ||
                        product.description.toLowerCase().includes(query)
                    );

                    if (filteredProducts.length > 0) {
                        filteredProducts.forEach(product => {
                            const resultItem = document.createElement('a');
                            resultItem.href = `product-details.html?id=${product.id}`;
                            resultItem.className = 'search-result-item';
                            resultItem.innerHTML = `
                                <img src="${product.imageUrl}" alt="${product.name}">
                                <div>
                                    <h4>${product.name}</h4>
                                    <p>${product.price} ${localStorage.getItem('siteCurr') || 'LKR'}</p>
                                </div>
                            `;
                            searchResultsDiv.appendChild(resultItem);
                        });
                        searchResultsDiv.classList.add('active');
                    } else {
                        searchResultsDiv.innerHTML = '<p>No products found.</p>';
                        searchResultsDiv.classList.add('active');
                    }
                } else {
                    searchResultsDiv.classList.remove('active');
                }
            });

            // Close search results when clicking outside
            document.addEventListener('click', (event) => {
                if (!searchInput.contains(event.target) && !searchResultsDiv.contains(event.target)) {
                    searchResultsDiv.classList.remove('active');
                }
            });
        }
    }


    // Firebase Auth State Listener
    onAuthStateChanged(auth, (user) => {
        const accountText = document.getElementById('account-text');
        const authLinks = document.getElementById('auth-links');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminLink = document.getElementById('adminLink'); // Get the admin link element

        if (user) {
            accountText.textContent = user.displayName || user.email;
            if (authLinks) authLinks.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';

            // Check if user is admin (example: by UIDs or custom claims)
            // This is a basic client-side check, proper authorization must be server-side
            // IMPORTANT: Replace 'YOUR_ADMIN_UID_1' and 'YOUR_ADMIN_UID_2' with actual admin UIDs
            if (user.uid === 'YOUR_ADMIN_UID_1' || user.uid === 'YOUR_ADMIN_UID_2') {
                if (adminLink) adminLink.style.display = 'block';
            } else {
                if (adminLink) adminLink.style.display = 'none';
            }
        } else {
            accountText.textContent = 'Sign In';
            if (authLinks) authLinks.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none'; // Hide admin link if not logged in
        }
    });

    // Logout Functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log('User signed out');
                // Redirect to homepage or login page
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Logout error:', error);
            });
        });
    }

    // Shopping Cart Functionality
    let cart = JSON.parse(localStorage.getItem('cart')) || {};

    const updateCartDisplay = () => {
        const cartCount = document.getElementById('cartCount');
        const miniCartItems = document.getElementById('miniCartItems');
        const miniCartTotal = document.getElementById('miniCartTotal');
        let totalItems = 0;
        let totalPrice = 0;

        if (miniCartItems) {
            miniCartItems.innerHTML = ''; // Clear existing items

            for (const productId in cart) {
                const item = cart[productId];
                totalItems += item.quantity;
                totalPrice += item.quantity * item.price;

                const cartItemDiv = document.createElement('div');
                cartItemDiv.className = 'mini-cart-item';
                cartItemDiv.innerHTML = `
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${item.quantity * item.price} ${localStorage.getItem('siteCurr') || 'LKR'}</span>
                `;
                miniCartItems.appendChild(cartItemDiv);
            }

            if (Object.keys(cart).length === 0) {
                miniCartItems.innerHTML = '<p>Your cart is empty.</p>';
            }

            if (miniCartTotal) {
                miniCartTotal.innerHTML = `Total: <span>${totalPrice} ${localStorage.getItem('siteCurr') || 'LKR'}</span>`;
            }
        }

        if (cartCount) {
            cartCount.textContent = totalItems;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    const addToCart = (productId, name, price) => {
        if (cart[productId]) {
            cart[productId].quantity++;
        } else {
            cart[productId] = { productId, name, price, quantity: 1 };
        }
        updateCartDisplay();
        console.log(`Added ${name} to cart.`);
        // Replaced alert with a more user-friendly message or modal if preferred
        // alert(`${name} added to cart!`);
        showNotification(`${name} added to cart!`);
    };

    // Simple notification function (can be expanded into a custom modal)
    function showNotification(message) {
        const notificationDiv = document.createElement('div');
        notificationDiv.textContent = message;
        notificationDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--primary);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;
        document.body.appendChild(notificationDiv);

        setTimeout(() => {
            notificationDiv.style.opacity = 1;
        }, 10); // Small delay to trigger transition

        setTimeout(() => {
            notificationDiv.style.opacity = 0;
            notificationDiv.addEventListener('transitionend', () => notificationDiv.remove());
        }, 3000); // Hide after 3 seconds
    }


    // Render products on homepage and product page
    const productGrid = document.getElementById('productGrid');
    const productDetailsContainer = document.getElementById('product-details-container');

    const fetchAndRenderProducts = async () => {
        try {
            const response = await fetch('/.netlify/functions/get-products');
            const data = await response.json();
            if (!response.ok || !data.success) {
                // Log the full response for debugging
                console.error('API Response for products:', data);
                throw new Error(data.message || 'Failed to fetch products');
            }
            products = data.products; // Store fetched products globally

            if (productGrid) {
                productGrid.innerHTML = products.map(product => `
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.name.en}" class="product-image">
                        <div class="product-info">
                            <h3 class="product-name">${product.name.en}</h3>
                            <p class="product-price">${product.price[localStorage.getItem('siteCurr') || 'LKR']} ${localStorage.getItem('siteCurr') || 'LKR'}</p>
                            <div class="product-actions">
                                <button class="btn-primary add-to-cart-btn" data-id="${product.id}" data-name="${product.name.en}" data-price="${product.price[localStorage.getItem('siteCurr') || 'LKR']}">Add to Cart</button>
                                <a href="product-details.html?id=${product.id}" class="btn-secondary">View Details</a>
                            </div>
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const { id, name, price } = event.target.dataset;
                        addToCart(id, name, parseFloat(price));
                    });
                });
            } else if (productDetailsContainer) {
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('id');
                const product = products.find(p => p.id === productId);

                if (product) {
                    renderProductDetails(product);
                    fetchAndRenderReviews(productId);
                    setupReviewForm(productId);
                } else {
                    productDetailsContainer.innerHTML = '<p>Product not found.</p>';
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            if (productGrid) {
                productGrid.innerHTML = '<p style="color: red;">Failed to load products. Please try again later.</p>';
            } else if (productDetailsContainer) {
                productDetailsContainer.innerHTML = '<p style="color: red;">Failed to load product details.</p>';
            }
        }
    };

    fetchAndRenderProducts();
    updateCartDisplay(); // Initialize cart display on page load

    const renderProductDetails = (product) => {
        if (!productDetailsContainer) return;

        productDetailsContainer.innerHTML = `
            <div class="product-details-image">
                <img src="${product.image}" alt="${product.name.en}">
            </div>
            <div class="product-details-info">
                <h1>${product.name.en}</h1>
                <p class="product-details-price">${product.price[localStorage.getItem('siteCurr') || 'LKR']} ${localStorage.getItem('siteCurr') || 'LKR'}</p>
                <p>${product.desc.en}</p>
                <button class="btn-primary add-to-cart-btn" data-id="${product.id}" data-name="${product.name.en}" data-price="${product.price[localStorage.getItem('siteCurr') || 'LKR']}">Add to Cart</button>
            </div>
        `;
        document.querySelector('.product-details-info .add-to-cart-btn').addEventListener('click', (event) => {
            const { id, name, price } = event.target.dataset;
            addToCart(id, name, parseFloat(price));
        });
    };

    const starRatingContainer = document.getElementById("star-rating");
    if (starRatingContainer) {
        starRatingContainer.innerHTML = Array(5).fill(null).map((_, i) => `<i class="far fa-star" data-value="${i + 1}"></i>`).join('');
        starRatingContainer.querySelectorAll('.fa-star').forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = e.target.dataset.value;
                document.getElementById('rating-input').value = rating;
                starRatingContainer.querySelectorAll('.fa-star').forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
        });
    }


    const fetchAndRenderReviews = async (productId) => {
        const reviewsList = document.getElementById('reviews-list');
        try {
            const response = await fetch(`/.netlify/functions/get-reviews?productId=${productId}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message);
            }

            if (data.reviews.length === 0) {
                reviewsList.innerHTML = '<p>Be the first to review this product!</p>';
                return;
            }

            reviewsList.innerHTML = data.reviews.map(review => {
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                return `
                    <div class="review-card">
                        <div class="star-rating">${stars}</div>
                        <p><strong>${review.authorName}</strong></p>
                        <p>${review.reviewText}</p>
                    </div>
                `;
            }).join('');
        } catch (error) {
            reviewsList.innerHTML = `<p style="color: red;">Could not load reviews.</p>`;
            console.error('Error fetching reviews:', error);
        }
    };

    const setupReviewForm = (productId) => {
        const reviewForm = document.getElementById('review-form');
        const ratingInputStars = document.getElementById('rating-input'); // This is the hidden input for the rating value
        const formMessage = document.getElementById('form-message');

        if (reviewForm && ratingInputStars) {
            // Setup star rating display for the form
            const reviewStarsContainer = document.createElement('div');
            reviewStarsContainer.className = 'star-rating-input';
            reviewStarsContainer.innerHTML = [5, 4, 3, 2, 1].map(value => `
                <input type="radio" id="star${value}-form" name="rating" value="${value}" required>
                <label for="star${value}-form" data-value="${value}">★</label>
            `).join('');
            ratingInputStars.parentNode.insertBefore(reviewStarsContainer, ratingInputStars.nextSibling); // Insert after the hidden input

            reviewStarsContainer.querySelectorAll('label').forEach(label => {
                label.addEventListener('click', (e) => {
                    const rating = parseInt(e.target.dataset.value);
                    reviewStarsContainer.querySelectorAll('label').forEach((s, index) => {
                        if (parseInt(s.dataset.value) <= rating) {
                            s.style.color = 'var(--star-color)';
                        } else {
                            s.style.color = 'var(--star-color-inactive)';
                        }
                    });
                });
            });


            reviewForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                formMessage.textContent = 'Submitting...';
                formMessage.style.color = 'blue';

                const formData = new FormData(reviewForm);
                const reviewData = {
                    productId: productId,
                    authorName: formData.get('authorName'),
                    reviewText: formData.get('reviewText'),
                    rating: parseInt(formData.get('rating'))
                };

                try {
                    const response = await fetch('/.netlify/functions/submit-review', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(reviewData)
                    });
                    const result = await response.json();

                    if (response.ok && result.success) {
                        formMessage.textContent = 'Review submitted successfully! It will appear after moderation.';
                        formMessage.style.color = 'green';
                        reviewForm.reset();
                        fetchAndRenderReviews(productId); // Refresh reviews
                    } else {
                        throw new Error(result.message || 'Failed to submit review');
                    }
                } catch (error) {
                    formMessage.textContent = `Error: ${error.message}`;
                    formMessage.style.color = 'red';
                    console.error('Error submitting review:', error);
                }
            });
        }
    };

    // NEW FUNCTION: Smooth Scrolling for Navigation Links
    function setupSmoothScrolling() {
        // Selects links that point to an ID on the current page or specifically to #products/#contact on index.html
        document.querySelectorAll('a[href^="#"], a[href*="index.html#products"], a[href*="index.html#contact"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                // Extract the hash part (e.g., "products" from "#products" or "index.html#products")
                const targetId = href.split('#')[1];
                const targetElement = document.getElementById(targetId);

                // Check if the link is an internal anchor link
                const isInternalAnchor = href.startsWith('#') || (href.includes('index.html#') && (window.location.pathname === '/index.html' || window.location.pathname === '/'));

                if (targetElement && isInternalAnchor) {
                    e.preventDefault(); // Prevent default jump behavior
                    targetElement.scrollIntoView({
                        behavior: 'smooth' // Enable smooth scrolling
                    });

                    // Optionally update URL hash without jumping
                    // This creates a cleaner URL and allows direct linking to sections
                    history.pushState(null, null, href);
                }
            });
        });
    }

}); // DOMContentLoaded end
