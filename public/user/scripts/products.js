$(function () {

  const categoryDropdown = $("#categoryDropdown")
  const subcategoryDropdown = $("#subcategoryDropdown")




  subcategoryDropdown.find('.dropdown-item').on('click',
    function () {
      const name = $(this).text().trim();
      const subcategoryId = $(this).attr('data-id')
      $('#subcategoryDropdownBtn').text("");
      $('#subcategoryDropdownBtn').text(name);
      getProductsByFilter({
        id: subcategoryId,
        name:'subcategoryId'
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
        name: 'categoryId'
      })
    });
  
  function getProductsByFilter({ id, name }) {
    window.location.href = `/products?${name}=${id}`
    // $.ajax({
    //   url: `/products?${name}=${id}`,
    //   method: 'GET',
    //   error: function (xhr,status,error) {
    //     const res = JSON.parse(xhr.responseText)
    //     showAlert(res.message)
    //     console.log(error)
    //   } 
    // })
  }
  
  
})