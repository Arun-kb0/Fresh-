$(function () {

  const searchInput = $("#searchInput")
  const searchBtn = $("#searchBtn")

  searchBtn.on("click", handleSearch)
  searchInput.on("keypress", function (event) {
    if (event.which === 13) { 
      handleSearch();
    }
  });
  
  function handleSearch() {
    const searchQuery = searchInput.val().trim()
    window.location.href = `/products/search?searchQuery=${searchQuery}`
  }



})