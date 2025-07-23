document.addEventListener('DOMContentLoaded', () => {
  const ordersList = document.getElementById('orders-list');
  const ordersSummary = document.getElementById('orders-summary');

  const orders = JSON.parse(localStorage.getItem('digiworldOrders')) || [];
  const products = JSON.parse(localStorage.getItem('digiworldProducts')) || [];

  function renderOrders() {
    if (!ordersList || !ordersSummary) return;

    if (orders.length === 0) {
      ordersList.innerHTML = '<p>No orders found.</p>';
      ordersSummary.innerHTML = '';
      return;
    }

    ordersList.innerHTML = '';
    orders.forEach(o => {
      const product = products.find(p => p.id === o.productId);
      if (!product) return;

      const row = document.createElement('div');
      row.className = 'order-row';
      row.innerHTML = `
        <div>${new Date(o.orderDate).toLocaleDateString()}</div>
        <div>${product.name?.en || 'Unknown Product'}</div>
        <div>Qty: ${o.quantity || 1}</div>
      `;
      ordersList.appendChild(row);
    });

    const totalOrders = orders.length;
    ordersSummary.innerHTML = `<strong>Total Orders: ${totalOrders}</strong>`;
  }

  renderOrders();
});
