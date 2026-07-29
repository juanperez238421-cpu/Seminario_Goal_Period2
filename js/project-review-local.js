const analyticsStylesheet = document.createElement("link");
analyticsStylesheet.rel = "stylesheet";
analyticsStylesheet.href = "css/project-review-v2.css";
document.head.append(analyticsStylesheet);

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

const INDICATOR_LABELS = {
  filesCount: "Archivos",
  htmlFiles: "Páginas HTML",
  cssFiles: "Archivos CSS",
  jsFiles: "Archivos JS",
  functions: "Funciones",
  conditions: "Condiciones",
  loops: "Ciclos",
  domQueries: "Consultas DOM",
  domWrites: "Salidas DOM",
  events: "Eventos",
  storageUses: "Persistencia",
  validationChecks: "Validaciones",
  promptUses: "Usos de prompt",
  cssRules: "Reglas CSS",
  mediaQueries: "Media queries",
  cssVariables: "Variables CSS",
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
  technicalLevelBadge: document.querySelector("#technicalLevelBadge"),
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
  globalBenchmarkName: document.querySelector("#globalBenchmarkName"),
  globalBenchmarkPercent: document.querySelector("#globalBenchmarkPercent"),
  globalBenchmarkProject: document.querySelector("#globalBenchmarkProject"),
  globalBenchmarkDate: document.querySelector("#globalBenchmarkDate"),
  technicalPercent: document.querySelector("#technicalPercent"),
  technicalGrade: document.querySelector("#technicalGrade"),
  technicalStatus: document.querySelector("#technicalStatus"),
  relativePercent: document.querySelector("#relativePercent"),
  relativeProgressBar: document.querySelector("#relativeProgressBar"),
  benchmarkStudentName: document.querySelector("#benchmarkStudentName"),
  benchmarkDescription: document.querySelector("#benchmarkDescription"),
  benchmarkScore: document.querySelector("#benchmarkScore"),
  benchmarkDistance: document.querySelector("#benchmarkDistance"),
  auditedSha: document.querySelector("#auditedSha"),
  progressGauge: document.querySelector("#progressGauge"),
  criteriaCanvas: document.querySelector("#criteriaCanvas"),
  canvasTooltip: document.querySelector("#canvasTooltip"),
  criteriaList: document.querySelector("#criteriaList"),
  auditStrengths: document.querySelector("#auditStrengths"),
  auditMissing: document.querySelector("#auditMissing"),
  auditRisks: document.querySelector("#auditRisks"),
  indicatorGrid: document.querySelector("#indicatorGrid"),
  generateCoach: document.querySelector("#generateCoachButton"),
  copyAudit: document.querySelector("#copyAuditButton"),
  coachPanel: document.querySelector("#coachPanel"),
  coachSummary: document.querySelector("#coachSummary"),
  coachActions: document.querySelector("#coachActions"),
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
  projectIndex: { projects: {}, benchmark: null },
  reviews: { preferences: {}, sessions: {} },
  selectedStudentId: null,
  currentPreviewUrl: "",
  currentPreviewMode: "",
  masterCommitSha: "",
  canvasRegions: [],
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
  }, 3800);
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
    ? { preferences: saved.preferences || {}, sessions: saved.sessions || {} }
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

function getAudit(studentId) {
  return getLocalProject(studentId)?.audit || null;
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
    fetchJson("student-projects/index.json", { projects: {}, benchmark: null }),
  ]);

  const savedStudents = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const savedById = new Map(
    Array.isArray(savedStudents) ? savedStudents.map((student) => [student.id, student]) : []
  );

  state.monitor = monitor || { students: {} };
  state.projectIndex = projectIndex || { projects: {}, benchmark: null };
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
  renderGlobalBenchmark();
  renderStudentList();

  if (state.selectedStudentId && getSelectedStudent()) {
    selectStudent(state.selectedStudentId, { preservePreview: true });
  } else if (state.students.length) {
    const firstReady = state.students.find((student) => getLocalProject(student.id)?.status === "ready");
    selectStudent(firstReady?.id || state.students[0].id);
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

function renderGlobalBenchmark() {
  const benchmark = state.projectIndex.benchmark;
  if (!benchmark) {
    elements.globalBenchmarkName.textContent = "La auditoría automática todavía no ha definido un referente";
    elements.globalBenchmarkPercent.textContent = "—";
    elements.globalBenchmarkProject.textContent = "Pendiente";
    elements.globalBenchmarkDate.textContent = "—";
    return;
  }
  elements.globalBenchmarkName.textContent = `${benchmark.name} · ${benchmark.group}`;
  elements.globalBenchmarkPercent.textContent = `${benchmark.percent}%`;
  elements.globalBenchmarkProject.textContent = benchmark.project || "Proyecto de referencia";
  elements.globalBenchmarkDate.textContent = formatDate(benchmark.generatedAt);
}

function renderStudentList() {
  const students = getFilteredStudents();
  const benchmarkId = state.projectIndex.benchmark?.studentId;
  elements.studentCount.textContent = students.length;
  elements.studentEmptyState.hidden = students.length > 0;
  elements.studentList.innerHTML = students.map((student) => {
    const last = latestSession(student.id);
    const selected = student.id === state.selectedStudentId;
    const localProject = getLocalProject(student.id);
    const audit = localProject?.audit;
    const ready = localProject?.status === "ready";
    const percent = audit?.score?.percent;
    const reference = student.id === benchmarkId;
    return `
      <button class="student-item ${selected ? "is-selected" : ""} ${reference ? "is-reference" : ""}" type="button" data-student-id="${escapeHtml(student.id)}">
        <div class="student-item-top">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <small>${escapeHtml(student.group)} · N.º ${Number(student.listNumber || 0)}</small>
          </div>
          <span class="repo-indicator ${ready ? "connected" : "pending"}" title="${ready ? "Copia local disponible" : "Copia local pendiente"}"></span>
        </div>
        <p class="student-item-project">${escapeHtml(student.project || "Proyecto por registrar")}</p>
        ${reference ? `<span class="reference-mini-badge">Proyecto de referencia</span>` : ""}
        ${Number.isFinite(percent) ? `
          <div class="student-item-progress">
            <div class="student-item-progress-top"><span>Avance técnico</span><strong>${percent}%</strong></div>
            <div class="progress-track"><span style="width:${percent}%"></span></div>
          </div>
        ` : ""}
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

function renderTechnicalLevel(audit) {
  if (!audit?.score) {
    elements.technicalLevelBadge.textContent = "Sin auditoría";
    elements.technicalLevelBadge.className = "badge neutral";
    return;
  }
  elements.technicalLevelBadge.textContent = `${audit.score.statusLabel} · ${audit.score.percent}%`;
  const badgeClass = audit.score.percent >= 70 ? "badge" : audit.score.percent >= 45 ? "badge warning" : "badge danger";
  elements.technicalLevelBadge.className = badgeClass;
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

function renderList(target, values, emptyText) {
  const items = Array.isArray(values) ? values : [];
  target.innerHTML = items.length
    ? items.map((value) => `<li>${escapeHtml(value)}</li>`).join("")
    : `<li>${escapeHtml(emptyText)}</li>`;
}

function drawGauge(percent = 0) {
  const canvas = elements.progressGauge;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(220, Math.round(rect.width || 260));
  const height = 170;
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = 135;
  const radius = Math.min(98, width * 0.39);
  const start = Math.PI;
  const end = Math.PI * 2;
  const valueEnd = start + (end - start) * Math.max(0, Math.min(100, percent)) / 100;

  context.lineCap = "round";
  context.lineWidth = 20;
  context.strokeStyle = "#dce5ee";
  context.beginPath();
  context.arc(centerX, centerY, radius, start, end);
  context.stroke();

  const gradient = context.createLinearGradient(centerX - radius, 0, centerX + radius, 0);
  gradient.addColorStop(0, "#236aa6");
  gradient.addColorStop(0.65, "#2f8fc4");
  gradient.addColorStop(1, percent >= 70 ? "#176b48" : "#a66200");
  context.strokeStyle = gradient;
  context.beginPath();
  context.arc(centerX, centerY, radius, start, valueEnd);
  context.stroke();

  for (let step = 0; step <= 100; step += 25) {
    const angle = start + (end - start) * step / 100;
    const x1 = centerX + Math.cos(angle) * (radius - 16);
    const y1 = centerY + Math.sin(angle) * (radius - 16);
    const x2 = centerX + Math.cos(angle) * (radius - 27);
    const y2 = centerY + Math.sin(angle) * (radius - 27);
    context.strokeStyle = "#9aa9b8";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }
}

function drawCriteriaChart(criteria = [], benchmark = null) {
  const canvas = elements.criteriaCanvas;
  const wrapper = canvas.parentElement;
  const cssWidth = Math.max(720, Math.round(wrapper.clientWidth || 900));
  const rowHeight = 40;
  const cssHeight = Math.max(330, 46 + criteria.length * rowHeight);
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = cssWidth * ratio;
  canvas.height = cssHeight * ratio;
  canvas.style.height = `${cssHeight}px`;
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  context.clearRect(0, 0, cssWidth, cssHeight);
  state.canvasRegions = [];

  const labelWidth = Math.min(235, Math.max(185, cssWidth * 0.25));
  const chartLeft = labelWidth;
  const chartRight = cssWidth - 55;
  const chartWidth = chartRight - chartLeft;
  const top = 38;

  context.font = "600 11px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let tick = 0; tick <= 100; tick += 20) {
    const x = chartLeft + chartWidth * tick / 100;
    context.strokeStyle = tick === 0 ? "#b9c6d3" : "#e4eaf0";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, top - 15);
    context.lineTo(x, top + criteria.length * rowHeight);
    context.stroke();
    context.fillStyle = "#7a8796";
    context.fillText(`${tick}%`, x, 14);
  }

  criteria.forEach((criterion, index) => {
    const y = top + index * rowHeight;
    const currentPercent = criterion.percent || 0;
    const gapItem = criterion.benchmark || null;
    const benchmarkScore = gapItem?.benchmark ?? benchmark?.criteria?.[criterion.id] ?? criterion.score;
    const benchmarkPercent = Math.round((benchmarkScore / 5) * 100);

    if (index % 2 === 0) {
      context.fillStyle = "rgba(246,248,251,0.72)";
      context.fillRect(0, y - 2, cssWidth, rowHeight);
    }

    context.textAlign = "left";
    context.fillStyle = "#233044";
    context.font = "700 11px Inter, system-ui, sans-serif";
    const truncated = criterion.label.length > 31 ? `${criterion.label.slice(0, 29)}…` : criterion.label;
    context.fillText(truncated, 12, y + 13);

    const barY = y + 7;
    const barHeight = 12;
    context.fillStyle = "#e1e8ef";
    context.beginPath();
    context.roundRect(chartLeft, barY, chartWidth, barHeight, 6);
    context.fill();

    const currentWidth = chartWidth * currentPercent / 100;
    const gradient = context.createLinearGradient(chartLeft, 0, chartRight, 0);
    gradient.addColorStop(0, "#236aa6");
    gradient.addColorStop(1, currentPercent >= 70 ? "#278258" : "#3b9ad0");
    context.fillStyle = gradient;
    context.beginPath();
    context.roundRect(chartLeft, barY, Math.max(2, currentWidth), barHeight, 6);
    context.fill();

    const benchmarkX = chartLeft + chartWidth * benchmarkPercent / 100;
    context.strokeStyle = "#68429b";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(benchmarkX, barY - 4);
    context.lineTo(benchmarkX, barY + barHeight + 4);
    context.stroke();

    context.textAlign = "right";
    context.fillStyle = "#102f52";
    context.font = "800 11px Inter, system-ui, sans-serif";
    context.fillText(`${currentPercent}%`, cssWidth - 10, y + 13);

    state.canvasRegions.push({
      x: 0,
      y,
      width: cssWidth,
      height: rowHeight,
      criterion,
      benchmarkPercent,
    });
  });

  context.textAlign = "left";
  context.fillStyle = "#68429b";
  context.font = "700 10px Inter, system-ui, sans-serif";
  context.fillText("│ referencia", chartLeft, cssHeight - 11);
}

function renderCriteriaList(audit) {
  const gaps = new Map((audit?.benchmark?.gaps || []).map((gap) => [gap.id, gap]));
  elements.criteriaList.innerHTML = (audit?.criteria || []).map((criterion) => {
    const gap = gaps.get(criterion.id);
    const benchmarkScore = gap?.benchmark ?? criterion.score;
    return `
      <article class="criterion-row">
        <div><strong>${escapeHtml(criterion.label)}</strong><small>Peso ${criterion.weight}% · referente ${Number(benchmarkScore).toFixed(1)}/5</small></div>
        <div class="progress-track"><span style="width:${criterion.percent}%"></span></div>
        <div class="criterion-values">${criterion.percent}%</div>
      </article>
    `;
  }).join("");
}

function renderIndicators(audit) {
  const indicators = audit?.indicators || {};
  const keys = Object.keys(INDICATOR_LABELS).filter((key) => indicators[key] !== undefined);
  elements.indicatorGrid.innerHTML = keys.map((key) => {
    const rawValue = indicators[key];
    const value = Array.isArray(rawValue) ? rawValue.length : rawValue;
    return `<article class="indicator-card"><span>${escapeHtml(INDICATOR_LABELS[key])}</span><strong>${escapeHtml(value)}</strong></article>`;
  }).join("");
}

function renderCoach(audit, student) {
  if (!audit) {
    elements.coachPanel.hidden = true;
    return;
  }
  const benchmark = audit.benchmark;
  const weakest = [...(audit.criteria || [])].sort((a, b) => a.score - b.score).slice(0, 2);
  const isLeader = benchmark?.leaderStudentId === student.id;
  elements.coachSummary.innerHTML = isLeader
    ? `<strong>${escapeHtml(student.name)}</strong> es el referente técnico actual. La prioridad ya no es acumular ejercicios aislados, sino cerrar el flujo funcional y elevar CSS, responsive, accesibilidad y consistencia visual.`
    : `<strong>${escapeHtml(student.name)}</strong> alcanza ${audit.score.percent}% de evidencia técnica y está a ${benchmark?.distancePoints ?? 0} puntos porcentuales del referente ${escapeHtml(benchmark?.leaderName || "del curso")}. Las brechas principales están en ${weakest.map((item) => escapeHtml(item.label)).join(" y ")}.`;
  const actions = audit.feedback?.nextActions?.length
    ? audit.feedback.nextActions
    : weakest.flatMap((criterion) => criterion.missing || []).slice(0, 5);
  elements.coachActions.innerHTML = actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");
}

function resetAnalytics() {
  elements.technicalPercent.textContent = "—";
  elements.technicalGrade.textContent = "— / 5,0";
  elements.technicalStatus.textContent = "Auditoría pendiente";
  elements.relativePercent.textContent = "—";
  elements.relativeProgressBar.style.width = "0%";
  elements.benchmarkStudentName.textContent = "Proyecto de referencia pendiente";
  elements.benchmarkDescription.textContent = "El monitor debe generar una auditoría técnica antes de mostrar la comparación.";
  elements.benchmarkScore.textContent = "—";
  elements.benchmarkDistance.textContent = "—";
  elements.auditedSha.textContent = "—";
  elements.criteriaList.innerHTML = "";
  elements.indicatorGrid.innerHTML = "";
  renderList(elements.auditStrengths, [], "Sin fortalezas auditadas todavía.");
  renderList(elements.auditMissing, [], "Ejecuta el workflow de monitoreo y auditoría.");
  renderList(elements.auditRisks, [], "Sin riesgos analizados.");
  elements.generateCoach.disabled = true;
  elements.copyAudit.disabled = true;
  elements.coachPanel.hidden = true;
  drawGauge(0);
  drawCriteriaChart([]);
}

function renderAnalytics(student) {
  const localProject = getLocalProject(student.id);
  const audit = localProject?.audit;
  renderTechnicalLevel(audit);
  if (!audit?.score) {
    resetAnalytics();
    return;
  }

  const benchmark = state.projectIndex.benchmark;
  const relative = audit.benchmark?.relativePercent ?? 100;
  elements.technicalPercent.textContent = `${audit.score.percent}%`;
  elements.technicalGrade.textContent = `${Number(audit.score.grade).toFixed(2)} / 5,0`;
  elements.technicalStatus.textContent = `${audit.score.statusLabel} · diagnóstico provisional`;
  elements.relativePercent.textContent = `${relative}%`;
  elements.relativeProgressBar.style.width = `${relative}%`;
  elements.benchmarkStudentName.textContent = audit.benchmark?.leaderName || benchmark?.name || "Proyecto de referencia";
  elements.benchmarkDescription.textContent = audit.benchmark?.leaderStudentId === student.id
    ? "Este proyecto posee actualmente el mayor puntaje técnico automatizado del curso y define la referencia de comparación."
    : `Referencia: ${audit.benchmark?.leaderProject || benchmark?.project || "proyecto líder"}. La comparación usa la misma rúbrica para todos.`;
  elements.benchmarkScore.textContent = `${audit.benchmark?.leaderPercent ?? benchmark?.percent ?? audit.score.percent}%`;
  elements.benchmarkDistance.textContent = audit.benchmark?.distancePoints ? `−${audit.benchmark.distancePoints} pp` : "0 pp";
  elements.auditedSha.textContent = shortSha(audit.commitSha || localProject?.commit?.sha);

  const gapMap = new Map((audit.benchmark?.gaps || []).map((gap) => [gap.id, gap]));
  const criteriaWithBenchmark = (audit.criteria || []).map((criterion) => ({
    ...criterion,
    benchmark: gapMap.get(criterion.id) || null,
  }));
  renderCriteriaList({ ...audit, criteria: criteriaWithBenchmark });
  drawGauge(audit.score.percent);
  drawCriteriaChart(criteriaWithBenchmark, benchmark);
  renderList(elements.auditStrengths, audit.feedback?.strengths, "No se detectaron fortalezas suficientes.");
  renderList(elements.auditMissing, audit.feedback?.missing, "No se detectaron faltantes prioritarios.");
  renderList(elements.auditRisks, audit.feedback?.risks, "No se detectaron riesgos estáticos importantes.");
  renderIndicators(audit);
  renderCoach(audit, student);
  elements.coachPanel.hidden = true;
  elements.generateCoach.disabled = false;
  elements.copyAudit.disabled = false;
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
  renderAnalytics(student);

  const preference = getPreference(student.id);
  elements.liveUrlInput.value = preference.liveUrl || "";
  elements.runLiveUrl.disabled = !preference.liveUrl;
  elements.detectAndRun.disabled = localProject?.status !== "ready";
  elements.detectAndRun.textContent = localProject?.status === "ready" ? "Abrir proyecto real" : "Copia local pendiente";
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

function buildRenderedPreviewUrl(student, entryPath) {
  const relativePath = `student-projects/${encodeURIComponent(student.id)}/current/${encodePath(entryPath)}`;
  if (state.masterCommitSha) {
    return `https://raw.githack.com/${MASTER_REPOSITORY}/${state.masterCommitSha}/${relativePath}`;
  }
  return new URL(relativePath, window.location.href).href;
}

function launchPreview(url, { mode, label }) {
  if (!url) return;
  state.currentPreviewUrl = url;
  state.currentPreviewMode = mode;
  setRunnerState("loading", "Renderizando proyecto");
  elements.previewPlaceholder.hidden = true;
  elements.projectFrame.hidden = false;

  const previewOrigin = new URL(url, window.location.href).origin;
  const crossOrigin = previewOrigin !== window.location.origin;
  const permissions = ["allow-scripts", "allow-forms", "allow-modals", "allow-popups", "allow-popups-to-escape-sandbox", "allow-downloads"];
  if (crossOrigin) permissions.push("allow-same-origin");
  elements.projectFrame.setAttribute("sandbox", permissions.join(" "));
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
  const url = buildRenderedPreviewUrl(student, entryPath);
  launchPreview(url, {
    mode: "rendered-mirror",
    label: `Proyecto renderizado · ${shortSha(commit?.sha)} · ${entryPath}`,
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
  launchPreview(url.href, { mode: "live", label: "URL publicada · vista aislada" });
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
    automaticScore: localProject?.audit?.score || null,
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

function inferMilestonesFromAudit(audit, current = {}) {
  const scores = new Map((audit?.criteria || []).map((criterion) => [criterion.id, criterion.score]));
  return {
    ...current,
    html: (scores.get("html") || 0) >= 2.5,
    css: (scores.get("css") || 0) >= 2.5,
    javascript: (scores.get("javascript") || 0) >= 2.5,
    events: (scores.get("domEvents") || 0) >= 2.5,
    dom: (scores.get("domEvents") || 0) >= 3,
    validation: (scores.get("validation") || 0) >= 2.5,
    processing: (scores.get("javascript") || 0) >= 3,
    storage: (scores.get("storage") || 0) >= 2.5,
    integration: (scores.get("integration") || 0) >= 3,
    readme: (scores.get("gitDocs") || 0) >= 2.5,
    commits: (scores.get("gitDocs") || 0) >= 3,
  };
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
  const localProject = getLocalProject(student.id);
  const audit = localProject?.audit;
  target.evidence ||= {};
  target.evidence.runs = ["works", "partial"].includes(elements.executionStatus.value) && elements.checkLoads.checked;
  target.evidence.explains = elements.checkExplains.checked;
  target.evidence.liveChange = elements.checkLiveChange.checked;
  target.evidence.authorship = Boolean(target.evidence.authorship);

  if (audit?.criteria) {
    target.rubric ||= {};
    for (const criterion of audit.criteria) target.rubric[criterion.id] = criterion.score;
    target.milestones = inferMilestonesFromAudit(audit, target.milestones || {});
    target.technicalAudit = audit.score;
  }

  const summary = [
    `[Revisión ${formatDate(new Date().toISOString())}]`,
    audit?.score ? `Diagnóstico automático: ${audit.score.grade}/5 (${audit.score.percent}%).` : "",
    `Ejecución observada: ${EXECUTION_LABELS[elements.executionStatus.value]}.`,
    localProject?.commit?.sha ? `SHA: ${shortSha(localProject.commit.sha)}.` : "",
    elements.entryFileSelect.value ? `Entrada: ${elements.entryFileSelect.value}.` : "",
    elements.blockerInput.value.trim() ? `Bloqueador: ${elements.blockerInput.value.trim()}.` : "",
    elements.reviewNotes.value.trim(),
  ].filter(Boolean).join(" ");

  target.notes = target.notes ? `${target.notes}\n\n${summary}` : summary;
  target.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(baseStudents));
  elements.localStatus.textContent = `Evidencia y rúbrica técnica enviadas: ${formatDate(target.updatedAt)}`;
  showToast("Puntaje técnico y evidencia transferidos. La nota permanece provisional hasta la defensa.");
}

function buildAuditReport(student, project, audit) {
  const lines = [
    `AUDITORÍA TÉCNICA — ${student.name} (${student.group})`,
    `Proyecto: ${student.project}`,
    `Repositorio: ${student.repository}`,
    `SHA: ${shortSha(project?.commit?.sha)}`,
    `Puntaje automático: ${audit.score.grade}/5 (${audit.score.percent}%) — ${audit.score.statusLabel}`,
    `Referencia: ${audit.benchmark?.leaderName || state.projectIndex.benchmark?.name || "pendiente"} (${audit.benchmark?.leaderPercent ?? state.projectIndex.benchmark?.percent ?? "—"}%)`,
    "",
    "CRITERIOS:",
    ...(audit.criteria || []).map((criterion) => `- ${criterion.label}: ${criterion.score}/5 (${criterion.percent}%)`),
    "",
    "FORTALEZAS:",
    ...(audit.feedback?.strengths || []).map((item) => `- ${item}`),
    "",
    "FALTANTES:",
    ...(audit.feedback?.missing || []).map((item) => `- ${item}`),
    "",
    "RIESGOS:",
    ...(audit.feedback?.risks || []).map((item) => `- ${item}`),
    "",
    "SIGUIENTES ACCIONES:",
    ...(audit.feedback?.nextActions || []).map((item, index) => `${index + 1}. ${item}`),
    "",
    "Nota: diagnóstico automático; requiere validación mediante ejecución, explicación, modificación en vivo y autoría.",
  ];
  return lines.join("\n");
}

async function copyAuditReport() {
  const student = getSelectedStudent();
  const project = student ? getLocalProject(student.id) : null;
  const audit = project?.audit;
  if (!student || !audit) return;
  const report = buildAuditReport(student, project, audit);
  try {
    await navigator.clipboard.writeText(report);
    showToast("Informe técnico copiado al portapapeles.");
  } catch {
    const area = document.createElement("textarea");
    area.value = report;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("Informe técnico copiado.");
  }
}

function showCoach() {
  const student = getSelectedStudent();
  const audit = student ? getAudit(student.id) : null;
  if (!student || !audit) return;
  renderCoach(audit, student);
  elements.coachPanel.hidden = false;
  elements.coachPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function handleCanvasPointer(event) {
  if (!state.canvasRegions.length) return;
  const rect = elements.criteriaCanvas.getBoundingClientRect();
  const scaleX = elements.criteriaCanvas.width / (window.devicePixelRatio || 1) / rect.width;
  const scaleY = elements.criteriaCanvas.height / (window.devicePixelRatio || 1) / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const region = state.canvasRegions.find((item) => x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height);
  if (!region) {
    elements.canvasTooltip.hidden = true;
    return;
  }
  const evidence = region.criterion.evidence?.[0] || "Sin evidencia destacada";
  const missing = region.criterion.missing?.[0] || "Sin faltante prioritario";
  elements.canvasTooltip.innerHTML = `
    <strong>${escapeHtml(region.criterion.label)} · ${region.criterion.percent}%</strong>
    <span>Referencia: ${region.benchmarkPercent}%</span>
    <span>Evidencia: ${escapeHtml(evidence)}</span>
    <span>Prioridad: ${escapeHtml(missing)}</span>
  `;
  const wrapper = elements.criteriaCanvas.parentElement.getBoundingClientRect();
  elements.canvasTooltip.style.left = `${Math.min(event.clientX - wrapper.left + 12, wrapper.width - 285)}px`;
  elements.canvasTooltip.style.top = `${Math.max(8, event.clientY - wrapper.top - 10)}px`;
  elements.canvasTooltip.hidden = false;
}

function bindEvents() {
  elements.refreshData.addEventListener("click", async () => {
    await loadData();
    showToast("Copias, puntajes, commits y revisiones actualizados.");
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
    setRunnerState("ready", "Proyecto renderizado");
  });
  elements.saveReview.addEventListener("click", saveReviewSession);
  elements.copyToEvaluation.addEventListener("click", copyReviewToEvaluation);
  elements.generateCoach.addEventListener("click", showCoach);
  elements.copyAudit.addEventListener("click", copyAuditReport);
  elements.criteriaCanvas.addEventListener("pointermove", handleCanvasPointer);
  elements.criteriaCanvas.addEventListener("pointerleave", () => { elements.canvasTooltip.hidden = true; });

  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const student = getSelectedStudent();
      if (student) renderAnalytics(student);
    }, 180);
  });
}

bindEvents();
loadData().catch((error) => {
  console.error(error);
  resetPreview("No fue posible cargar el listado, las copias o la auditoría técnica.");
  resetAnalytics();
  setRunnerState("error", "Error de inicio");
  showToast("Error al iniciar el laboratorio maestro.");
});
