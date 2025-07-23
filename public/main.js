// main.js
document.addEventListener('DOMContentLoaded', async () => {
  // —————————————————————————————————————
  // 1) STATE & DOM
  // —————————————————————————————————————
  const productGrid    = document.getElementById('productGrid');
  const sliderContainer= document.getElementById('hero-slider');
  let allProducts      = JSON.parse(localStorage.getItem('digiworldProducts') || '[]');
  let cart             = JSON.parse(localStorage.getItem('digiworldCart')     || '{}');

  // —————————————————————————————————————
  // 2) CART UTILITIES
  // —————————————————————————————————————
  function saveCart() {
    localStorage.setItem('digiworldCart', JSON.stringify(cart));
  }
function updateCartBadge() {
  const total = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const desktopEl = document.getElementById('cartCount');
  if (desktopEl) desktopEl.textContent = total;

  const mobileEl = document.getElementById('dwCartCount');
  if (mobileEl) mobileEl.textContent = total;
}
  function addToCart(id) {
    cart[id] = (cart[id]||0) + 1;
    saveCart(); updateCartBadge();
    animateButton(id);
    animateFlyToCart(id);
  }
  function animateButton(id) {
    const btn = document.querySelector(`.add-to-cart[data-id="${id}"]`);
    if (!btn) return;
    btn.disabled = true;
    const txt = btn.textContent;
    btn.textContent = 'Added!';
    btn.classList.add('added');
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = txt;
      btn.classList.remove('added');
    }, 1200);
  }
  function animateFlyToCart(id) {
    const card = document.querySelector(`.product-card[data-product-id="${id}"]`);
    const img  = card?.querySelector('img.card-image');
    const cartIcon = document.getElementById('cartBtn');
    if (!img || !cartIcon) return;
    const iR = img.getBoundingClientRect(), cR = cartIcon.getBoundingClientRect();
    const clone = img.cloneNode();
    Object.assign(clone.style, {
      position:'fixed', left:iR.left+'px', top:iR.top+'px',
      width:iR.width+'px', height:iR.height+'px', zIndex:9999,
      transition:'all 0.8s ease-in-out', opacity:'1', pointerEvents:'none'
    });
    document.body.appendChild(clone);
    requestAnimationFrame(()=>{
      clone.style.left = (cR.left + cR.width/2 - iR.width/4) + 'px';
      clone.style.top  = (cR.top  + cR.height/2- iR.height/4)+'px';
      clone.style.width  = iR.width/2+'px';
      clone.style.height = iR.height/2+'px';
      clone.style.opacity= '0.3';
    });
    setTimeout(()=> clone.remove(), 900);
  }

  // —————————————————————————————————————
  // 3) BANNER SLIDER
  // —————————————————————————————————————
  async function loadBanners() {
    if (!sliderContainer) return;
    sliderContainer.innerHTML = '';
    const files = ['banner_1_powerful.html','banner_2_final.html','banner_3_unique.html','banner_4_flashsale.html'];
    for (const f of files) {
      try {
        const r = await fetch(f);
        if (!r.ok) continue;
        const html = await r.text();
        const div = document.createElement('div');
        div.className = 'slider-slide';
        div.innerHTML = html;
        sliderContainer.append(div);
      } catch {}
    }
    initSlider();
  }
  function initSlider() {
    const slides = sliderContainer.querySelectorAll('.slider-slide');
    let idx = 0;
    if (!slides.length) return;
    slides[idx].classList.add('active');
    setInterval(()=>{
      slides[idx].classList.remove('active');
      idx = (idx+1)%slides.length;
      slides[idx].classList.add('active');
    },7000);
  }

  // —————————————————————————————————————
  // 4) PRODUCTS FETCH & RENDER
  // —————————————————————————————————————
  async function fetchProducts() {
    try {
      const res = await fetch('/.netlify/functions/get-products');
      const { success, products } = await res.json();
      if (success) { allProducts = products; }
    } catch {}
    renderProducts(allProducts);
  }
  function renderProducts(list) {
    if (!productGrid) return;
    if (!list.length) {
      productGrid.innerHTML = '<p style="text-align:center">No products found.</p>';
      return;
    }
    productGrid.innerHTML = list.map(p => `
      <div class="product-card" data-product-id="${p.id}">
        ${p.isHot?'<div class="badge-hot"><i class="fas fa-fire"></i> Hot</div>':''}
        <div class="card-image-container">
          <a href="product-details.html?id=${p.id}">
            <img class="card-image" src="${p.image}" alt="${p.name.en}" loading="lazy"/>
          </a>
        </div>
        <div class="card-content-wrapper">
          <h3 class="product-name">${p.name.en}</h3>
          ${p.delivery?.en?`<div class="tag-delivery">${p.delivery.en}</div>`:''}
          <p class="product-price">$${p.price.USD.toFixed(2)}</p>
          <div class="card-buttons">
            <button class="card-btn add-to-cart" data-id="${p.id}">Add to Cart</button>
            <button class="card-btn buy-now"    data-id="${p.id}">Buy Now</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // —————————————————————————————————————
  // 5) EVENT DELEGATION FOR BUTTONS
  // —————————————————————————————————————
  document.body.addEventListener('click', e => {
    if (e.target.closest('.add-to-cart')) {
      addToCart(e.target.closest('.add-to-cart').dataset.id);
      return;
    }
    if (e.target.closest('.buy-now')) {
      addToCart(e.target.closest('.buy-now').dataset.id);
      window.location.href = 'checkout.html';
      return;
    }
  });

  // 6) SEARCH + SUGGESTIONS
  function setupSearch() {
    const input = document.getElementById('searchInput');
    const box   = document.getElementById('searchSuggestionsDesktop');
    if (!input || !box) return;

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      const matches = allProducts.filter(p =>
        p.name.en.toLowerCase().includes(q)
      );
      renderProducts(matches);

      if (q && matches.length) {
        box.innerHTML = matches.slice(0,5).map(p => `
          <div class="suggestion-item" data-id="${p.id}" tabindex="0">
            ${p.name.en}
          </div>
        `).join('');
        box.classList.add('visible');
      } else {
        box.innerHTML = '';
        box.classList.remove('visible');
      }
    });

    box.addEventListener('click', e => {
      const sel = e.target.closest('.suggestion-item');
      if (sel) window.location.href = `product-details.html?id=${sel.dataset.id}`;
    });

    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !box.contains(e.target)) {
        box.classList.remove('visible');
        box.innerHTML = '';
      }
    });
  }

  // 7) INIT
  updateCartBadge();
  await loadBanners();
  await fetchProducts();

  // Wait for header injection, then attach search
  new MutationObserver((m, o) => {
    if (document.getElementById('searchInput')) {
      setupSearch();
      o.disconnect();
    }
  }).observe(
    document.getElementById('header-placeholder'),
    { childList: true, subtree: true }
  );

// ← **Don’t forget these two characters to close out the listener**  
});
