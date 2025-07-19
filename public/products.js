// public/products.js

// This function will be called when the page loads.
document.addEventListener('DOMContentLoaded', () => {
    // Find the container on the page where products should be displayed.
    // Make sure your index.html has an element with id="products-container".
    const productsContainer = document.getElementById('products-container');
    const loadingSpinner = document.getElementById('loading-spinner'); // Optional: for a loading indicator

    if (!productsContainer) {
        console.error('Error: Could not find element with id="products-container"');
        return;
    }

    // Show loading spinner if it exists
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }

    // Fetch the products from our Netlify serverless function
    fetch('/.netlify/functions/get-products')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }

            if (data.success && data.products) {
                // Clear any existing content
                productsContainer.innerHTML = ''; 
                // Call the function to display the products
                displayProducts(data.products, productsContainer);
            } else {
                throw new Error(data.message || 'Failed to load products from the server.');
            }
        })
        .catch(error => {
            console.error('Failed to fetch products:', error);
            // Hide loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            // Display an error message to the user
            productsContainer.innerHTML = `<p class="text-center text-red-500">Error loading products. Please try again later.</p>`;
        });
});

// This function takes the list of products and creates the HTML to display them
function displayProducts(products, container) {
    if (products.length === 0) {
        container.innerHTML = '<p class="text-center">No products found.</p>';
        return;
    }

    products.forEach(product => {
        // This creates the HTML for a single product card.
        // You may need to adjust the HTML structure and classes to match your site's design.
        const productCard = `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                <a href="/product-details.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name.en}" class="w-full h-48 object-cover">
                </a>
                <div class="p-4">
                    <h3 class="text-lg font-semibold mb-2">
                        <a href="/product-details.html?id=${product.id}" class="hover:text-blue-600">${product.name.en}</a>
                    </h3>
                    <p class="text-gray-600 text-sm mb-4">${product.shortDesc || ''}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xl font-bold text-gray-900">$${product.price.USD}</span>
                        <a href="/product-details.html?id=${product.id}" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">View Details</a>
                    </div>
                </div>
            </div>
        `;
        // Add the new product card to the container
        container.innerHTML += productCard;
    });
}

// IMPORTANT: You must have a container in your index.html like this:
// <div id="products-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//     <!-- Products will be loaded here by JavaScript -->
// </div>
// And optionally, a loading spinner:
// <div id="loading-spinner" style="display: none;">Loading...</div>
