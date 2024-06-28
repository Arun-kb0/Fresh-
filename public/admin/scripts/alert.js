
const bsAlert = $("#bsAlert")
function showAlert(message) {
  bsAlert
    .removeClass('d-none')
    .text(message)

  setTimeout(() => {
    bsAlert.addClass('d-none')
  }, 10000 * 1)
}
