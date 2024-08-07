$(function () {
  
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")

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
      window.location.href = `/admin/report/ledgerbook?page=${page}`
    }
  }

  function handlePrev() {
    if (1 < page) {
      page--
      console.log(page)
      window.location.href = `/admin/report/ledgerbook?page=${page}`
    }
  }
  // * pagination end
})