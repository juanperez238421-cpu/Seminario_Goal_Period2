function addInterviewLinks() {
  document.querySelectorAll(".project-card").forEach((card) => {
    if (card.querySelector("[data-session-link]")) return;
    const reviewLink = card.querySelector('a[href^="project-review.html?student="]');
    if (!reviewLink) return;
    const url = new URL(reviewLink.getAttribute("href"), window.location.href);
    const studentId = url.searchParams.get("student");
    if (!studentId) return;
    const link = document.createElement("a");
    link.className = "button primary";
    link.dataset.sessionLink = "true";
    link.href = `session.html?student=${encodeURIComponent(studentId)}`;
    link.textContent = "Entrevista puntual";
    reviewLink.classList.remove("primary");
    reviewLink.classList.add("secondary");
    reviewLink.parentElement?.insertBefore(link, reviewLink);
  });
}

const grid = document.querySelector("#projectGrid");
if (grid) {
  new MutationObserver(addInterviewLinks).observe(grid, { childList: true, subtree: true });
}
addInterviewLinks();
