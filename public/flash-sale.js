document.addEventListener("DOMContentLoaded", () => {
  function getCurrentCurrencyInfo() {
    const currencyBtn = document.getElementById('langCurrencyBtn');
    if (currencyBtn && currencyBtn.innerText.includes('USD')) {
      return { code: 'USD', symbol: '$' };
    }
    return { code: 'LKR', symbol: 'Rs' };
  }

  function startCountdownTimer(endDate) {
    const countdownElement = document.getElementById('flash-sale-countdown');
    if (!countdownElement) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endDate).getTime() - now;
      if (distance < 0) {
        clearInterval(interval);
        countdownElement.innerHTML = `<div class="timer-end">The sale has ended!</div>`;
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      countdownElement.innerHTML = `
        <div class="timer-box"><div class="timer-value">${days}</div><div class="timer-label">Days</div></div>
        <div class="timer-box"><div class="timer-value">${hours}</div><div class="timer-label">Hours</div></div>
        <div class="timer-box"><div class="timer-value">${minutes}</div><div class="timer-label">Minutes</div></div>
        <div class="timer-box"><div class="timer-value">${seconds}</div><div class="timer-label">Seconds</div></div>
      `;
    }, 1000);
  }

  const fetchFlashSaleProducts = async () => {
    try {
      const response = await fetch("/.netlify/functions/get-flash-sale-products");
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      
      renderFlashSaleCarousel(data.products);
      startCountdownTimer(data.saleEndDate);

    } catch (error) {
      console.error("Could not fetch flash sale products:", error);
      document.querySelector(".flash-sale-carousel").style.display = "none";
    }
  };

  const renderFlashSaleCarousel = (products) => {
    const carouselWrapper = document.getElementById("flash-sale-carousel-wrapper");
    if (!carouselWrapper) return;

    carouselWrapper.innerHTML = "";
    const currencyInfo = getCurrentCurrencyInfo();

    products.forEach((product) => {
      // --- START OF NEW DIAGNOSTIC LOG ---
      console.log('--- DIAGNOSTIC: Checking product before rendering ---');
      console.log('Product ID:', product.id);
      console.log('Product Name:', product.name);
      console.log('Image URL:', product.imageUrl);
      console.log('Type of Image URL:', typeof product.imageUrl);
      console.log('----------------------------------------------------');
      // --- END OF NEW DIAGNOSTIC LOG ---

      const originalPrice = parseFloat(product.price[currencyInfo.code] || product.price.LKR);
      if (isNaN(originalPrice)) return;
      const discountedPrice = originalPrice * 0.9;
      
      // I've kept the placeholder fix in as a safety net for now.
      const imageUrl = product.imageUrl || 'https://via.placeholder.com/300x200.png?text=Image+Missing';

      const slide = `
        <div class="swiper-slide">
          <div class="card h-100">
            <img src="${imageUrl}" class="card-img-top" alt="${product.name || 'Product'}" style="height: 150px; object-fit: cover;">
            <div class="card-body text-center d-flex flex-column">
              <h5 class="card-title">${product.name}</h5>
              <div class="mt-auto">
                <p class="card-text">
                  <span class="text-danger"><del>${currencyInfo.symbol}${originalPrice.toFixed(2)}</del></span>
                  <strong>${currencyInfo.symbol}${discountedPrice.toFixed(2)}</strong>
                </p>
                <span class="badge bg-danger">Flash Sale</span>
                <br><br>
                <button class="btn btn-primary btn-sm flash-sale-add-to-cart" data-product-id="${product.id}">Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      `;
      carouselWrapper.innerHTML += slide;
    });

    new Swiper(".swiper-container", {
      effect: "coverflow", grabCursor: true, centeredSlides: true, slidesPerView: "auto", loop: true,
      autoplay: { delay: 3500, disableOnInteraction: false },
      coverflowEffect: { rotate: 30, stretch: 0, depth: 200, modifier: 1, slideShadows: true },
      breakpoints: { 320: { slidesPerView: 2, spaceBetween: 20 }, 768: { slidesPerView: 3, spaceBetween: 30 }, 1024: { slidesPerView: 'auto', spaceBetween: 50 }}
    });
    
    carouselWrapper.addEventListener('click', (event) => {
      if (event.target.classList.contains('flash-sale-add-to-cart')) {
        const productId = event.target.dataset.productId;
        if (productId && typeof addToCart === 'function') {
          addToCart(productId);
        } else {
          console.error('addToCart function is not available.');
          alert('Could not add item to cart.');
        }
      }
    });
  };

  fetchFlashSaleProducts();
});