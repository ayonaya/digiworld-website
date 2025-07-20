// public/admin.js

// Wait for the entire page to load
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const productForm = document.getElementById('productForm');
    const productTableBody = document.querySelector('#productTable tbody');
    const keyForm = document.getElementById('keyForm');
    const reviewTableBody = document.querySelector('#reviewTable tbody');

    // --- STATE ---
    let products = [];
    let reviews = [];

    // =================================================================
    // DATA FETCHING
    // =================================================================
    async function fetchAdminData() {
        try {
            // NOTE: You will need to create a 'get-admin-data.js' Netlify function
            // that securely fetches products and pending reviews.
            const response = await fetch('/.netlify/functions/get-admin-data');
            if (!response.ok) throw new Error('Failed to fetch admin data');
            
            const data = await response.json();
            if (data.success) {
                products = data.products || [];
                reviews = data.reviews || [];
                renderProducts();
                renderReviews();
            } else {
                throw new Error(data.message || 'API error');
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
            alert('Could not load admin data. See console for details.');
        }
    }

    // =================================================================
    // RENDERING FUNCTIONS
    // =================================================================
    function renderProducts() {
        if (!productTableBody) return;
        productTableBody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.name.en || 'N/A'}</td>
                <td>${p.price.USD || 'N/A'}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn btn-edit" data-id="${p.id}">Edit</button>
                    <button class="btn btn-delete" data-id="${p.id}">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function renderReviews() {
        if (!reviewTableBody) return;
        reviewTableBody.innerHTML = reviews.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.productId}</td>
                <td>${r.author}</td>
                <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
                <td><p class="review-text-cell">${r.text}</p></td>
                <td>${new Date(r.timestamp._seconds * 1000).toLocaleString()}</td>
                <td>
                    <button class="btn btn-approve" data-id="${r.id}">Approve</button>
                    <button class="btn btn-reject" data-id="${r.id}">Reject</button>
                </td>
            </tr>
        `).join('');
    }

    // =================================================================
    // EVENT LISTENERS
    // =================================================================

    // --- Product Form (Add/Update) ---
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(productForm);
            const productId = formData.get('productId');
            
            // This is a simplified data structure. You will need to expand this
            // to handle multiple languages and currencies as your product data requires.
            const productData = {
                id: formData.get('id'),
                name: { en: formData.get('name') },
                price: { USD: parseFloat(formData.get('price')) },
                category: formData.get('category'),
                image: formData.get('image'),
            };

            const endpoint = productId ? `/.netlify/functions/update-product?id=${productId}` : '/.netlify/functions/create-product';
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(productData)
                });
                const result = await response.json();
                if (result.success) {
                    alert(`Product ${productId ? 'updated' : 'created'} successfully!`);
                    productForm.reset();
                    fetchAdminData(); // Refresh the list
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Error submitting product:', error);
                alert('Error submitting product. See console for details.');
            }
        });
    }

    // --- Add Keys Form ---
    if (keyForm) {
        keyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = document.getElementById('keyProductId').value;
            const keys = document.getElementById('productKeys').value.split('\\n').map(k => k.trim()).filter(k => k);

            if (!productId || keys.length === 0) {
                alert('Please provide a Product ID and at least one key.');
                return;
            }

            try {
                const response = await fetch('/.netlify/functions/add-keys', {
                    method: 'POST',
                    body: JSON.stringify({ productId, keys })
                });
                const result = await response.json();
                if (result.success) {
                    alert(`${keys.length} keys added successfully to product ${productId}!`);
                    keyForm.reset();
                    fetchAdminData(); // Refresh stock count
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Error adding keys:', error);
                alert('Error adding keys. See console for details.');
            }
        });
    }

    // --- Review Management Buttons ---
    if (reviewTableBody) {
        reviewTableBody.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const reviewId = button.dataset.id;
            const action = button.classList.contains('btn-approve') ? 'approve' : 'reject';

            try {
                const response = await fetch('/.netlify/functions/manage-review', {
                    method: 'POST',
                    body: JSON.stringify({ reviewId, action })
                });
                const result = await response.json();
                if (result.success) {
                    alert(`Review ${action}d successfully!`);
                    fetchAdminData(); // Refresh review list
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Error managing review:', error);
                alert('Error managing review. See console for details.');
            }
        });
    }

    // --- Initial Data Load ---
    fetchAdminData();
});