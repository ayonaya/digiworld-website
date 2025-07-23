document.addEventListener('DOMContentLoaded', () => {
  const cartList = document.getElementById('cart-items-list');
  const cartSummary = document.getElementById('cart-summary-details');

  let cart = JSON.parse(localStorage.getItem('digiworldCart')) || {};
  let products = JSON.parse(localStorage.getItem('digiworldProducts')) || [];

  function saveCart() {
    localStorage.setItem('digiworldCart', JSON.stringify(cart));
  }

  function renderCart() {
    if (!cartList || !cartSummary) return;

    const cartEntries = Object.entries(cart);
    if (cartEntries.length === 0) {
      cartList.innerHTML = '<p>Your cart is empty.</p>';
      cartSummary.innerHTML = '';
      return;
    }

    let totalPrice = 0;
    cartList.innerHTML = '';
    for (const [productId, qty] of cartEntries) {
      const product = products.find(p => p.id === productId);
      if (!product) continue;

      const price = product.price?.USD || 0;
      totalPrice += price * qty;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';

      itemDiv.innerHTML = `
        <div class="cart-item-name">${product.name?.en || ''}</div>
        <div class="cart-item-qty">
          <button class="qty-btn decrement" data-id="${productId}">-</button>
          <span>${qty}</span>
          <button class="qty-btn increment" data-id="${productId}">+</button>
        </div>
        <div class="cart-item-price">$${(price * qty).toFixed(2)}</div>
        <button class="remove-btn" data-id="${productId}" aria-label="Remove from cart">&times;</button>
      `;
      cartList.appendChild(itemDiv);
    }

    cartSummary.innerHTML = `<strong>Total: $${totalPrice.toFixed(2)}</strong>`;
  }

  cartList.addEventListener('click', e => {
    const id = e.target.getAttribute('data-id');
    if (!id) return;

    if (e.target.classList.contains('increment')) {
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      renderCart();
    }
    if (e.target.classList.contains('decrement')) {
      if (cart[id] > 1) {
        cart[id]--;
      } else {
        delete cart[id];
      }
      saveCart();
      renderCart();
    }
    if (e.target.classList.contains('remove-btn')) {
      delete cart[id];
      saveCart();
      renderCart();
    }
  });

  renderCart();
});
