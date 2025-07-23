document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. LOAD HEADER AND FOOTER ---
    const loadHTML = (selector, url) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                const element = document.querySelector(selector);
                if (element) {
                    element.innerHTML = data;
                    // After loading, initialize components specific to that HTML
                    if (selector === '#header-placeholder') {
                        initializeHeader();
                    }
                }
            })
            .catch(error => console.error(error));
    };

    loadHTML('#header-placeholder', 'header.html');
    loadHTML('#footer-placeholder', 'footer.html');

    // --- 2. BANNER SLIDER LOGIC ---
    const bannerFiles = [
        'banner_1_powerful.html',
        'banner_2_final.html',
        'banner_3_unique.html',
        'banner_4_flashsale.html'
    ];
    const slidesContainer = document.querySelector('#banner-slider .slides-container');
    let currentSlide = 0;
    let slideInterval;

    const loadBanners = async () => {
        if (!slidesContainer) return;

        for (const file of bannerFiles) {
            try {
                const response = await fetch(file);
                if (!response.ok) continue;
                const html = await response.text();
                const slide = document.createElement('div');
                slide.classList.add('slide');
                slide.innerHTML = html;
                slidesContainer.appendChild(slide);
            } catch (error) {
                console.error(`Failed to load banner: ${file}`, error);
            }
        }
        
        if (slidesContainer.children.length > 0) {
            setupSlider();
        }
    };
    
    const setupSlider = () => {
        const nextBtn = document.querySelector('.slider-arrow.next');
        const prevBtn = document.querySelector('.slider-arrow.prev');

        const showSlide = (index) => {
            const totalSlides = slidesContainer.children.length;
            if (index >= totalSlides) {
                currentSlide = 0;
            } else if (index < 0) {
                currentSlide = totalSlides - 1;
            } else {
                currentSlide = index;
            }
            const offset = -currentSlide * 100;
            slidesContainer.style.transform = `translateX(${offset}%)`;
        };

        const startSlider = () => {
            slideInterval = setInterval(() => {
                showSlide(currentSlide + 1);
            }, 5000); // Auto-slide every 5 seconds
        };

        const resetSliderInterval = () => {
            clearInterval(slideInterval);
            startSlider();
        };

        nextBtn.addEventListener('click', () => {
            showSlide(currentSlide + 1);
            resetSliderInterval();
        });

        prevBtn.addEventListener('click', () => {
            showSlide(currentSlide - 1);
            resetSliderInterval();
        });

        startSlider();
    };

    loadBanners();
    
    // --- 3. INITIALIZE HEADER ELEMENTS ---
    // This function is called after header.html is loaded
    function initializeHeader() {
        const userContainer = document.querySelector('.user-info'); 
        if (userContainer) {
            // This assumes a simple check. Replace with your actual authentication logic from auth.js
            const isLoggedIn = false; // Example: check from localStorage or auth state
            
            if (isLoggedIn) {
                // Logic for logged-in user (e.g., show username)
            } else {
                // Create the dropdown menu for guests
                userContainer.innerHTML = `
                    <div class="user-menu">
                        <a href="#">Welcome / Sign In <i class="fas fa-chevron-down"></i></a>
                        <div class="user-menu-content">
                            <a href="login.html">Sign In</a>
                            <a href="signup.html">Register</a>
                        </div>
                    </div>
                `;
            }
        }

        const cartIcon = document.getElementById('cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                window.location.href = 'cart.html';
            });
        }
    }
});
