document.addEventListener("DOMContentLoaded", () => {
  // --- Helper function to get current currency ---
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
        <div class="timer-box">
            <div class="timer-value">${days}</div>
            <div class="timer-label">Days</div>
        </div>
        <div class="timer-box">
            <div class="timer-value">${hours}</div>
            <div class="timer-label">Hours</div>
        </div>
        <div class="timer-box">
            <div class="timer-value">${minutes}</div>
            <div class="timer-label">Minutes</div>
        </div>
        <div class="timer-box">
            <div class="timer-value">${seconds}</div>
            <div class="timer-label">Seconds</div>
        </div>
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
      // Skip product if the name object is missing or doesn't have an 'en' property
      if (!product.name || !product.name.en) {
        console.warn('Skipping product with missing name:', product.id);
        return;
      }

      const originalPrice = parseFloat(product.price[currencyInfo.code] || product.price.LKR);
      if (isNaN(originalPrice)) return;
      const discountedPrice = originalPrice * 0.9;

      // Use a reliable placeholder if imageUrl is missing
      const imageUrl = product.imageUrl || `https://placehold.co/300x200/EEE/31343C?text=No+Image`;
      
      // ** THE FINAL FIX IS HERE **
      // Use "product.name.en" to get the English name string
      const productName = product.name.en;

      const slide = `
        <div class="swiper-slide">
          <div class="card h-100">
            <img src="${imageUrl}" class="card-img-top" alt="${productName}" style="height: 150px; object-fit: cover;">
            <div class="card-body text-center d-flex flex-column">
              <h5 class="card-title">${productName}</h5>
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

    // Initialize Swiper Carousel
    new Swiper(".swiper-container", {
      effect: "coverflow", grabCursor: true, centeredSlides: true, slidesPerView: "auto", loop: true,
      autoplay: { delay: 3500, disableOnInteraction: false },
      coverflowEffect: { rotate: 30, stretch: 0, depth: 200, modifier: 1, slideShadows: true },
      breakpoints: { 320: { slidesPerView: 2, spaceBetween: 20 }, 768: { slidesPerView: 3, spaceBetween: 30 }, 1024: { slidesPerView: 'auto', spaceBetween: 50 }}
    });
    
    // Add event listener for "Add to Cart" buttons
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