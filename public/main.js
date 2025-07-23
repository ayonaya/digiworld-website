document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. LOAD HEADER AND FOOTER ---
    // This function fetches the content of header.html and footer.html and injects it into your index.html.
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
                    // IMPORTANT: After the header has been loaded, we must initialize its interactive parts.
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

    // Loads the content of your banner HTML files into the slider.
    const loadBanners = async () => {
        if (!slidesContainer) return;

        for (const file of bannerFiles) {
            try {
                const response = await fetch(file);
                if (!response.ok) continue; // Skip if a banner file is not found
                const html = await response.text();
                const slide = document.createElement('div');
                slide.classList.add('slide');
                slide.innerHTML = html;
                slidesContainer.appendChild(slide);
            } catch (error) {
                console.error(`Failed to load banner: ${file}`, error);
            }
        }
        
        // Only start the slider if banners were successfully loaded.
        if (slidesContainer.children.length > 0) {
            setupSlider();
        }
    };
    
    // Sets up the controls and automatic sliding for the banner.
    const setupSlider = () => {
        const nextBtn = document.querySelector('.slider-arrow.next');
        const prevBtn = document.querySelector('.slider-arrow.prev');

        const showSlide = (index) => {
            const totalSlides = slidesContainer.children.length;
            // This ensures the slider loops correctly (e.g., from last slide to first)
            currentSlide = (index + totalSlides) % totalSlides;
            const offset = -currentSlide * 100;
            slidesContainer.style.transform = `translateX(${offset}%)`;
        };

        const startSlider = () => {
            clearInterval(slideInterval); // Clear any existing timer
            slideInterval = setInterval(() => {
                showSlide(currentSlide + 1);
            }, 5000); // Auto-slides every 5 seconds
        };

        // Event listeners for the arrow buttons
        nextBtn.addEventListener('click', () => {
            showSlide(currentSlide + 1);
            startSlider(); // Reset the auto-slide timer on manual click
        });

        prevBtn.addEventListener('click', () => {
            showSlide(currentSlide - 1);
            startSlider(); // Reset the auto-slide timer on manual click
        });

        startSlider(); // Start the slider for the first time
    };

    loadBanners();
    
    // --- 3. INITIALIZE HEADER ELEMENTS ---
    // This function is called ONLY after header.html has been successfully loaded.
    function initializeHeader() {
        const userContainer = document.querySelector('.user-info'); 
        if (userContainer) {
            // Your auth.js script will handle the logic for logged-in users.
            // This code sets up the default dropdown for guests.
            userContainer.innerHTML = `
                <div class="user-menu">
                    <a href="#">Welcome / Sign In <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 5px;"></i></a>
                    <div class="user-menu-content">
                        <a href="login.html">Sign In</a>
                        <a href="signup.html">Register</a>
                    </div>
                </div>
            `;
        }
        
        const cartIcon = document.getElementById('cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                window.location.href = 'cart.html';
            });
        }
    }
});
