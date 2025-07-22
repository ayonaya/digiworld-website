import { initializeCart } from './cart-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    let allProducts = [];
    const productGrid = document.getElementById('productGrid');

    async function fetchProducts() {
        if (!productGrid) return;
        productGrid.innerHTML = '<p>Loading products...</p>';
        try {
            const response = await fetch('/.netlify/functions/get-products');
            const data = await response.json();
            if (data.success) {
                allProducts = data.products;
                renderProducts(allProducts);
                initializeCart(allProducts);
            } else {
                throw new Error('Could not fetch products.');
            }
        } catch (error) {
            productGrid.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        }
    }

    function renderProducts(products) {
        if (!productGrid) return;
        if (products.length === 0) {
            productGrid.innerHTML = '<p>No products match your search.</p>';
            return;
        }
        productGrid.innerHTML = products.map(prod => `
            <div class="product-card" data-product-id="${prod.id}">
                <div class="card-image-container"><a href="product-details.html?id=${prod.id}"><img class="card-image" src="${prod.image}" alt="${prod.name.en}" loading="lazy"/></a></div>
                <div class="card-content-wrapper">
                    <h3 class="product-name">${prod.name.en}</h3>
                    <p class="product-price">$${prod.price.USD.toFixed(2)}</p>
                    <div class="card-buttons">
                        <button class="card-btn add-to-cart" data-id="${prod.id}">Add to Cart</button>
                        <button class="card-btn buy-now" data-id="${prod.id}">Buy Now</button>
                    </div>
                </div>
            </div>`).join('');
    }
    
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        const observer = new MutationObserver(() => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const query = searchInput.value.toLowerCase().trim();
                    const filtered = allProducts.filter(p => p.name.en.toLowerCase().includes(query));
                    renderProducts(filtered);
                });
            }
        });
        observer.observe(headerPlaceholder, { childList: true, subtree: true });
    }

    fetchProducts();
});