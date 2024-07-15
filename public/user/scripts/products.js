$(function () {

  const categoryDropdown = $("#categoryDropdown")
  const subcategoryDropdown = $("#subcategoryDropdown")

  let sortValue = 'aToz'
  $('input[name="sortRadioBtn"]').on("change", function () {
    if ($(this).is(':checked')) {
      sortValue = $(this).val().trim()
      console.log(`Active radio button: ${sortValue}`);
    }
  });


  subcategoryDropdown.find('.dropdown-item').on('click',
    function () {
      const name = $(this).text().trim();
      const subcategoryId = $(this).attr('data-id')
      $('#subcategoryDropdownBtn').text("");
      $('#subcategoryDropdownBtn').text(name);
      getProductsByFilter({
        id: subcategoryId,
        name: 'subcategoryId',
        sortValue,
      })
    });

  categoryDropdown.find('.dropdown-item').on('click',
    function () {
      const name = $(this).text().trim();
      const categoryId = $(this).attr('data-id')
      $('#categoryDropdownBtn').text("");
      $('#categoryDropdownBtn').text(name);
      getProductsByFilter({
        id: categoryId,
        name: 'categoryId',
        sortValue
      })
    });

  function getProductsByFilter({ id, name, sortValue }) {
    window.location.href = `/products?${name}=${id}&sortValue=${sortValue}`
  }


})