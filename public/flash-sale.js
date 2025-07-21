document.addEventListener("DOMContentLoaded", () => {
  // --- Helper function to get current currency ---
  // This checks your site's currency switcher.
  // We assume LKR is the default if nothing is selected.
  function getCurrentCurrencyInfo() {
    const currencyBtn = document.getElementById('langCurrencyBtn');
    if (currencyBtn && currencyBtn.innerText.includes('USD')) {
      return { code: 'USD', symbol: '$' };
    }
    return { code: 'LKR', symbol: 'Rs' };
  }

  const fetchFlashSaleProducts = async () => {
    try {
      const response = await fetch("/.netlify/functions/get-flash-sale-products");
      if (!response.ok) throw new Error("Server error");
      const products = await response.json();
      renderFlashSaleCarousel(products);
    } catch (error) {
      console.error("Could not fetch flash sale products:", error);
      document.querySelector(".flash-sale-carousel").style.display = "none";
    }
  };

  const renderFlashSaleCarousel = (products) => {
    const carouselWrapper = document.getElementById("flash-sale-carousel-wrapper");
    if (!carouselWrapper) return;

    carouselWrapper.innerHTML = ""; // Clear old content
    const currencyInfo = getCurrentCurrencyInfo();

    products.forEach((product) => {
      // Get the correct price based on the selected currency, or fallback to LKR
      const originalPrice = parseFloat(product.price[currencyInfo.code] || product.price.LKR);
      if (isNaN(originalPrice)) return; // Skip product if price is not a number

      const discountedPrice = originalPrice * 0.9;

      const slide = `
        <div class="swiper-slide">
          <div class="card h-100">
            <img src="${product.imageUrl}" class="card-img-top" alt="${product.name}" style="height: 150px; object-fit: cover;">
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

    // Initialize Swiper Carousel
    new Swiper(".swiper-container", {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      loop: true,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },
      coverflowEffect: {
        rotate: 30,
        stretch: 0,
        depth: 200,
        modifier: 1,
        slideShadows: true,
      },
      breakpoints: {
        320: { slidesPerView: 2, spaceBetween: 20 },
        768: { slidesPerView: 3, spaceBetween: 30 },
        1024: { slidesPerView: "auto", spaceBetween: 50 },
      },
    });

    // Add event listener for "Add to Cart" buttons
    carouselWrapper.addEventListener('click', (event) => {
      if (event.target.classList.contains('flash-sale-add-to-cart')) {
        const productId = event.target.dataset.productId;
        // This assumes addToCart function is globally available from another script
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