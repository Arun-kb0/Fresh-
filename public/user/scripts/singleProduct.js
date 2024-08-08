$(function () {

  const suggestionsContainer = $('.suggestionsContainer')
  const scrollLeft = $("#scroll-left")
  const scrollRight = $("#scroll-right")

  const $productImage = $("#productImage");
  const $magnifier = $("#magnifier");
  const zoomLevel = 2; // Adjust zoom level

  // * image section
  $(".cardStokeSmallImage img").on("click", function () {
    const newSrc = $(this).attr("src");
    const newAlt = $(this).attr("alt");
    $productImage.attr("src", newSrc);
    $productImage.attr("alt", newAlt);
  });

  $productImage.on("mouseenter", function () {
    $magnifier.show();
  });

  $productImage.on("mouseleave", function () {
    $magnifier.hide();
  });

  $productImage.on("mousemove", function (e) {
    const offset = $productImage.offset();
    const mouseX = e.pageX - offset.left;
    const mouseY = e.pageY - offset.top;

    const magnifierWidth = $magnifier.width() / 2;
    const magnifierHeight = $magnifier.height() / 2;

    const backgroundX = mouseX * zoomLevel - magnifierWidth;
    const backgroundY = mouseY * zoomLevel - magnifierHeight;

    $magnifier.css({
      left: mouseX - magnifierWidth,
      top: mouseY - magnifierHeight,
      background: `url(${$productImage.attr('src')}) no-repeat`,
      backgroundSize: `${$productImage.width() * zoomLevel}px ${$productImage.height() * zoomLevel}px`,
      backgroundPosition: `-${backgroundX}px -${backgroundY}px`
    });
  });

  // * image section end




  // * scroll functions
  suggestionsContainer.on("scroll", function () {
    if ($(this)[0].scrollWidth - $(this).scrollLeft() <= $(this).outerWidth()) {
    }
  });

  scrollLeft.on("click", function () {
    suggestionsContainer.animate({ scrollLeft: '-=300' }, 800);
  });
  scrollRight.on("click", function () {
    suggestionsContainer.animate({ scrollLeft: '+=300' }, 800);
  });
  // * scroll functions en


})