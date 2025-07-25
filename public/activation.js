// public/activation.js

// Wait for the custom 'componentsLoaded' event before running the script.
document.addEventListener('componentsLoaded', () => {
    const form = document.getElementById('cidForm');
    const submitBtn = document.getElementById('submitBtn');
    const installationIdInput = document.getElementById('installationId');
    const resultArea = document.getElementById('result-area');
    const suggestionsGrid = document.getElementById('suggestions-grid');
    
    const orderIdInput = document.getElementById('orderId');
    const tokenInput = document.getElementById('activationToken');
    
    const orderIdTabLink = document.querySelector('[data-tab="orderIdTab"]');
    const tokenTabLink = document.querySelector('[data-tab="tokenTab"]');
    const orderIdFormGroup = document.getElementById('orderIdTab');
    const tokenFormGroup = document.getElementById('tokenTab');
    
    let activeTab = 'orderId';

    // --- Tab Switching Logic ---
    if (orderIdTabLink && tokenTabLink) {
        orderIdTabLink.addEventListener('click', () => {
            activeTab = 'orderId';
            orderIdTabLink.classList.add('active');
            tokenTabLink.classList.remove('active');
            orderIdFormGroup.classList.remove('hidden');
            tokenFormGroup.classList.add('hidden');
        });

        tokenTabLink.addEventListener('click', () => {
            activeTab = 'token';
            tokenTabLink.classList.add('active');
            orderIdTabLink.classList.remove('active');
            tokenFormGroup.classList.remove('hidden');
            orderIdFormGroup.classList.add('hidden');
        });
    }

    // --- Product Suggestions Logic ---
    async function loadSuggestions() {
        if (!suggestionsGrid) return;
        try {
            const response = await fetch('/.netlify/functions/get-products');
            const data = await response.json();
            if (data.success) {
                const allProds = [...data.products, ...data.flashSaleProducts];
                const shuffled = allProds.sort(() => 0.5 - Math.random());
                const suggestions = shuffled.slice(0, 4);
                
                const currentCurr = localStorage.getItem('userCurrency') || 'USD';
                const currencySymbols = { USD: '$', LKR: 'Rs', INR: '₹', EUR: '€', GBP: '£' };

                suggestionsGrid.innerHTML = suggestions.map(product => {
                    const price = product.price[currentCurr] || product.price.USD;
                    const currencySymbol = currencySymbols[currentCurr] || '$';
                    return `
                        <a href="product-details.html?id=${product.id}" class="product-card">
                            <img src="${product.image}" alt="${product.name.en}" class="card-image" style="height: 180px; object-fit: contain;">
                            <div class="card-content-wrapper">
                                <h3 class="product-name">${product.name.en}</h3>
                                <p class="product-price">${currencySymbol}${price.toFixed(2)}</p>
                            </div>
                        </a>`;
                }).join('');
            }
        } catch(err) {
            suggestionsGrid.innerHTML = '<p>Could not load suggestions.</p>';
        }
    }
    
    // --- Form Submission Logic ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const iid = installationIdInput.value;
            let requestBody = { installationId: iid };

            if (activeTab === 'orderId') {
                requestBody.orderId = orderIdInput.value;
            } else {
                requestBody.activationToken = tokenInput.value;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            resultArea.innerHTML = '';

            try {
                const response = await fetch('/.netlify/functions/get-confirmation-id', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
                
                let result;
                try { result = await response.json(); } 
                catch (jsonError) { throw new Error('The server returned an unexpected response.'); }

                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'An unknown error occurred.');
                }
                
                resultArea.innerHTML = `<div class="result-box success"><button class="copy-btn" id="copyBtn">Copy ID</button><h3><i class="fas fa-check-circle"></i> Success!</h3><p>Here is your Confirmation ID:</p><textarea readonly id="confirmationIdText">${result.data}</textarea></div>`;
            } catch (error) {
                resultArea.innerHTML = `<div class="result-box error"><h3><i class="fas fa-exclamation-triangle"></i> Verification Failed</h3><p>${error.message}</p></div>`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Verify & Get Confirmation ID';
                
                // --- NEW: Smoothly scroll to the result box ---
                resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
    
    // --- Copy Button Logic ---
    if (resultArea) {
        resultArea.addEventListener('click', (event) => {
            if (event.target.id === 'copyBtn') {
                const copyBtn = event.target;
                const confirmationIdText = document.getElementById('confirmationIdText');
                navigator.clipboard.writeText(confirmationIdText.value).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy ID'; }, 2000);
                });
            }
        });
    }

    // Initialize the page
    loadSuggestions();
});