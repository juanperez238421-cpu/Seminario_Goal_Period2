const MASTER_REPOSITORY = "juanperez238421-cpu/Seminario_Goal_Period2";

const STORAGE_KEYS = {
  students: "seminario-goal-p2-students-v1",
  reviews: "seminario-goal-p2-project-reviews-v1",
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
  students: [],
  monitor: { students: {} },
  projectIndex: { projects: {} },
  reviews: { preferences: {}, sessions: {} },
  selectedStudentId: null,
  currentPreviewUrl: "",
  currentPreviewMode: "",
  masterCommitSha: "",
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

function encodePath(filePath) {
  return String(filePath)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
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
    if (!response.ok) throw new Error(`Solicitud falló (${response.status})`);
    return await response.json();
  } catch (error) {
    if (fallback !== null) return fallback;
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

function getPreference(studentId) {
  state.reviews.preferences[studentId] ||= { entryPath: "", liveUrl: "" };
  return state.reviews.preferences[studentId];
}

function getSessions(studentId) {
  state.reviews.sessions[studentId] ||= [];
  return state.reviews.sessions[studentId];
}

function latestSession(studentId) {
  return getSessions(studentId)[0] || null;
}

function getSelectedStudent() {
  return state.students.find((student) => student.id === state.selectedStudentId) || null;
}

function getLocalProject(studentId) {
  return state.projectIndex.projects?.[studentId] || null;
}

async function resolveMasterCommitSha() {
  const commits = await fetchJson(
    `https://api.github.com/repos/${MASTER_REPOSITORY}/commits?per_page=1`,
    []
  );
  state.masterCommitSha = Array.isArray(commits) && commits[0]?.sha ? commits[0].sha : "";
}

async function loadData() {
  const [rosterFile, monitor, projectIndex] = await Promise.all([
    fetchJson("data/students.json", { students: [] }),
    fetchJson("data/monitor/latest.json", { students: {} }),
    fetchJson("student-projects/index.json", { projects: {} }),
  ]);

  const savedStudents = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const savedById = new Map(
    Array.isArray(savedStudents) ? savedStudents.map((student) => [student.id, student]) : []
  );

  state.monitor = monitor || { students: {} };
  state.projectIndex = projectIndex || { projects: {} };
  state.students = (rosterFile.students || []).map((base) => {
    const saved = savedById.get(base.id) || {};
    const monitored = state.monitor.students?.[base.id] || {};
    const localProject = state.projectIndex.projects?.[base.id] || {};
    return {
      ...base,
      ...saved,
      repository: normalizeRepository(saved.repository || base.repository || ""),
      latestCommit: localProject.commit || saved.latestCommit || monitored.latestCommit || null,
    };
  });

  loadReviewStorage();
  await resolveMasterCommitSha();
  renderStudentList();

  if (state.selectedStudentId && getSelectedStudent()) {
    selectStudent(state.selectedStudentId, { preservePreview: true });
  } else if (state.students.length) {
    selectStudent(state.students[0].id);
  }
}

function getFilteredStudents() {
  const query = elements.studentSearch.value.trim().toLowerCase();
  const group = elements.groupFilter.value;
  return state.students.filter((student) => {
    const searchable = `${student.name} ${student.group} ${student.project} ${student.repository}`.toLowerCase();
    return (!query || searchable.includes(query)) && (group === "all" || student.group === group);
  });
}

function renderStudentList() {
  const students = getFilteredStudents();
  elements.studentCount.textContent = students.length;
  elements.studentEmptyState.hidden = students.length > 0;
  elements.studentList.innerHTML = students.map((student) => {
    const last = latestSession(student.id);
    const selected = student.id === state.selectedStudentId;
    const localProject = getLocalProject(student.id);
    const ready = localProject?.status === "ready";
    return `
      <button class="student-item ${selected ? "is-selected" : ""}" type="button" data-student-id="${escapeHtml(student.id)}">
        <div class="student-item-top">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <small>${escapeHtml(student.group)} · N.º ${Number(student.listNumber || 0)}</small>
          </div>
          <span class="repo-indicator ${ready ? "connected" : "pending"}" title="${ready ? "Copia local disponible" : "Copia local pendiente"}"></span>
        </div>
        <p class="student-item-project">${escapeHtml(student.project || "Proyecto por registrar")}</p>
        <span class="review-chip ${ready ? "works" : "blocked"}">${ready ? "Copia local lista" : student.repository ? "Copia local pendiente" : "Repo pendiente"}</span>
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
  const localProject = getLocalProject(student.id);
  if (localProject?.status === "ready") {
    elements.repositoryStateBadge.textContent = "Copia local disponible";
    elements.repositoryStateBadge.className = "badge";
    return;
  }
  if (!student.repository) {
    elements.repositoryStateBadge.textContent = "Repositorio pendiente";
    elements.repositoryStateBadge.className = "badge danger";
    return;
  }
  elements.repositoryStateBadge.textContent = "Copia local pendiente";
  elements.repositoryStateBadge.className = "badge warning";
}

function renderCommitBadge(student) {
  const localProject = getLocalProject(student.id);
  const commit = localProject?.commit || student.latestCommit;
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

function resetPreview(message) {
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

function renderEntryOptions(student, localProject) {
  const files = Array.isArray(localProject?.htmlFiles) ? localProject.htmlFiles : [];
  const preference = getPreference(student.id);
  elements.entryFileSelect.innerHTML = files.length
    ? files.map((filePath) => `
        <option value="${escapeHtml(filePath)}" ${filePath === preference.entryPath ? "selected" : ""}>${escapeHtml(filePath)}</option>
      `).join("")
    : `<option value="">No se encontraron páginas HTML</option>`;

  if (files.length && !files.includes(preference.entryPath)) {
    const defaultEntry = files.includes(localProject.defaultEntry) ? localProject.defaultEntry : files[0];
    elements.entryFileSelect.value = defaultEntry;
  }
  elements.entryFileSelect.disabled = files.length === 0;
  elements.runSelected.disabled = files.length === 0;
}

function selectStudent(studentId, { preservePreview = false } = {}) {
  const student = state.students.find((item) => item.id === studentId);
  if (!student) return;
  state.selectedStudentId = studentId;
  renderStudentList();

  const localProject = getLocalProject(student.id);
  const commit = localProject?.commit || student.latestCommit;
  elements.selectedStudentName.textContent = student.name;
  elements.selectedStudentMeta.textContent = `${student.group} · N.º ${student.listNumber} · ${student.goal || "Meta por definir"}`;
  elements.repositoryLabel.textContent = student.repository || "Pendiente";
  elements.commitLabel.textContent = commit?.sha ? shortSha(commit.sha) : "Sin consultar";
  elements.projectLabel.textContent = student.project || "Proyecto por registrar";
  renderRepositoryBadge(student);
  renderCommitBadge(student);

  const preference = getPreference(student.id);
  elements.liveUrlInput.value = preference.liveUrl || "";
  elements.runLiveUrl.disabled = !preference.liveUrl;
  elements.detectAndRun.disabled = localProject?.status !== "ready";
  elements.detectAndRun.textContent = localProject?.status === "ready" ? "Abrir copia local" : "Copia local pendiente";
  renderEntryOptions(student, localProject);

  elements.openRepositoryLink.hidden = !student.repository;
  elements.openRepositoryLink.href = student.repository ? `https://github.com/${student.repository}` : "#";
  elements.openCommitLink.hidden = !commit?.url;
  elements.openCommitLink.href = commit?.url || "#";

  setReviewControlsEnabled(true);
  renderReviewForm(student);

  if (!preservePreview) {
    resetPreview(
      localProject?.status === "ready"
        ? `La copia central contiene ${localProject.filesCount || 0} archivos y ${localProject.htmlFiles?.length || 0} página(s) HTML del commit ${shortSha(commit?.sha)}.`
        : student.repository
          ? "El repositorio está vinculado, pero la automatización todavía no ha generado su copia local."
          : "Primero vincula el repositorio en la página maestra."
    );
  }
}

function buildLocalPreviewUrl(student, entryPath) {
  const relativePath = `student-projects/${encodeURIComponent(student.id)}/current/${encodePath(entryPath)}`;
  if (state.masterCommitSha) {
    return `https://cdn.jsdelivr.net/gh/${MASTER_REPOSITORY}@${state.masterCommitSha}/${relativePath}`;
  }
  return new URL(relativePath, window.location.href).href;
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
    mode === "local"
      ? "allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads"
      : "allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads"
  );
  elements.projectFrame.src = url;
  elements.previewSourceLabel.textContent = label;
  elements.openPreviewLink.href = url;
  elements.openPreviewLink.hidden = false;
  elements.reloadPreview.disabled = false;
}

function runSelectedLocalProject() {
  const student = getSelectedStudent();
  const localProject = student ? getLocalProject(student.id) : null;
  const entryPath = elements.entryFileSelect.value;
  if (!student || localProject?.status !== "ready" || !entryPath) return;

  const preference = getPreference(student.id);
  preference.entryPath = entryPath;
  saveReviewStorage();
  const commit = localProject.commit || student.latestCommit;
  const url = buildLocalPreviewUrl(student, entryPath);
  launchPreview(url, {
    mode: "local",
    label: `Copia central · ${shortSha(commit?.sha)} · ${entryPath}`,
  });
}

function openLocalProject() {
  const student = getSelectedStudent();
  const localProject = student ? getLocalProject(student.id) : null;
  if (!student || localProject?.status !== "ready") {
    showToast("La copia local todavía no está disponible para este estudiante.");
    return;
  }
  renderEntryOptions(student, localProject);
  runSelectedLocalProject();
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

function collectReviewSession(student) {
  const localProject = getLocalProject(student.id);
  const commit = localProject?.commit || student.latestCommit || null;
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

  const localProject = getLocalProject(student.id);
  const summary = [
    `[Revisión ${formatDate(new Date().toISOString())}]`,
    `Ejecución: ${EXECUTION_LABELS[elements.executionStatus.value]}.`,
    localProject?.commit?.sha ? `SHA local: ${shortSha(localProject.commit.sha)}.` : "",
    elements.entryFileSelect.value ? `Entrada: ${elements.entryFileSelect.value}.` : "",
    elements.blockerInput.value.trim() ? `Bloqueador: ${elements.blockerInput.value.trim()}.` : "",
    elements.reviewNotes.value.trim(),
  ].filter(Boolean).join(" ");

  target.notes = target.notes ? `${target.notes}\n\n${summary}` : summary;
  target.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(baseStudents));
  elements.localStatus.textContent = `Evidencia enviada a la ficha maestra: ${formatDate(target.updatedAt)}`;
  showToast("Evidencia transferida a la página maestra.");
}

function bindEvents() {
  elements.refreshData.addEventListener("click", async () => {
    await loadData();
    showToast("Copias locales, commits y revisiones actualizados.");
  });
  elements.studentSearch.addEventListener("input", renderStudentList);
  elements.groupFilter.addEventListener("change", renderStudentList);
  elements.studentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-student-id]");
    if (button) selectStudent(button.dataset.studentId);
  });
  elements.detectAndRun.addEventListener("click", openLocalProject);
  elements.runSelected.addEventListener("click", runSelectedLocalProject);
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
  resetPreview("No fue posible cargar el listado o el índice de copias locales.");
  setRunnerState("error", "Error de inicio");
  showToast("Error al iniciar el laboratorio de revisión.");
});
