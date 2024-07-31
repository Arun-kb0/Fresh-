$(function () {
  let subcategoryId = null
  let categoryId = null
  let sortValue = 'aToz'

  const categoryDropdown = $("#categoryDropdown")
  const categoryDropdownBtn = $("#categoryDropdownBtn")
  const subcategoryDropdown = $("#subcategoryDropdown")
  const subcategoryDropdownBtn = $("#subcategoryDropdownBtn")
  const sortBtn = $("#sortBtn")

  sortBtn.on('click', handleSort)


  $('input[name="sortRadioBtn"]').on("change", function () {
    if ($(this).is(':checked')) {
      sortValue = $(this).val().trim()
      console.log(`Active radio button: ${sortValue}`);
    }
  });


  function handleSort() {

    if (categoryId) {
      getProductsByFilter({
        id: categoryId,
        name: 'categoryId',
        sortValue
      })
    } else if (subcategoryId) {
      getProductsByFilter({
        id: subcategoryId,
        name: 'subcategoryId',
        sortValue
      })
    } else {
      getProductsByFilter({ sortValue })
    }
  }


  subcategoryDropdown.find('.dropdown-item').on('click',
    function () {
      const name = $(this).text().trim();
      subcategoryId = $(this).attr('data-id')
      if (!subcategoryId) {
        subcategoryDropdownBtn.text('subcategories');
        subcategoryId = null
        showAlert(`subcategory ${name} filter removed`)
        return
      }
      subcategoryDropdownBtn.text(name);
      showAlert(`subcategory ${name} selected`)
    });

  categoryDropdown.find('.dropdown-item').on('click',
    function () {
      const name = $(this).text().trim();
      categoryId = $(this).attr('data-id')
      if (!categoryId) {
        categoryDropdownBtn.text('categories');
        categoryId = null
        showAlert(`category ${name} filter removed`)
        return
      }
      categoryDropdownBtn.text(name);
      showAlert(`category ${name} selected`)
    });

  function getProductsByFilter({ id, name, sortValue }) {
    if (!name, !id) {
      window.location.href = `/products?sortValue=${sortValue}`
    } else {
      window.location.href = `/products?${name}=${id}&sortValue=${sortValue}`
    }
  }


})