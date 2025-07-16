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

    // --- GLOBAL APP STATE & UTILS ---
    let products = [];
    let currentCurr = localStorage.getItem('digiworld_curr') || 'USD';
    const currencySymbols = { USD: '$', LKR: 'Rs' };
    let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
    let wishlist = JSON.parse(localStorage.getItem('digiworldWishlist')) || [];

    // --- Central Function to Fetch Data and Initialize the App ---
    const fetchAndInitializeApp = async () => {
        try {
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            products = await response.json();
            
            if (document.getElementById('productGrid')) renderProductGrid();
            if (document.getElementById('product-details-page')) renderProductDetailsPage();

        } catch (error) {
            console.error("Could not load product data:", error);
            const mainContent = document.querySelector('main');
            if(mainContent) mainContent.innerHTML = `<p style="text-align:center; color:red; padding: 40px;">Error: Could not load products. Please try again later.</p>`;
        }
    };
    
    // --- COMPONENT LOADER ---
    const loadComponent = (selector, url, callback) => {
        fetch(url)
            .then(response => response.ok ? response.text() : Promise.reject('File not found'))
            .then(data => {
                const element = document.querySelector(selector);
                if(element) element.innerHTML = data;
                if(callback) callback();
            })
            .catch(error => console.error(`Failed to load ${url}:`, error));
    };
    
    // --- APP START SEQUENCE ---
    loadComponent('#header-placeholder', 'header.html', () => {
        loadComponent('#footer-placeholder', 'footer.html', () => {
            initializeSharedComponents();
            fetchAndInitializeApp();
        });
    });


    // --- SHARED INITIALIZATION ---
    const initializeSharedComponents = () => {
        initializeAuth();
        initializeScrollHeader();
        setupDropdown('currencyDropdown', (newCurr) => {
            currentCurr = newCurr;
            localStorage.setItem('digiworld_curr', newCurr);
            document.dispatchEvent(new Event('currencyChanged'));
        });
        const cartBtn = document.getElementById('cartBtn');
        const mobileCartBtn = document.getElementById('mobileCartBtn');
        if (cartBtn) cartBtn.addEventListener('click', openMiniCart);
        if (mobileCartBtn) mobileCartBtn.addEventListener('click', openMiniCart);
        
        const miniCartClose = document.getElementById('miniCartClose');
        const miniCartOverlay = document.getElementById('miniCartOverlay');
        if (miniCartClose) miniCartClose.addEventListener('click', closeMiniCart);
        if (miniCartOverlay) miniCartOverlay.addEventListener('click', (e) => {
            if (e.target === miniCartOverlay) closeMiniCart();
        });

        const searchInput = document.getElementById('searchInput');
        if(searchInput) searchInput.addEventListener('input', handleSearch);

        updateUICurrency();
        updateCartBadge();
    };
    
    // --- 1. HIDING HEADER ON SCROLL (FIXED) ---
    const initializeScrollHeader = () => {
        const header = document.querySelector('.site-header');
        if (!header) return;
        let lastScrollY = window.scrollY;
        let isTicking = false;
        const updateHeaderVisibility = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < lastScrollY || currentScrollY < 100) {
                header.classList.remove('header--hidden');
            } else if (currentScrollY > lastScrollY && currentScrollY > 150) {
                header.classList.add('header--hidden');
            }
            lastScrollY = currentScrollY;
            isTicking = false;
        };
        window.addEventListener('scroll', () => {
            if (!isTicking) {
                window.requestAnimationFrame(updateHeaderVisibility);
                isTicking = true;
            }
        });
    };

    // --- PAGE-SPECIFIC RENDER FUNCTIONS ---
    const renderProductGrid = () => {
        const grid = document.getElementById('productGrid');
        if(!grid) return;
        const currentCurr = localStorage.getItem('digiworld_curr') || 'USD';
        
        grid.innerHTML = products.map((prod) => {
            const price = prod.price[currentCurr] || prod.price.USD;
            return `
                <div class="product-card" data-product-id="${prod.id}">
                  ${prod.isHot ? '<div class="badge-hot shine-effect">Hot</div>' : ''}
                  <a href="product-details.html?id=${prod.id}" class="card-image-container">
                    <img class="card-image" src="${prod.image}" alt="${prod.name.en}" loading="lazy"/>
                  </a>
                  <div class="card-content-wrapper">
                      <div class="tag-delivery shine-effect">${prod.delivery.en}</div>
                      <h3 class="product-name">${prod.name.en}</h3>
                      <p class="product-price">${currencySymbols[currentCurr] || '$'}${price.toFixed(2)}</p>
                      <div class="card-buttons">
                          <button class="card-btn add-to-cart shine-effect" data-id="${prod.id}">Add to Cart</button>
                          <a href="checkout.html?id=${prod.id}" class="card-btn buy-now shine-effect">Buy Now</a>
                      </div>
                  </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.product-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.07}s`;
        });
    };

    const renderProductDetailsPage = () => {
        const pageContainer = document.getElementById('product-details-page');
        if(!pageContainer) return;
        
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        const product = products.find(p => p.id === productId);
        const currentCurr = localStorage.getItem('digiworld_curr') || 'USD';

        if (!product) {
            pageContainer.innerHTML = '<div id="errorState">Product not found.</div>';
            return;
        }

        const price = product.price[currentCurr] || product.price.USD;
        document.title = `DigiWorld - ${product.name.en}`;
        const isWishlisted = wishlist.includes(productId);
        
        pageContainer.innerHTML = `
            <div class="product-details-container">
                <a href="index.html" class="back-link"><i class="fas fa-chevron-left"></i> Back to Products</a>
                <div class="product-details-grid">
                    <div class="product-image-container"><img src="${product.image}" alt="${product.name.en}"></div>
                    <div class="product-info">
                        <div class="product-title-wrapper">
                            <h1 class="product-title">${product.name.en}</h1>
                            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${productId}" aria-label="Add to wishlist">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                        <p class="product-delivery shine-effect"><i class="fas fa-check-circle"></i> ${product.delivery.en}</p>
                        <p class="product-price">${currencySymbols[currentCurr] || '$'}${price.toFixed(2)}</p>
                        <div class="product-description">${product.desc.en}</div>
                        <div class="product-actions">
                            <button class="action-button add-to-cart shine-effect" data-id="${product.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
                            <a href="checkout.html?id=${product.id}" class="action-button buy-now shine-effect"><i class="fas fa-bolt"></i> Buy Now</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="product-info-tabs">
                <div class="tab-buttons"><button class="tab-button active" data-tab="features">Key Features</button><button class="tab-button" data-tab="requirements">Requirements</button><button class="tab-button" data-tab="activation">Activation</button></div>
                <div id="features" class="tab-content active"></div>
                <div id="requirements" class="tab-content"></div>
                <div id="activation" class="tab-content"></div>
            </div>
            <div class="reviews-container">
                <h2 class="section-title">Customer Reviews</h2>
                <div id="reviews-list"><p>Loading reviews...</p></div>
                <div id="review-form-section">
                    <h3 class="section-title" style="font-size: 1.5rem; margin-top: 40px;">Leave a Review</h3>
                    <form id="review-form">
                        <div class="form-group"><label for="authorName">Your Name</label><input type="text" id="authorName" required></div>
                        <div class="form-group"><label for="reviewText">Your Review</label><textarea id="reviewText" required></textarea></div>
                        <button type="submit" class="card-btn buy-now">Submit Review</button>
                        <div id="form-message"></div>
                    </form>
                </div>
            </div>
        `;
        
        renderInfoTabs(product);
        setupTabs();
        fetchAndRenderReviews(productId);
        setupReviewForm(productId);
    };

    // --- SHARED FUNCTIONS ---
    document.addEventListener('currencyChanged', () => {
        if (document.getElementById('productGrid')) renderProductGrid();
        if (document.getElementById('product-details-page')) renderProductDetailsPage();
        updateMiniCartContent();
    });
    
    const initializeAuth = () => {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const accountDropdown = document.getElementById('accountDropdown');
        const accountBtn = document.getElementById('accountBtn');
        const accountMenu = document.getElementById('accountMenu');

        onAuthStateChanged(auth, user => {
            if (user) {
                loginBtn.style.display = 'none';
                signupBtn.style.display = 'none';
                accountDropdown.style.display = 'inline-flex';
                accountMenu.innerHTML = `<a href="profile.html">Profile</a><a href="orders.html">My Orders</a><button id="logoutBtn">Logout</button>`;
                document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));
            } else {
                loginBtn.style.display = 'inline-flex';
                signupBtn.style.display = 'inline-flex';
                accountDropdown.style.display = 'none';
            }
        });

        if (accountBtn) {
            accountBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                accountMenu.classList.toggle('show');
            });
        }
    };
    
    const setupDropdown=(e,t)=>{const n=document.getElementById(e);if(!n)return;const o=n.querySelector(".dropdown-toggle"),a=n.querySelector(".dropdown-menu");a&&o&&(a.innerHTML=Object.keys(currencySymbols).map(e=>`<div class="dropdown-item" data-value="${e}">${currencySymbols[e]} ${e}</div>`).join(""),o.addEventListener("click",e=>{e.stopPropagation(),n.classList.toggle("open")}),a.addEventListener("click",e=>{e.target.matches(".dropdown-item")&&(t(e.target.dataset.value),n.classList.remove("open"))}))};const updateUICurrency=()=>{const e=document.getElementById("currentCurrLabel"),t=document.getElementById("currentCurrSymbol");e&&(e.textContent=currentCurr),t&&(t.textContent=currencySymbols[currentCurr]||"$")};const updateCartBadge=()=>{const e=Object.keys(cart).length,t=document.getElementById("cartCount");t&&(t.textContent=e)};const saveCart=()=>{localStorage.setItem("digiworldCart",JSON.stringify(cart)),updateCartBadge()};const openMiniCart=()=>{updateMiniCartContent(),document.getElementById("miniCartOverlay")?.classList.add("active")};const closeMiniCart=()=>{document.getElementById("miniCartOverlay")?.classList.remove("active")};const updateMiniCartContent=()=>{const e=document.getElementById("miniCartItems"),t=document.getElementById("miniCartTotal");if(!e||!t)return;let n=0;const o=currencySymbols[currentCurr]||"$";if(0===Object.keys(cart).length)return e.innerHTML='<p style="padding: 20px; text-align: center;">Your cart is empty.</p>',void(t.innerHTML=`<span>Total:</span> <span>${o}0.00</span>`);e.innerHTML=Object.entries(cart).map(([e,t])=>{const a=products.find(t=>t.id===e);if(!a)return"";const r=a.price[currentCurr]||a.price.USD;return n+=r*t,`\n                <div class="mini-cart-item" data-id="${e}">\n                    <img src="${a.image}" class="mini-cart-item-img" alt="${a.name.en}">\n                    <div class="mini-cart-item-details">\n                        <div class="mini-cart-item-title">${a.name.en}</div>\n                        <div class="mini-cart-item-price">${t} x ${o}${r.toFixed(2)}</div>\n                    </div>\n                    <span class="mini-cart-item-remove" data-id="${e}">&times;</span>\n                </div>\n            `}).join(""),t.innerHTML=`<span>Total:</span> <span>${o}${n.toFixed(2)}</span>`};
    
    // --- 8 & 9. WISHLIST & ADD TO CART UX ---
    document.addEventListener('click', e => {
        // Add to Cart Logic
        if (e.target.matches('.add-to-cart') && !e.target.classList.contains('added')) {
            const button = e.target;
            const prodId = button.dataset.id;
            if (prodId) {
                cart[prodId] = (cart[prodId] || 0) + 1;
                saveCart();
                animateImageToCart(button);
                // Change button state
                button.innerHTML = 'Added!';
                button.classList.add('added');
                setTimeout(() => {
                    button.innerHTML = 'Add to Cart';
                    button.classList.remove('added');
                }, 2000);
            }
        }
        // Remove from Mini-Cart Logic
        if (e.target.matches('.mini-cart-item-remove')) {
            const itemId = e.target.dataset.id;
            delete cart[itemId];
            saveCart();
            updateMiniCartContent();
        }
        // Wishlist Logic
        if (e.target.closest('.wishlist-btn')) {
            const button = e.target.closest('.wishlist-btn');
            const prodId = button.dataset.id;
            button.classList.toggle('active');
            if (wishlist.includes(prodId)) {
                wishlist = wishlist.filter(id => id !== prodId);
            } else {
                wishlist.push(prodId);
            }
            localStorage.setItem('digiworldWishlist', JSON.stringify(wishlist));
        }
        // Global click to close dropdowns
        if (!e.target.closest('.dropdown, .account-dropdown')) {
            document.querySelectorAll('.dropdown.open, .account-menu.show').forEach(el => el.classList.remove('open', 'show'));
        }
    });

    const animateImageToCart=e=>{const t=document.getElementById("cartBtn"),n=e.closest(".product-card")||e.closest(".product-details-grid");if(!n||!t)return;const o=n.querySelector("img");if(!o)return;const a=o.getBoundingClientRect(),r=t.getBoundingClientRect(),c=o.cloneNode(!0);c.classList.add("flying-image"),Object.assign(c.style,{left:`${a.left}px`,top:`${a.top}px`,width:`${a.width}px`,height:`${a.height}px`}),document.body.appendChild(c),requestAnimationFrame(()=>{Object.assign(c.style,{left:`${r.left+r.width/2}px`,top:`${r.top+r.height/2}px`,width:"20px",height:"20px",transform:"scale(0.1)",opacity:"0"})}),c.addEventListener("transitionend",()=>{c.remove(),t.classList.add("animated"),setTimeout(()=>t.classList.remove("animated"),430)})};const handleSearch=()=>{const e=document.getElementById("searchInput"),t=document.getElementById("searchSuggestions");if(!e||!t)return;const n=e.value.trim().toLowerCase();if(n.length<2)return void(t.style.display="none");const o=products.filter(e=>e.name.en.toLowerCase().includes(n));o.length>0?(t.innerHTML=o.map(e=>`<div class="suggestion-item" onclick="window.location.href='product-details.html?id=${e.id}'">${e.name.en}</div>`).join(""),t.style.display="block"):t.style.display="none"};const renderInfoTabs=e=>{const t=e.features.en||[],n=e.requirements.en||[],o=e.activation.en||[];document.getElementById("features").innerHTML=`<ul>${t.map(e=>`<li>${e}</li>`).join("")}</ul>`,document.getElementById("requirements").innerHTML=`<ul>${n.map(e=>`<li>${e}</li>`).join("")}</ul>`,document.getElementById("activation").innerHTML=`<ul>${o.map(e=>`<li>${e}</li>`).join("")}</ul>`};const setupTabs=()=>{document.querySelectorAll(".tab-button").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.tab;document.querySelectorAll(".tab-button").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".tab-content").forEach(e=>e.classList.remove("active")),e.classList.add("active"),document.getElementById(t).classList.add("active")})})};const fetchAndRenderReviews=async e=>{const t=document.getElementById("reviews-list");try{const n=await fetch(`/.netlify/functions/get-reviews?productId=${e}`),o=await n.json();if(!n.ok||!o.success)throw new Error(o.message);if(0===o.reviews.length)return void(t.innerHTML="<p>Be the first to review this product!</p>");t.innerHTML=o.reviews.map(e=>{const t="★".repeat(e.rating)+"☆".repeat(5-e.rating);return`<div class="review-card"><div class="star-rating">${t}</div><p><strong>${e.authorName}</strong></p><p>${e.reviewText}</p></div>`}).join("")}catch(n){t.innerHTML='<p style="color: red;">Could not load reviews.</p>'}};const setupReviewForm=e=>{const t=document.getElementById("review-form"),n=document.getElementById("form-message");t.addEventListener("submit",async o=>{o.preventDefault(),n.textContent="Submitting...";const a={productId:e,authorName:document.getElementById("authorName").value,reviewText:document.getElementById("reviewText").value,rating:5};try{const e=await fetch("/.netlify/functions/submit-review",{method:"POST",body:JSON.stringify(a)}),o=await e.json();if(!e.ok)throw new Error(o.message);n.textContent="Review submitted for approval!",t.reset()}catch(e){n.textContent=`Error: ${e.message}`}})};

});
