import "./project-review-local.js";

const params = new URLSearchParams(window.location.search);
const requestedStudentId = params.get("student");
const requestedEntry = params.get("entry");

if (requestedStudentId) {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const button = document.querySelector(`[data-student-id="${CSS.escape(requestedStudentId)}"]`);
    if (button) {
      button.click();
      window.clearInterval(timer);
      if (requestedEntry) {
        let entryAttempts = 0;
        const entryTimer = window.setInterval(() => {
          entryAttempts += 1;
          const select = document.querySelector("#entryFileSelect");
          const option = select ? [...select.options].find((item) => item.value === requestedEntry) : null;
          if (select && option) {
            select.value = requestedEntry;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            document.querySelector("#runSelectedButton")?.click();
            window.clearInterval(entryTimer);
          } else if (entryAttempts >= 50) {
            window.clearInterval(entryTimer);
          }
        }, 160);
      }
    } else if (attempts >= 40) {
      window.clearInterval(timer);
    }
  }, 150);
}
