
const scrollAmount = 300;
// * init
// * HOME 
const topBrandsContainer = $('.scrollContainer.topBrand');
const topBrandsBtnContainer = $(".topBrandsBtnContainer")
const favFoodContainer = $(".scrollContainer.favFood")
const favFoodBtnContainer = $(".favFoodContainer")

// * SINGLE PRODUCT AND PROFILE SUGGESTIONS
const suggestionsContainer = $(".scrollContainer.suggestionsContainer")
const suggestionsBtnContainer = $(".suggestionsBtnContainer")

// ************ INTI END ***************

// suggestionsBtnContainer.find("#scroll-left")
//   .on("click", function(){console.log("scroll left")})

// * FUNCTION CALLS 

// * HOME PAGE
// * top brands scroll
topBrandsBtnContainer.find("#scroll-left")
  .on("click", scrollLeft.bind(null, topBrandsContainer))
topBrandsBtnContainer.find("#scroll-right")
  .on("click", scrollRight.bind(null, topBrandsContainer))

// * fav food
favFoodBtnContainer.find("#scroll-left")
  .on("click", scrollLeft.bind(null, favFoodContainer))
favFoodBtnContainer.find("#scroll-right")
  .on("click", scrollRight.bind(null, favFoodContainer))

// * HOME PAGE  END


// * SINGLE  PRODUCT PAGE
suggestionsBtnContainer.find("#scroll-left")
  .on("click", scrollLeft.bind(null, suggestionsContainer))
suggestionsBtnContainer.find("#scroll-right")
  .on("click", scrollRight.bind(null, suggestionsContainer))

// * SINGLE  PRODUCT PAGE END

 
// ************ FUNCTION CALLS ***************


// * SCROLL FUNCTIONS

function scrollLeft(container, e) {
  container.animate({
    scrollLeft: '-=' + scrollAmount
  }, 500);
}

function scrollRight(container) {
  container.animate({
    scrollLeft: '+=' + scrollAmount
  }, 500);
}

