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
        'SI': { name: 'Sinhala', flag: '🇱🇰' },
        'RU': { name: 'Russian', flag: '🇷🇺' },
        'CN': { name: 'Chinese', flag: '🇨🇳' },
        'ES': { name: 'Spanish', flag: '🇪🇸' },
        'IT': { name: 'Italian', flag: '🇮🇹' },
        'DE': { name: 'German', flag: '🇩🇪' }
    };
    const currencies = {
        'USD': { name: 'US Dollar', symbol: '$' },
        'LKR': { name: 'Sri Lankan Rupee', symbol: 'Rs' },
        'RUB': { name: 'Russian Ruble', symbol: '₽' },
        'CNY': { name: 'Chinese Yuan', symbol: '¥' },
        'EUR': { name: 'Euro', symbol: '€' },
        'GBP': { name: 'British Pound', symbol: '£' }
    };
    let currentLang = localStorage.getItem('digiworld_lang') || 'EN';
    let currentCurr = localStorage.getItem('digiworld_curr') || 'LKR';
    let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
    let wishlist = JSON.parse(localStorage.getItem('digiworldWishlist')) || [];

    // --- APP INITIALIZATION ---
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
    
    loadComponent('#header-placeholder', 'header.html', () => {
        loadComponent('#footer-placeholder', 'footer.html', () => {
            initializeSharedComponents();
            fetchAndInitializeApp();
        });
    });

    const initializeSharedComponents = () => {
        initializeAuth();
        initializeScrollHeader();
        initializeLangCurrSwitcher();
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
        updateCartBadge();
    };
    
    // --- 5. HIDING HEADER WITH BOUNCE (RE-ENGINEERED) ---
    const initializeScrollHeader = () => {
        const header = document.querySelector('.site-header');
        if (!header) return;

        let lastScrollY = window.scrollY;
        let scrollTimeout = null;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            // Hide header if scrolling down
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
                header.classList.add('header--hidden');
            } 
            // Show header if scrolling up
            else if (currentScrollY < lastScrollY) {
                header.classList.remove('header--hidden');
            }

            lastScrollY = currentScrollY;

            // Clear previous timeout to detect when scrolling stops
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }

            // Set a new timeout. If it runs, it means scrolling has paused.
            scrollTimeout = setTimeout(() => {
                // Show the header when scrolling stops, unless we're at the very top of the page.
                if (window.scrollY > 0) {
                    header.classList.remove('header--hidden');
                }
            }, 250); // A 250ms pause in scrolling will trigger this
        });
    };

    // 6. LANGUAGE/CURRENCY SWITCHER
    const initializeLangCurrSwitcher = () => {
        const langSelect = document.getElementById('lang-select');
        const currSelect = document.getElementById('curr-select');
        const saveBtn = document.getElementById('lang-curr-save-btn');

        if (!langSelect || !currSelect || !saveBtn) return;

        langSelect.innerHTML = Object.entries(languages).map(([code, {name}]) => `<option value="${code}" ${code === currentLang ? 'selected' : ''}>${name}</option>`).join('');
        currSelect.innerHTML = Object.entries(currencies).map(([code, {name, symbol}]) => `<option value="${code}" ${code === currentCurr ? 'selected' : ''}>${code} (${name})</option>`).join('');

        const updateDisplay = () => {
            document.getElementById('current-flag').textContent = languages[currentLang].flag;
            document.getElementById('current-lang').textContent = currentLang;
            document.getElementById('current-curr').textContent = currentCurr;
            document.dispatchEvent(new Event('settingsChanged'));
        };

        saveBtn.addEventListener('click', () => {
            currentLang = langSelect.value;
            currentCurr = currSelect.value;
            localStorage.setItem('digiworld_lang', currentLang);
            localStorage.setItem('digiworld_curr', currentCurr);
            updateDisplay();
            const dropdown = document.querySelector('.lang-curr-dropdown');
            if (dropdown) dropdown.style.display = 'none';
            setTimeout(() => { if(dropdown) dropdown.style.display = ''; }, 100);
        });
        
        updateDisplay();
    };

    // --- PAGE-SPECIFIC RENDER FUNCTIONS ---
    const renderProductGrid = () => {
        const grid = document.getElementById('productGrid');
        if(!grid) return;
        
        grid.innerHTML = products.map((prod) => {
            const price = prod.price[currentCurr] || prod.price.USD;
            return `
                <div class="product-card" data-product-id="${prod.id}">
                  ${prod.isHot ? '<div class="badge-hot">Hot</div>' : ''}
                  <a href="product-details.html?id=${prod.id}" class="card-image-container">
                    <img class="card-image" src="${prod.image}" alt="${prod.name.en}" loading="lazy"/>
                  </a>
                  <div class="card-content-wrapper">
                      <div class="tag-delivery">${prod.delivery.en}</div>
                      <h3 class="product-name">${prod.name.en}</h3>
                      <p class="product-price">${currencies[currentCurr].symbol}${price.toFixed(2)}</p>
                      <div class="card-buttons">
                          <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
                          <a href="checkout.html?id=${prod.id}" class="card-btn buy-now">Buy Now</a>
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
                            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${productId}" aria-label="Add to wishlist"><i class="fas fa-heart"></i></button>
                        </div>
                        <p class="product-delivery"><i class="fas fa-check-circle"></i> ${product.delivery.en}</p>
                        <p class="product-price">${currencies[currentCurr].symbol}${price.toFixed(2)}</p>
                        <div class="product-description">${product.desc.en}</div>
                        <div class="product-actions">
                            <button class="action-button add-to-cart" data-id="${product.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
                            <a href="checkout.html?id=${product.id}" class="action-button buy-now"><i class="fas fa-bolt"></i> Buy Now</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="product-info-tabs">
                <div class="tab-buttons"><button class="tab-button active" data-tab="features">Key Features</button><button class="tab-button" data-tab="requirements">Requirements</button><button class="tab-button" data-tab="activation">Activation</button></div>
                <div id="features" class="tab-content active"></div><div id="requirements" class="tab-content"></div><div id="activation" class="tab-content"></div>
            </div>
            <div class="reviews-container">
                <h2 class="section-title">Customer Reviews</h2>
                <div id="reviews-list"><p>Loading reviews...</p></div>
                <div id="review-form-section">
                    <h3 class="section-title" style="font-size: 1.5rem; margin-top: 40px;">Leave a Review</h3>
                    <form id="review-form">
                        <div class="form-group"><label for="authorName">Your Name</label><input type="text" id="authorName" required></div>
                        <div class="form-group"><label>Your Rating</label><div class="rating-input" id="rating-input"></div></div>
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
    document.addEventListener('settingsChanged', () => {
        if (document.getElementById('productGrid')) renderProductGrid();
        if (document.getElementById('product-details-page')) renderProductDetailsPage();
        updateMiniCartContent();
    });
    
    const initializeAuth = () => {
        const accountBtn = document.getElementById('accountBtn');
        const accountText = document.getElementById('account-text');
        const accountMenu = document.getElementById('accountMenu');
        onAuthStateChanged(auth, user => {
            if (user) {
                accountText.textContent = user.displayName || 'Account';
                accountMenu.innerHTML = `<a href="profile.html">Profile</a><a href="orders.html">My Orders</a><button id="logoutBtn">Logout</button>`;
                document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));
            } else {
                accountText.textContent = 'Sign In';
                accountMenu.innerHTML = `<a href="login.html">Login</a><a href="signup.html">Register</a>`;
            }
        });
    };
    
    const updateCartBadge=()=>{const e=Object.values(cart).reduce((e,t)=>e+t,0),t=document.getElementById("cartCount");t&&(t.textContent=e)};const saveCart=()=>{localStorage.setItem("digiworldCart",JSON.stringify(cart)),updateCartBadge()};const openMiniCart=()=>{updateMiniCartContent(),document.getElementById("miniCartOverlay")?.classList.add("active")};const closeMiniCart=()=>{document.getElementById("miniCartOverlay")?.classList.remove("active")};const updateMiniCartContent=()=>{const e=document.getElementById("miniCartItems"),t=document.getElementById("miniCartTotal");if(!e||!t)return;let n=0;const o=currencies[currentCurr].symbol;if(0===Object.keys(cart).length)return e.innerHTML='<p style="padding: 20px; text-align: center;">Your cart is empty.</p>',void(t.innerHTML=`<span>Total:</span> <span>${o}0.00</span>`);e.innerHTML=Object.entries(cart).map(([e,t])=>{const a=products.find(t=>t.id===e);if(!a)return"";const c=a.price[currentCurr]||a.price.USD;return n+=c*t,`\n                <div class="mini-cart-item" data-id="${e}">\n                    <img src="${a.image}" class="mini-cart-item-img" alt="${a.name.en}">\n                    <div class="mini-cart-item-details">\n                        <div class="mini-cart-item-title">${a.name.en}</div>\n                        <div class="mini-cart-item-price">${t} x ${o}${c.toFixed(2)}</div>\n                    </div>\n                    <span class="mini-cart-item-remove" data-id="${e}">&times;</span>\n                </div>\n            `}).join(""),t.innerHTML=`<span>Total:</span> <span>${o}${n.toFixed(2)}</span>`};
    
    document.addEventListener('click', e => {
        if (e.target.matches('.add-to-cart') && !e.target.classList.contains('added')) {
            const button = e.target;
            const prodId = button.dataset.id;
            if (prodId) {
                cart[prodId] = (cart[prodId] || 0) + 1;
                saveCart();
                animateImageToCart(button);
                button.innerHTML = 'Added!';
                button.classList.add('added');
                setTimeout(() => {
                    button.innerHTML = button.classList.contains('action-button') ? '<i class="fas fa-shopping-cart"></i> Add to Cart' : 'Add to Cart';
                    button.classList.remove('added');
                }, 2000);
            }
        }
        if (e.target.matches('.mini-cart-item-remove')) {
            const itemId = e.target.dataset.id;
            delete cart[itemId];
            saveCart();
            updateMiniCartContent();
        }
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
    });

    const animateImageToCart=e=>{const t=document.getElementById("cartBtn"),n=e.closest(".product-card")||e.closest(".product-details-grid");if(!n||!t)return;const o=n.querySelector("img");if(!o)return;const a=o.getBoundingClientRect(),c=t.getBoundingClientRect(),r=o.cloneNode(!0);r.classList.add("flying-image"),Object.assign(r.style,{left:`${a.left}px`,top:`${a.top}px`,width:`${a.width}px`,height:`${a.height}px`}),document.body.appendChild(r),requestAnimationFrame(()=>{Object.assign(r.style,{left:`${c.left+c.width/2}px`,top:`${c.top+c.height/2}px`,width:"20px",height:"20px",transform:"scale(0.1)",opacity:"0"})}),r.addEventListener("transitionend",()=>{r.remove(),t.classList.add("animated"),setTimeout(()=>t.classList.remove("animated"),430)})};const handleSearch=()=>{const e=document.getElementById("searchInput"),t=document.getElementById("searchSuggestions");if(!e||!t)return;const n=e.value.trim().toLowerCase();if(n.length<2)return void(t.style.display="none");const o=products.filter(e=>e.name.en.toLowerCase().includes(n));o.length>0?(t.innerHTML=o.map(e=>`<div class="suggestion-item" onclick="window.location.href='product-details.html?id=${e.id}'">${e.name.en}</div>`).join(""),t.style.display="block"):t.style.display="none"};const renderInfoTabs=e=>{const t=e.features.en||[],n=e.requirements.en||[],o=e.activation.en||[];document.getElementById("features").innerHTML=`<ul>${t.map(e=>`<li>${e}</li>`).join("")}</ul>`,document.getElementById("requirements").innerHTML=`<ul>${n.map(e=>`<li>${e}</li>`).join("")}</ul>`,document.getElementById("activation").innerHTML=`<ul>${o.map(e=>`<li>${e}</li>`).join("")}</ul>`};const setupTabs=()=>{document.querySelectorAll(".tab-button").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.tab;document.querySelectorAll(".tab-button").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".tab-content").forEach(e=>e.classList.remove("active")),e.classList.add("active"),document.getElementById(t).classList.add("active")})})};const fetchAndRenderReviews=async e=>{const t=document.getElementById("reviews-list");try{const n=await fetch(`/.netlify/functions/get-reviews?productId=${e}`),o=await n.json();if(!n.ok||!o.success)throw new Error(o.message);if(0===o.reviews.length)return void(t.innerHTML="<p>Be the first to review this product!</p>");t.innerHTML=o.reviews.map(e=>{const t="★".repeat(e.rating)+"☆".repeat(5-e.rating);return`<div class="review-card"><div class="star-rating">${t}</div><p><strong>${e.authorName}</strong></p><p>${e.reviewText}</p></div>`}).join("")}catch(n){t.innerHTML=`<p style="color: red;">Could not load reviews.</p>`}};
    
    const setupReviewForm=e=>{const t=document.getElementById("review-form"),n=document.getElementById("rating-input"),o=document.getElementById("form-message");if(t&&n){n.innerHTML=[5,4,3,2,1].map(e=>`<input type="radio" id="star${e}" name="rating" value="${e}" required><label for="star${e}">★</label>`).join(""),t.addEventListener("submit",async a=>{a.preventDefault(),o.textContent="Submitting...";const c=new FormData(t),r={productId:e,authorName:c.get("authorName"),reviewText:c.get("reviewText"),rating:parseInt(c.get("rating"))};try{const e=await fetch("/.netlify/functions/submit-review",{method:"POST",body:JSON.stringify(r)}),a=await e.json();if(!e.ok)throw new Error(a.message);o.textContent="Review submitted for approval!",t.reset(),fetchAndRenderReviews(r.productId)}catch(e){o.textContent=`Error: ${e.message}`}})}};

});
