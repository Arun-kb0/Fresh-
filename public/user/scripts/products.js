$(function () {
  let subcategoryId = null
  let categoryId = null
  let sortValue = 'aToz'

  const categoryDropdown = $("#categoryDropdown")
  const categoryDropdownBtn = $("#categoryDropdownBtn")
  const subcategoryDropdown = $("#subcategoryDropdown")
  const subcategoryDropdownBtn = $("#subcategoryDropdownBtn")
  const sortBtn = $("#sortBtn")

  // * pagination btns
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")

  prevBtn.on('click', handlePrev)
  nextBtn.on('click', handleNext)

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



  // * pagination
  let { page, numberOfPages } = pageDetails
  if (numberOfPages === page) {
    nextBtn.prop("disabled", true)
  }
  if (1 === page) {
    prevBtn.prop("disabled", true)
  }

  function handleNext() {
    if (numberOfPages > page) {
      page++
      console.log(page)
      const queryString = window.location.search;
      if (queryString) {
        const params = new URLSearchParams(queryString);
        params.set('page', page);
        window.location.href = `${window.location.pathname}?${params.toString()}`;  
      } else {
        window.location.href = `/products?page=${page}`
      }
    }
  }

  function handlePrev() {
    if (1 < page) {
      page--
      console.log(page)
      const queryString = window.location.search;
      if (queryString) {
        const params = new URLSearchParams(queryString);
        params.set('page', page);
        window.location.href = `${window.location.pathname}?${params.toString()}`;
      } else {
        window.location.href = `/products?page=${page}`
      }
    }
  }
  // * pagination end


})