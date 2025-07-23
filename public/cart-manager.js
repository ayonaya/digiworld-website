// cart-manager.js
(function(){
  let cart     = JSON.parse(localStorage.getItem('digiworldCart')     || '{}');
  let products = JSON.parse(localStorage.getItem('digiworldProducts') || '[]');

  function saveCart() {
    localStorage.setItem('digiworldCart', JSON.stringify(cart));
  }
  function updateBadge() {
    const total = Object.values(cart).reduce((a,b)=>a+b,0);
    document.getElementById('cartCount')?.textContent    = total;
    document.getElementById('dwCartCount')?.textContent = total;
  }

  function renderCart() {
    const listEl    = document.getElementById('cart-items-list');
    const summaryEl = document.getElementById('cart-summary-details');
    if (!listEl || !summaryEl) return;

    if (Object.keys(cart).length === 0) {
      listEl.innerHTML    = '<p>Your cart is empty.</p>';
      summaryEl.innerHTML = '';
      return;
    }

    let total = 0, html = '';
    for (const [id, qty] of Object.entries(cart)) {
      const p = products.find(x => x.id === id);
      if (!p) continue;
      const line = p.price.USD * qty;
      total += line;
      html += `
        <div class="cart-row">
          <div class="cart-item-name">${p.name.en}</div>
          <div class="cart-item-qty">Qty: ${qty}</div>
          <div class="cart-item-lineprice">$${line.toFixed(2)}</div>
          <button class="cart-remove-btn" data-remove="${p.id}">&times;</button>
        </div>`;
    }
    listEl.innerHTML    = html;
    summaryEl.innerHTML = `<p class="cart-total">Total: $${total.toFixed(2)}</p>`;
  }

  document.body.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    delete cart[btn.dataset.remove];
    saveCart();
    updateBadge();
    renderCart();
  });

  document.addEventListener('DOMContentLoaded', () => {
    updateBadge();
    renderCart();
  });
})();
