document.addEventListener("DOMContentLoaded", () => {
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

    products.forEach((product) => {
      const slide = `
        <div class="swiper-slide">
          <div class="card h-100">
            <img src="${product.imageUrl}" class="card-img-top" alt="${product.name}" style="height: 150px; object-fit: cover;">
            <div class="card-body text-center d-flex flex-column">
              <h5 class="card-title">${product.name}</h5>
              <div class="mt-auto">
                <p class="card-text">
                  <span class="text-danger"><del>$${product.originalPrice.toFixed(2)}</del></span>
                  <strong>$${product.price.toFixed(2)}</strong>
                </p>
                <span class="badge bg-danger">${product.discount} OFF</span>
                <br><br>
                <button class="btn btn-primary btn-sm" onclick="addToCart('${product.id}')">Add to Cart</button>
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
      // Responsive settings
      breakpoints: {
        320: { slidesPerView: 2, spaceBetween: 20 },
        768: { slidesPerView: 3, spaceBetween: 30 },
        1024: { slidesPerView: "auto", spaceBetween: 50 },
      },
    });
  };

  fetchFlashSaleProducts();
});