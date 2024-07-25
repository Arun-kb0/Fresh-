$(function () {

  let topBrandsPage = 1;
  let topBrandNumberOfPages = 1
  const topBrandScrollContainer = $(".topBrandScrollContainer")
  const scrollLeftTopBrand = $("#scroll-left-topBrands")
  const scrollRightTopBrand = $("#scroll-right-topBrands")


  let popularProductsPage = 1;
  let popularProductsNumberOfPages = 1
  const popularScrollContainer = $(".popularScrollContainer")
  const scrollLeftPopular = $("#scroll-left-popular")
  const scrollRightPopular = $("#scroll-right-popular")


  let topRatedProductsPage = 1;
  let topRatedProductsNumberOfPages = 1
  const topRatedScrollContainer = $(".topRatedScrollContainer")
  const scrollLeftTopRated = $("#scroll-left-topRated")
  const scrollRightTopRated = $("#scroll-right-topRated")

  let latestProductsPage = 1;
  let latestProductsNumberOfPages = 1
  const latestScrollContainer = $(".latestScrollContainer")
  const scrollLefLatest = $("#scroll-left-latest")
  const scrollRightLatest = $("#scroll-right-latest")

  // * latest
  loadMoreData({
    page: latestProductsPage,
    container: latestScrollContainer,
    name: 'latest',
    url: `/products/latest?page=${latestProductsPage}`
  })

  // * top brand  
  loadMoreData({
    page: topBrandsPage,
    container: topBrandScrollContainer,
    name: 'topBrand',
    url: `/products/topbrands?page=${popularProductsPage}`
  })

  // * popular
  loadMoreData({
    page: popularProductsPage,
    container: popularScrollContainer,
    name: 'popular',
    url: `/products/popular?page=${popularProductsPage}`
  })

  // * top rated
  loadMoreData({
    page: topRatedProductsPage,
    container: topRatedScrollContainer,
    name: 'topRated',
    url: `/products/toprated?page=${topRatedProductsPage}`
  })



  // * load more content  function
  function loadMoreData({ page, container, url, name }) {
    $.ajax({
      url: url,
      type: 'GET',
      beforeSend: function () {
        topBrandScrollContainer.append(`
          <div class="loading d-flex justify-content-center align-items-center">
          <div class="spinner-border p-3" role="status">
            <span class="visually-hidden"></span>
          </div>
          </div>
          `)
      },
      success: function (data) {
        if (data?.products.length === 0) {
          container.append('<div class="end">No more data to load</div>');
          return;
        }
        switch (name) {
          case 'topBrand':
            topBrandNumberOfPages = data.numberOfPages
            break;
          case 'popular':
            popularProductsNumberOfPages = data.numberOfPages
            break;
          case 'topRated':
            topRatedProductsNumberOfPages = data.numberOfPages
            break;
          case 'latest':
            latestProductsNumberOfPages = data.numberOfPages
            break;
          default:
            console.log('invalid call')
        }
        $('.loading').remove(); // Remove loading indicator

        data.products.forEach(item => {

          const discountSection = item.offer?.discountValue
            ? `
            <div class="d-flex justify-content-center">
              <p class="text-secondary px-3 textLineTrough">₹${item.price}</p>
              <p class="text-success px-3">${item?.offer?.discountType === 'percentage'
                ? item?.offer?.discountValue + "% OFF"
                : "₹" + item?.offer?.discountValue + " OFF"
            }</p>
            </div>
          `
            : `<div class='' style='height:42px' >  </div>`


          container.append(`
            <div class="position-relative col-lg-2 col-md-3 m-1 mx-3 mb-3 text-center p-2 cardStoke">
            <div class="position-absolute top-0 start-0">
							<a class="addToWishlistBtn" data-id='${item._id}' >
								<i class="fa-solid fa-heart fa-xl ${item?.isWishlisted ? 'wishlistBtnIcon' : 'text-secondary'}"></i>
							</a>
						</div>
              <div class="d-flex flex-column align-content-center">
                <div class="d-flex justify-content-center">
                  <a class="cardImage" href="/product?productId=${item._id}">
                    <img src="${item.image[0]?.path}" alt="${item.image[0]?.originalName}">
                  </a>
                </div>
                <h6>${item.name}</h6>
                <h5 class="priceTextColor">₹${item.finalPrice}</h5>

                ${discountSection}

                <div class="d-flex align-items-baseline">
                  <div class="d-flex pb-3 px-3">
                    ${Array(5).fill().map((_, i) => i < item.rating ? '<i class="fa-solid fa-star fa-lg text-warning"></i>' : '<i class="fa-regular fa-star fa-lg text-warning"></i>').join('')}
                  </div>
                  <span class="text-secondary">${item.peopleRated}</span>
                </div>
                <button class="btn btn-outline-secondary rounded-pill addToCartBtn" data-id="${item._id}" data-price="${item.finalPrice}">
                  <span>Add</span>
                </button>
              </div>
            </div>
          `);
        });
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('Error fetching data:', textStatus, errorThrown);
      }
    });
  }



  // * latest scroll functions
  latestScrollContainer.on("scroll", function () {
    if ($(this)[0].scrollWidth - $(this).scrollLeft() <= $(this).outerWidth()) {
      if (latestProductsPage <= latestProductsNumberOfPages) {
        latestProductsPage++;
        loadMoreData({
          page: latestProductsPage,
          container: latestScrollContainer,
          name: 'latest',
          url: `/products/latest?page=${latestProductsPage}`
        })
      }
      console.log(latestProductsPage)
      console.log(latestProductsNumberOfPages)
    }
  });

  scrollLefLatest.on("click", function () {
    latestScrollContainer.animate({ scrollLeft: '-=300' }, 800);
  });
  scrollRightLatest.on("click", function () {
    latestScrollContainer.animate({ scrollLeft: '+=300' }, 800);
  });
  // * top brand scroll functions

  // * top brand scroll functions
  topBrandScrollContainer.on("scroll", function () {
    if ($(this)[0].scrollWidth - $(this).scrollLeft() <= $(this).outerWidth()) {
      if (topBrandsPage <= topBrandNumberOfPages) {
        topBrandsPage++;
        loadMoreData({
          page: topBrandsPage,
          container: topBrandScrollContainer,
          name: 'topBrand',
          url: `/products/topbrands?page=${popularProductsPage}`
        })
      }
      console.log(topBrandsPage)
      console.log(topBrandNumberOfPages)
    }
  });

  scrollLeftTopBrand.on("click", function () {
    topBrandScrollContainer.animate({ scrollLeft: '-=300' }, 800);
  });
  scrollRightTopBrand.on("click", function () {
    topBrandScrollContainer.animate({ scrollLeft: '+=300' }, 800);
  });
  // * top brand scroll functions


  // * popular scroll function
  popularScrollContainer.on("scroll", function () {
    if ($(this)[0].scrollWidth - $(this).scrollLeft() <= $(this).outerWidth()) {
      if (popularProductsPage <= popularProductsNumberOfPages) {
        popularProductsPage++;
        loadMoreData({
          page: popularProductsPage,
          container: popularScrollContainer,
          name: 'popular',
          url: `/products/popular?page=${popularProductsPage}`
        })
      }
      console.log(popularProductsPage)
      console.log(popularProductsNumberOfPages)
    }
  });

  scrollLeftPopular.on("click", function () {
    popularScrollContainer.animate({ scrollLeft: '-=300' }, 800);
  });
  scrollRightPopular.on("click", function () {
    popularScrollContainer.animate({ scrollLeft: '+=300' }, 800);
  });
  // * popular scroll function end



  // * topRated scroll function
  topRatedScrollContainer.on("scroll", function () {
    if ($(this)[0].scrollWidth - $(this).scrollLeft() <= $(this).outerWidth()) {
      if (topRatedProductsPage <= topRatedProductsNumberOfPages) {
        topRatedProductsPage++;
        loadMoreData({
          page: topRatedProductsPage,
          container: topRatedScrollContainer,
          name: 'topRated',
          url: `/products/toprated?page=${topRatedProductsPage}`
        })
      }
      console.log(topRatedProductsPage)
      console.log(topRatedProductsNumberOfPages)
    }
  });

  scrollLeftTopRated.on("click", function () {
    topRatedScrollContainer.animate({ scrollLeft: '-=300' }, 800);
  });
  scrollRightTopRated.on("click", function () {
    topRatedScrollContainer.animate({ scrollLeft: '+=300' }, 800);
  });
  // * topRated scroll function end


});
