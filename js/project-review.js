const STORAGE_KEYS = {
  students: "seminario-goal-p2-students-v1",
  reviews: "seminario-goal-p2-project-reviews-v1",
};

const ENTRY_HINTS = {
  "jrod917/Carrito": ["Carrito/indexCarrito.html", "indexCarrito.html"],
  "jp0705git/SeminarioProgramacion2": ["delivery.html", "Formulario.html", "index.html"],
  "pablitojarita2008-oss/pablitoSeminario": ["mi formulario/0/.rt/primera.html", "primera.html"],
  "Pedropae07/practice_seminario": ["09-04-26/Practica 2 Paginas/primera.html", "primera.html"],
};

const EXECUTION_LABELS = {
  "not-tested": "No probado",
  works: "Funciona",
  partial: "Funciona parcialmente",
  fails: "No ejecuta",
  blocked: "Bloqueado por configuración",
};

const elements = {
  refreshData: document.querySelector("#refreshDataButton"),
  studentSearch: document.querySelector("#studentSearch"),
  groupFilter: document.querySelector("#groupFilter"),
  studentList: document.querySelector("#studentList"),
  studentCount: document.querySelector("#studentCount"),
  studentEmptyState: document.querySelector("#studentEmptyState"),
  selectedStudentName: document.querySelector("#selectedStudentName"),
  selectedStudentMeta: document.querySelector("#selectedStudentMeta"),
  repositoryStateBadge: document.querySelector("#repositoryStateBadge"),
  commitStateBadge: document.querySelector("#commitStateBadge"),
  repositoryLabel: document.querySelector("#repositoryLabel"),
  commitLabel: document.querySelector("#commitLabel"),
  projectLabel: document.querySelector("#projectLabel"),
  runnerState: document.querySelector("#runnerState"),
  entryFileSelect: document.querySelector("#entryFileSelect"),
  liveUrlInput: document.querySelector("#liveUrlInput"),
  detectAndRun: document.querySelector("#detectAndRunButton"),
  runSelected: document.querySelector("#runSelectedButton"),
  runLiveUrl: document.querySelector("#runLiveUrlButton"),
  reloadPreview: document.querySelector("#reloadPreviewButton"),
  previewSourceLabel: document.querySelector("#previewSourceLabel"),
  openRepositoryLink: document.querySelector("#openRepositoryLink"),
  openCommitLink: document.querySelector("#openCommitLink"),
  openPreviewLink: document.querySelector("#openPreviewLink"),
  previewPlaceholder: document.querySelector("#previewPlaceholder"),
  projectFrame: document.querySelector("#projectFrame"),
  executionStatus: document.querySelector("#executionStatus"),
  checkLoads: document.querySelector("#checkLoads"),
  checkInterface: document.querySelector("#checkInterface"),
  checkFlow: document.querySelector("#checkFlow"),
  checkErrors: document.querySelector("#checkErrors"),
  checkExplains: document.querySelector("#checkExplains"),
  checkLiveChange: document.querySelector("#checkLiveChange"),
  blockerInput: document.querySelector("#blockerInput"),
  reviewNotes: document.querySelector("#reviewNotes"),
  lastReviewLabel: document.querySelector("#lastReviewLabel"),
  saveReview: document.querySelector("#saveReviewButton"),
  copyToEvaluation: document.querySelector("#copyToEvaluationButton"),
  reviewHistory: document.querySelector("#reviewHistory"),
  localStatus: document.querySelector("#localStatus"),
  toast: document.querySelector("#toast"),
};

const state = {
  roster: [],
  students: [],
  monitor: { students: {} },
  reviews: { preferences: {}, sessions: {} },
  selectedStudentId: null,
  htmlFiles: new Map(),
  repositoryCache: new Map(),
  currentPreviewUrl: "",
  currentPreviewMode: "",
};

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortSha(sha = "") {
  return sha ? sha.slice(0, 7) : "—";
}

function normalizeRepository(value = "") {
  return String(value)
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3600);
}

function setRunnerState(status, text) {
  elements.runnerState.dataset.state = status;
  elements.runnerState.querySelector("strong").textContent = text;
}

async function fetchJson(url, fallback = null) {
  try {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}v=${Date.now()}`, {
      cache: "no-store",
      headers: url.startsWith("https://api.github.com/")
        ? { Accept: "application/vnd.github+json" }
        : undefined,
    });
    if (!response.ok) {
      if (response.status === 403) throw new Error("Límite temporal de GitHub alcanzado");
      if (response.status === 404) throw new Error("Repositorio o archivo no encontrado");
      throw new Error(`Solicitud falló (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    if (fallback !== null) {
      console.warn(url, error);
      return fallback;
    }
    throw error;
  }
}

function loadReviewStorage() {
  const saved = safeJsonParse(localStorage.getItem(STORAGE_KEYS.reviews), null);
  state.reviews = saved && typeof saved === "object"
    ? {
        preferences: saved.preferences || {},
        sessions: saved.sessions || {},
      }
    : { preferences: {}, sessions: {} };
}

function saveReviewStorage() {
  localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(state.reviews));
  elements.localStatus.textContent = `Revisión guardada: ${formatDate(new Date().toISOString())}`;
}

async function loadData() {
  const [rosterFile, monitor] = await Promise.all([
    fetchJson("data/students.json", { students: [] }),
    fetchJson("data/monitor/latest.json", { students: {} }),
  ]);

  state.roster = Array.isArray(rosterFile.students) ? rosterFile.students : [];
  const savedStudents = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const savedById = new Map(
    Array.isArray(savedStudents) ? savedStudents.map((student) => [student.id, student]) : []
  );

  state.monitor = monitor || { students: {} };
  state.students = state.roster.map((base) => {
    const saved = savedById.get(base.id) || {};
    const monitored = state.monitor.students?.[base.id] || {};
    return {
      ...base,
      ...saved,
      repository: normalizeRepository(saved.repository || base.repository || ""),
      latestCommit: saved.latestCommit || monitored.latestCommit || base.latestCommit || null,
    };
  });

  loadReviewStorage();
  renderStudentList();

  if (state.selectedStudentId && getSelectedStudent()) {
    selectStudent(state.selectedStudentId, { preservePreview: true });
  } else if (state.students.length) {
    selectStudent(state.students[0].id);
  }
}

function getSelectedStudent() {
  return state.students.find((student) => student.id === state.selectedStudentId) || null;
}

function getPreference(studentId) {
  state.reviews.preferences[studentId] ||= { entryPath: "", liveUrl: "" };
  return state.reviews.preferences[studentId];
}

function getSessions(studentId) {
  state.reviews.sessions[studentId] ||= [];
  return state.reviews.sessions[studentId];
}

function getFilteredStudents() {
  const query = elements.studentSearch.value.trim().toLowerCase();
  const group = elements.groupFilter.value;
  return state.students.filter((student) => {
    const searchable = `${student.name} ${student.group} ${student.project} ${student.repository}`.toLowerCase();
    return (!query || searchable.includes(query)) && (group === "all" || student.group === group);
  });
}

function latestSession(studentId) {
  return getSessions(studentId)[0] || null;
}

function renderStudentList() {
  const students = getFilteredStudents();
  elements.studentCount.textContent = students.length;
  elements.studentEmptyState.hidden = students.length > 0;
  elements.studentList.innerHTML = students.map((student) => {
    const last = latestSession(student.id);
    const selected = student.id === state.selectedStudentId;
    const repositoryClass = student.repository ? "connected" : "pending";
    return `
      <button class="student-item ${selected ? "is-selected" : ""}" type="button" data-student-id="${escapeHtml(student.id)}">
        <div class="student-item-top">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <small>${escapeHtml(student.group)} · N.º ${Number(student.listNumber || 0)}</small>
          </div>
          <span class="repo-indicator ${repositoryClass}" title="${student.repository ? "Repositorio vinculado" : "Repositorio pendiente"}"></span>
        </div>
        <p class="student-item-project">${escapeHtml(student.project || "Proyecto por registrar")}</p>
        ${last ? `<span class="review-chip ${escapeHtml(last.executionStatus)}">${escapeHtml(EXECUTION_LABELS[last.executionStatus] || "Revisado")}</span>` : ""}
      </button>
    `;
  }).join("");
}

function setReviewControlsEnabled(enabled) {
  [
    elements.executionStatus,
    elements.checkLoads,
    elements.checkInterface,
    elements.checkFlow,
    elements.checkErrors,
    elements.checkExplains,
    elements.checkLiveChange,
    elements.blockerInput,
    elements.reviewNotes,
    elements.saveReview,
    elements.copyToEvaluation,
  ].forEach((control) => { control.disabled = !enabled; });
}

function renderRepositoryBadge(student) {
  if (!student.repository) {
    elements.repositoryStateBadge.textContent = "Repositorio pendiente";
    elements.repositoryStateBadge.className = "badge danger";
    return;
  }
  const status = student.repositoryStatus || "provisional";
  elements.repositoryStateBadge.textContent = status === "confirmed" ? "Repositorio confirmado" : "Repositorio provisional";
  elements.repositoryStateBadge.className = status === "confirmed" ? "badge" : "badge warning";
}

function renderCommitBadge(student) {
  const commit = student.latestCommit;
  if (!commit?.sha) {
    elements.commitStateBadge.textContent = "Commit sin consultar";
    elements.commitStateBadge.className = "badge neutral";
    return;
  }
  const reviewed = student.lastReviewedSha && student.lastReviewedSha === commit.sha;
  elements.commitStateBadge.textContent = reviewed ? "SHA revisado" : "SHA por revisar";
  elements.commitStateBadge.className = reviewed ? "badge" : "badge warning";
}

function renderReviewForm(student) {
  const last = latestSession(student.id);
  elements.executionStatus.value = last?.executionStatus || "not-tested";
  elements.checkLoads.checked = Boolean(last?.checks?.loads);
  elements.checkInterface.checked = Boolean(last?.checks?.interface);
  elements.checkFlow.checked = Boolean(last?.checks?.flow);
  elements.checkErrors.checked = Boolean(last?.checks?.errors);
  elements.checkExplains.checked = Boolean(last?.checks?.explains);
  elements.checkLiveChange.checked = Boolean(last?.checks?.liveChange);
  elements.blockerInput.value = last?.blocker || "";
  elements.reviewNotes.value = last?.notes || "";
  elements.lastReviewLabel.textContent = last ? formatDate(last.reviewedAt) : "Sin registro";
  renderReviewHistory(student.id);
}

function renderReviewHistory(studentId) {
  const sessions = getSessions(studentId);
  elements.reviewHistory.innerHTML = sessions.length
    ? sessions.slice(0, 12).map((session) => `
        <article class="history-entry">
          <div class="history-entry-top">
            <strong>${escapeHtml(EXECUTION_LABELS[session.executionStatus] || "Revisión")}</strong>
            <time>${escapeHtml(formatDate(session.reviewedAt))}</time>
          </div>
          <code>${escapeHtml(shortSha(session.commitSha))}</code>
          <p>${escapeHtml(session.entryPath || session.previewMode || "Sin página registrada")}</p>
          ${session.blocker ? `<p><strong>Bloqueador:</strong> ${escapeHtml(session.blocker)}</p>` : ""}
        </article>
      `).join("")
    : `<p class="empty-state small">Aún no hay revisiones guardadas.</p>`;
}

function resetPreview(message = "Selecciona una página para ejecutar el proyecto.") {
  state.currentPreviewUrl = "";
  state.currentPreviewMode = "";
  elements.projectFrame.hidden = true;
  elements.projectFrame.removeAttribute("src");
  elements.previewPlaceholder.hidden = false;
  elements.previewPlaceholder.innerHTML = `
    <span class="placeholder-icon" aria-hidden="true">▶</span>
    <h3>Proyecto listo para revisar</h3>
    <p>${escapeHtml(message)}</p>
  `;
  elements.previewSourceLabel.textContent = "Ninguna";
  elements.openPreviewLink.hidden = true;
  elements.reloadPreview.disabled = true;
  setRunnerState("idle", "Sin ejecutar");
}

function selectStudent(studentId, { preservePreview = false } = {}) {
  const student = state.students.find((item) => item.id === studentId);
  if (!student) return;
  state.selectedStudentId = studentId;
  renderStudentList();

  elements.selectedStudentName.textContent = student.name;
  elements.selectedStudentMeta.textContent = `${student.group} · N.º ${student.listNumber} · ${student.goal || "Meta por definir"}`;
  elements.repositoryLabel.textContent = student.repository || "Pendiente";
  elements.commitLabel.textContent = student.latestCommit?.sha ? shortSha(student.latestCommit.sha) : "Sin consultar";
  elements.projectLabel.textContent = student.project || "Proyecto por registrar";
  renderRepositoryBadge(student);
  renderCommitBadge(student);

  const preference = getPreference(student.id);
  elements.liveUrlInput.value = preference.liveUrl || "";
  elements.runLiveUrl.disabled = !preference.liveUrl;
  elements.detectAndRun.disabled = !student.repository;
  elements.runSelected.disabled = true;
  elements.entryFileSelect.disabled = true;
  elements.entryFileSelect.innerHTML = `<option value="">Detecta primero las páginas HTML</option>`;

  elements.openRepositoryLink.hidden = !student.repository;
  elements.openRepositoryLink.href = student.repository ? `https://github.com/${student.repository}` : "#";
  elements.openCommitLink.hidden = !student.latestCommit?.url;
  elements.openCommitLink.href = student.latestCommit?.url || "#";

  setReviewControlsEnabled(true);
  renderReviewForm(student);

  const cachedFiles = state.htmlFiles.get(student.id);
  if (cachedFiles?.length) renderEntryOptions(student, cachedFiles);
  if (!preservePreview) resetPreview(student.repository
    ? "Pulsa Detectar y ejecutar para revisar el estado actual del repositorio."
    : "Primero vincula y confirma el repositorio en la página maestra.");
}

async function getRepositoryMetadata(repository) {
  if (state.repositoryCache.has(repository)) return state.repositoryCache.get(repository);
  const metadata = await fetchJson(`https://api.github.com/repos/${repository}`);
  state.repositoryCache.set(repository, metadata);
  return metadata;
}

async function resolveLatestCommit(student) {
  if (student.latestCommit?.sha) return student.latestCommit;
  const repository = normalizeRepository(student.repository);
  const commits = await fetchJson(`https://api.github.com/repos/${repository}/commits?per_page=1`);
  const commit = Array.isArray(commits) ? commits[0] : null;
  if (!commit?.sha) throw new Error("El repositorio no tiene commits");
  student.latestCommit = {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: String(commit.commit?.message || "Commit sin mensaje").split("\n")[0],
    author: commit.author?.login || commit.commit?.author?.name || "Autor no identificado",
    date: commit.commit?.committer?.date || commit.commit?.author?.date || null,
    url: commit.html_url,
  };
  elements.commitLabel.textContent = shortSha(commit.sha);
  elements.openCommitLink.hidden = false;
  elements.openCommitLink.href = commit.html_url;
  renderCommitBadge(student);
  return student.latestCommit;
}

function scoreHtmlPath(path, repository, preferencePath) {
  const normalized = path.toLowerCase();
  if (preferencePath && path === preferencePath) return -1000;
  const hints = ENTRY_HINTS[repository] || [];
  const hintIndex = hints.findIndex((hint) => hint.toLowerCase() === normalized);
  if (hintIndex >= 0) return -900 + hintIndex;
  if (normalized === "index.html") return -800;
  if (normalized.endsWith("/index.html")) return -700 + path.split("/").length;
  if (normalized.includes("carrito") && normalized.endsWith(".html")) return -600;
  if (normalized.includes("delivery") && normalized.endsWith(".html")) return -550;
  if (normalized.includes("primera") && normalized.endsWith(".html")) return -500;
  return path.split("/").length * 20 + path.length;
}

async function discoverHtmlFiles(student, commit) {
  const repository = normalizeRepository(student.repository);
  if (!repository.includes("/")) throw new Error("Repositorio inválido");

  const commitData = await fetchJson(`https://api.github.com/repos/${repository}/commits/${commit.sha}`);
  const treeSha = commitData?.commit?.tree?.sha;
  if (!treeSha) throw new Error("No fue posible resolver el árbol del commit");

  const treeData = await fetchJson(`https://api.github.com/repos/${repository}/git/trees/${treeSha}?recursive=1`);
  const files = Array.isArray(treeData?.tree)
    ? treeData.tree
        .filter((item) => item.type === "blob" && /\.html?$/i.test(item.path || ""))
        .map((item) => item.path)
    : [];

  if (!files.length) throw new Error("No se encontraron páginas HTML en este commit");
  const preference = getPreference(student.id);
  return files.sort((a, b) =>
    scoreHtmlPath(a, repository, preference.entryPath) - scoreHtmlPath(b, repository, preference.entryPath) || a.localeCompare(b)
  );
}

function renderEntryOptions(student, files) {
  const preference = getPreference(student.id);
  elements.entryFileSelect.innerHTML = files.map((path) =>
    `<option value="${escapeHtml(path)}" ${path === preference.entryPath ? "selected" : ""}>${escapeHtml(path)}</option>`
  ).join("");
  if (!files.includes(preference.entryPath)) elements.entryFileSelect.selectedIndex = 0;
  elements.entryFileSelect.disabled = false;
  elements.runSelected.disabled = false;
}

function encodePath(path) {
  return String(path).split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function buildCommitPreviewUrl(repository, sha, entryPath) {
  return `https://cdn.jsdelivr.net/gh/${repository}@${sha}/${encodePath(entryPath)}`;
}

function launchPreview(url, { mode, label }) {
  if (!url) return;
  state.currentPreviewUrl = url;
  state.currentPreviewMode = mode;
  setRunnerState("loading", "Cargando proyecto");
  elements.previewPlaceholder.hidden = true;
  elements.projectFrame.hidden = false;
  elements.projectFrame.setAttribute(
    "sandbox",
    mode === "commit"
      ? "allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads"
      : "allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads"
  );
  elements.projectFrame.src = url;
  elements.previewSourceLabel.textContent = label;
  elements.openPreviewLink.href = url;
  elements.openPreviewLink.hidden = false;
  elements.reloadPreview.disabled = false;
}

async function detectAndRunProject() {
  const student = getSelectedStudent();
  if (!student?.repository) {
    showToast("Este estudiante no tiene repositorio vinculado.");
    return;
  }

  elements.detectAndRun.disabled = true;
  setRunnerState("loading", "Analizando repositorio");
  try {
    await getRepositoryMetadata(student.repository);
    const commit = await resolveLatestCommit(student);
    const files = await discoverHtmlFiles(student, commit);
    state.htmlFiles.set(student.id, files);
    renderEntryOptions(student, files);
    const selectedPath = elements.entryFileSelect.value;
    getPreference(student.id).entryPath = selectedPath;
    saveReviewStorage();
    runSelectedEntry();
    showToast(`${files.length} página(s) HTML detectadas para ${student.name}.`);
  } catch (error) {
    showPreviewError(error.message);
    showToast(`${student.name}: ${error.message}.`);
  } finally {
    elements.detectAndRun.disabled = false;
  }
}

async function runSelectedEntry() {
  const student = getSelectedStudent();
  const entryPath = elements.entryFileSelect.value;
  if (!student?.repository || !entryPath) return;
  try {
    const commit = await resolveLatestCommit(student);
    const preference = getPreference(student.id);
    preference.entryPath = entryPath;
    saveReviewStorage();
    const url = buildCommitPreviewUrl(student.repository, commit.sha, entryPath);
    launchPreview(url, {
      mode: "commit",
      label: `Commit ${shortSha(commit.sha)} · ${entryPath}`,
    });
  } catch (error) {
    showPreviewError(error.message);
    showToast(error.message);
  }
}

function runLiveUrl() {
  const student = getSelectedStudent();
  if (!student) return;
  const raw = elements.liveUrlInput.value.trim();
  let url;
  try {
    url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch {
    showToast("Escribe una URL pública válida que comience con http o https.");
    return;
  }
  const preference = getPreference(student.id);
  preference.liveUrl = url.href;
  saveReviewStorage();
  elements.runLiveUrl.disabled = false;
  launchPreview(url.href, {
    mode: "live",
    label: "URL publicada · vista aislada",
  });
}

function reloadPreview() {
  if (!state.currentPreviewUrl) return;
  const current = state.currentPreviewUrl;
  elements.projectFrame.removeAttribute("src");
  window.setTimeout(() => {
    setRunnerState("loading", "Recargando proyecto");
    elements.projectFrame.src = current;
  }, 80);
}

function showPreviewError(message) {
  state.currentPreviewUrl = "";
  state.currentPreviewMode = "";
  elements.projectFrame.hidden = true;
  elements.projectFrame.removeAttribute("src");
  elements.previewPlaceholder.hidden = false;
  elements.previewPlaceholder.innerHTML = `
    <span class="placeholder-icon" aria-hidden="true">!</span>
    <h3>No fue posible ejecutar la vista</h3>
    <p>${escapeHtml(message)}</p>
  `;
  elements.previewSourceLabel.textContent = "Error de carga";
  elements.openPreviewLink.hidden = true;
  elements.reloadPreview.disabled = true;
  setRunnerState("error", "Revisión bloqueada");
}

function collectReviewSession(student) {
  const commit = student.latestCommit || null;
  return {
    id: `${student.id}-${Date.now()}`,
    studentId: student.id,
    reviewedAt: new Date().toISOString(),
    repository: student.repository,
    commitSha: commit?.sha || null,
    entryPath: elements.entryFileSelect.value || "",
    previewMode: state.currentPreviewMode || "none",
    previewUrl: state.currentPreviewUrl || "",
    executionStatus: elements.executionStatus.value,
    checks: {
      loads: elements.checkLoads.checked,
      interface: elements.checkInterface.checked,
      flow: elements.checkFlow.checked,
      errors: elements.checkErrors.checked,
      explains: elements.checkExplains.checked,
      liveChange: elements.checkLiveChange.checked,
    },
    blocker: elements.blockerInput.value.trim(),
    notes: elements.reviewNotes.value.trim(),
  };
}

function saveReviewSession() {
  const student = getSelectedStudent();
  if (!student) return;
  const session = collectReviewSession(student);
  const sessions = getSessions(student.id);
  sessions.unshift(session);
  state.reviews.sessions[student.id] = sessions.slice(0, 50);
  const preference = getPreference(student.id);
  preference.entryPath = elements.entryFileSelect.value || preference.entryPath || "";
  preference.liveUrl = elements.liveUrlInput.value.trim();
  saveReviewStorage();
  renderReviewForm(student);
  renderStudentList();
  showToast(`Revisión de ${student.name} guardada.`);
}

function copyReviewToEvaluation() {
  const student = getSelectedStudent();
  if (!student) return;
  const savedStudents = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const baseStudents = Array.isArray(savedStudents) && savedStudents.length
    ? savedStudents
    : state.students.map((item) => ({ ...item }));
  const index = baseStudents.findIndex((item) => item.id === student.id);
  if (index < 0) return;

  const target = baseStudents[index];
  target.evidence ||= {};
  target.evidence.runs = ["works", "partial"].includes(elements.executionStatus.value) && elements.checkLoads.checked;
  target.evidence.explains = elements.checkExplains.checked;
  target.evidence.liveChange = elements.checkLiveChange.checked;
  target.evidence.authorship = Boolean(target.evidence.authorship);

  const summary = [
    `[Revisión ${formatDate(new Date().toISOString())}]`,
    `Ejecución: ${EXECUTION_LABELS[elements.executionStatus.value]}.`,
    elements.entryFileSelect.value ? `Entrada: ${elements.entryFileSelect.value}.` : "",
    elements.blockerInput.value.trim() ? `Bloqueador: ${elements.blockerInput.value.trim()}.` : "",
    elements.reviewNotes.value.trim(),
  ].filter(Boolean).join(" ");
  target.notes = target.notes ? `${target.notes}\n\n${summary}` : summary;
  target.updatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(baseStudents));
  elements.localStatus.textContent = `Evidencia enviada a la ficha maestra: ${formatDate(target.updatedAt)}`;
  showToast("Evidencia transferida. Abre la página maestra para completar la rúbrica.");
}

function bindEvents() {
  elements.refreshData.addEventListener("click", async () => {
    await loadData();
    showToast("Listado, commits y revisiones actualizados.");
  });
  elements.studentSearch.addEventListener("input", renderStudentList);
  elements.groupFilter.addEventListener("change", renderStudentList);
  elements.studentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-student-id]");
    if (button) selectStudent(button.dataset.studentId);
  });
  elements.detectAndRun.addEventListener("click", detectAndRunProject);
  elements.runSelected.addEventListener("click", runSelectedEntry);
  elements.runLiveUrl.addEventListener("click", runLiveUrl);
  elements.reloadPreview.addEventListener("click", reloadPreview);
  elements.entryFileSelect.addEventListener("change", () => {
    const student = getSelectedStudent();
    if (!student) return;
    getPreference(student.id).entryPath = elements.entryFileSelect.value;
    saveReviewStorage();
    elements.runSelected.disabled = !elements.entryFileSelect.value;
  });
  elements.liveUrlInput.addEventListener("input", () => {
    elements.runLiveUrl.disabled = !elements.liveUrlInput.value.trim();
  });
  elements.projectFrame.addEventListener("load", () => {
    if (!state.currentPreviewUrl) return;
    setRunnerState("ready", "Proyecto cargado");
  });
  elements.saveReview.addEventListener("click", saveReviewSession);
  elements.copyToEvaluation.addEventListener("click", copyReviewToEvaluation);
}

bindEvents();
loadData().catch((error) => {
  console.error(error);
  showPreviewError("No fue posible cargar el listado del curso.");
  showToast("Error al iniciar el laboratorio de revisión.");
});
