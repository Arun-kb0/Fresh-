
// const bsAlert = $("#bsAlert")
// function showAlert(message) {
//   bsAlert
//     .removeClass('d-none')
//     .text(message)

//   setTimeout(() => {
//     bsAlert.addClass('d-none')
//   }, 10000 * 1)
// }

function showAlert(message) {
  Swal.fire({
    position: "top",
    text: message,
    showConfirmButton: false,
    timer: 1500,
    backdrop: false,
    allowOutsideClick: true,
    customClass: {
      container: 'custom-swal-top-margin', 
    }
  });
}

