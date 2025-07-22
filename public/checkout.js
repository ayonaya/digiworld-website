document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('checkout-form');
  const submitBtn = document.getElementById('checkout-submit');
  const orderList = document.getElementById('order-summary-list');
  const totalEl = document.getElementById('total-amount');
  const resultMsg = document.getElementById('result-message');

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // Render order items
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name.en} - $${item.price.USD}`;
    orderList.appendChild(li);
    total += item.price.USD;
  });
  totalEl.textContent = `$${total.toFixed(2)}`;

  // Enable submit when form valid
  form.addEventListener('input', () => {
    submitBtn.disabled = !form.checkValidity();
  });

  // Handle checkout flow
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    resultMsg.textContent = '';

    try {
      // Initialize payment (e.g. PayPal or NowPayments)
      resultMsg.textContent = 'Payment processing...';
      // On success:
      resultMsg.innerHTML = '<i class="fas fa-check-circle"></i> Payment successful!';
      localStorage.removeItem('cart');
    } catch (err) {
      console.error(err);
      resultMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Payment failed. Please try again.';
      submitBtn.disabled = false;
    }
  });
});
