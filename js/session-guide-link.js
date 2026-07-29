let guideIndex = { students: [] };

async function loadGuideIndex() {
  try {
    const response = await fetch(`guides/index.json?v=${Date.now()}`, { cache: "no-store" });
    if (response.ok) guideIndex = await response.json();
  } catch (error) {
    console.warn("No se pudo cargar el indice de guias puntuales", error);
  }
  updateGuideLink();
}

function selectedStudentId() {
  return document.querySelector(".student-item.is-selected")?.dataset.studentId || "";
}

function updateGuideLink() {
  const studentId = selectedStudentId();
  const guide = guideIndex.students?.find((item) => item.id === studentId);
  const link = document.querySelector("#openGuideButton");
  if (!link || !guide) return;
  const target = guide.sessionPdf || guide.pdf;
  if (!target) return;
  link.href = target;
  link.hidden = false;
  link.textContent = guide.sessionPdf ? "Ficha puntual PDF" : "Guia PDF";
}

const list = document.querySelector("#studentList");
if (list) new MutationObserver(updateGuideLink).observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-student-id]")) window.setTimeout(updateGuideLink, 80);
});
loadGuideIndex();
