$(function () {

  const searchInput = $("#searchInput")
  const searchBtn = $("#searchBtn")

  const searchInputSm = $("#searchInputSm")
  const searchBtnSm = $("#searchBtnSm")
  

  searchBtnSm.on("click", handleSearchSm)
  searchInputSm.on("keypress", function (event) {
    if (event.which === 13) { 
      handleSearchSm();
    }
  });

  searchBtn.on("click", handleSearch)
  searchInput.on("keypress", function (event) {
    const searchQuery = searchInput.val().trim()
    if (event.which === 13) { 
      handleSearch();
    }
  });
  
  function handleSearch() {
    const searchQuery = searchInput.val().trim()
    window.location.href = `/products/search?searchQuery=${searchQuery}`
  }
  
  function handleSearchSm() {
    const searchQuery = searchInputSm.val().trim()
    window.location.href = `/products/search?searchQuery=${searchQuery}`
  }



})