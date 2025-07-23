document.addEventListener('DOMContentLoaded', () => {
    const loadComponent = async (component, selector) => {
        try {
            const response = await fetch(component);
            if (!response.ok) throw new Error(`Failed to load ${component}`);
            const text = await response.text();
            const element = document.querySelector(selector);
            if (element) element.innerHTML = text;
        } catch (error) {
            console.error(error);
        }
    };

    Promise.all([
        loadComponent('header.html', '#header-placeholder'),
        loadComponent('footer.html', '#footer-placeholder')
    ]).then(() => {
        setupHeaderListeners();
    });

    function setupHeaderListeners() {
        // Account control: Show/hide dropdown
        const accountControl = document.getElementById('accountControl');
        if (accountControl) {
            accountControl.addEventListener('click', (e) => {
                e.stopPropagation();
                // Toggle the auth dropdown menu
                const menu = accountControl.querySelector('.auth-dropdown-menu');
                if (menu) {
                    menu.classList.toggle('active');
                }
            });

            // Optional: Hide the dropdown when clicking outside
            document.addEventListener('click', (e) => {
                const menu = accountControl.querySelector('.auth-dropdown-menu');
                if (menu && menu.classList.contains('active')) {
                    menu.classList.remove('active');
                }
            });
        }

        // Cart button: Go to cart page
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                window.location.href = 'cart.html';
            });
        }

        // Navigation links: Highlight the active page
        const navLinks = document.querySelectorAll('.nav-link-pro');
        navLinks.forEach(link => {
            if (window.location.pathname.endsWith(link.getAttribute('href'))) {
                link.classList.add('active');
            }
        });

        // Search bar: Handle search action
        const searchBtn = document.querySelector('.search-btn-modern');
        const searchInput = document.getElementById('searchInput');
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `products.html?search=${encodeURIComponent(query)}`;
                }
            });
        }
    }
});
