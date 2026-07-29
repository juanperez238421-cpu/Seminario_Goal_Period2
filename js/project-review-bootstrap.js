import "./project-review-local.js";

const requestedStudentId = new URLSearchParams(window.location.search).get("student");

if (requestedStudentId) {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const button = document.querySelector(`[data-student-id="${CSS.escape(requestedStudentId)}"]`);
    if (button) {
      button.click();
      window.clearInterval(timer);
    } else if (attempts >= 40) {
      window.clearInterval(timer);
    }
  }, 150);
}
