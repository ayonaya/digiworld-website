// orders-manager.js
(function(){
  let orders   = JSON.parse(localStorage.getItem('digiworldOrders')    || '[]');
  let products = JSON.parse(localStorage.getItem('digiworldProducts')  || '[]');

  function renderOrders() {
    const listEl = document.getElementById('orders-list');
    const sumEl  = document.getElementById('orders-summary');
    if (!listEl || !sumEl) return;

    if (!orders.length) {
      listEl.innerHTML = '<p>No past orders.</p>';
      sumEl.innerHTML  = '';
      return;
    }

    let count = 0, html = orders.map(o => {
      const p = products.find(p=>p.id===o.productId) || {name:{en:'Unknown'}};
      count += o.quantity;
      return `
        <div class="order-row">
          <div>${new Date(o.date).toLocaleDateString()}</div>
          <div>${p.name.en}</div>
          <div>Qty: ${o.quantity}</div>
        </div>`;
    }).join('');
    listEl.innerHTML = html;
    sumEl.innerHTML  = `<p>Total Items: ${count}</p>`;
  }

  document.addEventListener('DOMContentLoaded', renderOrders);
})();
