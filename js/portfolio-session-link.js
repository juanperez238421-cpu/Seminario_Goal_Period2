function updateReferenceMessage() {
  const description = document.querySelector("#benchmarkDescription");
  if (!description || !description.textContent.trim() || description.dataset.completionMessage === "true") return;
  const current = description.textContent.trim();
  if (/No existe|Cargando/i.test(current)) return;
  description.textContent = `${current.split(". Se usa")[0]}. Se toma como base del estado finalizado cuando el flujo funciona correctamente y el concepto aplicado es pertinente; los demas proyectos deben demostrar las mismas habilidades, no copiar la misma tematica.`;
  description.dataset.completionMessage = "true";
}

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
  updateReferenceMessage();
}

const grid = document.querySelector("#projectGrid");
if (grid) {
  new MutationObserver(addInterviewLinks).observe(grid, { childList: true, subtree: true });
}
const benchmark = document.querySelector("#benchmarkDescription");
if (benchmark) {
  new MutationObserver(updateReferenceMessage).observe(benchmark, { childList: true, characterData: true, subtree: true });
}
addInterviewLinks();
