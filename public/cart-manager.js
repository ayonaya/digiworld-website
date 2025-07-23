// cart-manager.js
(function(){
  let cart = JSON.parse(localStorage.getItem('digiworldCart')||'{}');
  const products = JSON.parse(localStorage.getItem('digiworldProducts')||'[]');
  function save(){ localStorage.setItem('digiworldCart', JSON.stringify(cart)); }
  function getSymbol(){ return '$'; }

  function updateBadge(){
    const n = Object.values(cart).reduce((a,b)=>a+b,0);
    document.getElementById('cartCount')?.textContent = n;
    document.getElementById('dwCartCount')?.textContent = n;
  }

  function renderCart(){
    const container = document.getElementById('cartItems');
    const summary   = document.getElementById('orderSummary');
    if(!container||!summary) return;
    container.innerHTML = '';
    let total=0;
    Object.entries(cart).forEach(([id,qty])=>{
      const p = products.find(x=>x.id===id);
      if(!p) return;
      const price = p.price.USD * qty;
      total += price;
      container.insertAdjacentHTML('beforeend', `
        <div class="cart-row">
          <span>${p.name.en}</span>
          <span>${qty}× $${p.price.USD.toFixed(2)}</span>
          <button data-remove="${id}">Remove</button>
        </div>
      `);
    });
    summary.innerHTML = `<p>Total: $${total.toFixed(2)}</p>`;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    updateBadge();
    renderCart();
    document.body.addEventListener('click', e=>{
      if(e.target.dataset.remove){
        delete cart[e.target.dataset.remove];
        save(); updateBadge(); renderCart();
      }
    });
  });
})();
