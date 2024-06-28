$(function () {
  const deleteCategoryBtn = $(".deleteCategoryBtn")
  const deleteSubCategoryBtn = $(".deleteSubCategoryBtn")
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")


  deleteCategoryBtn.on("click", deleteCategoryHelper)
  deleteSubCategoryBtn.on("click", deleteCategoryHelper)
  nextBtn.on("click", handleNext)
  prevBtn.on("click", handlePrev)


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
      window.location.href = `/admin/categories?page=${page}`
    }
  }

  function handlePrev() {
    if (1 < page) {
      page--
      console.log(page)
      window.location.href = `/admin/categories?page=${page}`
    }
  }
  // * pagination end


  // * delete category and subcategory
  function deleteCategoryHelper() {
    const categoryId = this.getAttribute("data-item")
    console.log(categoryId)
    $.ajax({
      url: `/admin/category/edit?categoryId=${categoryId}`,
      method: "DELETE",
      success: function (data) {
        console.log(data)
        showAlert(data.message)
        // alert(data.message)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
        // alert(res.message)
      }
    })
  }
})