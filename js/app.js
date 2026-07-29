import {
  MILESTONES,
  RUBRIC,
  TRACKS,
  attendanceSummary,
  calculateGrade,
  calculateProgress,
  clampScore,
  createStudent,
  getCommitState,
  getStudentStatus,
  isEvidenceVerified,
  normalizeRepository,
} from "./core.js";

const STORAGE_KEYS = {
  students: "seminario-goal-p2-students-v1",
  attendance: "seminario-goal-p2-attendance-v1",
};

const STATUS_LABELS = {
  starting: "Inicio",
  developing: "En desarrollo",
  advanced: "Avanzado",
  complete: "Completo",
  "new-commit": "Commit nuevo",
  paused: "En pausa",
};

const GOAL_LABELS = {
  "not-started": "No iniciada",
  "in-progress": "En progreso",
  blocked: "Bloqueada",
  complete: "Completada",
};

const REPO_LABELS = {
  pending: "Repo pendiente",
  provisional: "Repo provisional",
  confirmed: "Repo confirmado",
};

const elements = {
  navTabs: [...document.querySelectorAll(".nav-tab")],
  pageSections: [...document.querySelectorAll("[data-page-section]")],
  syncStatus: document.querySelector("#syncStatus"),
  lastMonitorRun: document.querySelector("#lastMonitorRun"),
  refreshMonitor: document.querySelector("#refreshMonitorButton"),
  syncGithub: document.querySelector("#syncGithubButton"),
  metricStudents: document.querySelector("#metricStudents"),
  metricRepositories: document.querySelector("#metricRepositories"),
  metricNewCommits: document.querySelector("#metricNewCommits"),
  metricAverage: document.querySelector("#metricAverage"),
  metricProgress: document.querySelector("#metricProgress"),
  metricAttendance: document.querySelector("#metricAttendance"),
  metricAttendanceDate: document.querySelector("#metricAttendanceDate"),
  priorityList: document.querySelector("#priorityList"),
  groupProgressGrid: document.querySelector("#groupProgressGrid"),
  studentSearch: document.querySelector("#studentSearch"),
  studentGroupFilter: document.querySelector("#studentGroupFilter"),
  trackFilter: document.querySelector("#trackFilter"),
  studentStatusFilter: document.querySelector("#studentStatusFilter"),
  studentGrid: document.querySelector("#studentGrid"),
  emptyStudentState: document.querySelector("#emptyStudentState"),
  attendanceDate: document.querySelector("#attendanceDate"),
  attendanceGroupFilter: document.querySelector("#attendanceGroupFilter"),
  markVisiblePresent: document.querySelector("#markVisiblePresentButton"),
  exportAttendanceCsv: document.querySelector("#exportAttendanceCsvButton"),
  attendanceTableBody: document.querySelector("#attendanceTableBody"),
  activityGrid: document.querySelector("#activityGrid"),
  historyList: document.querySelector("#historyList"),
  exportBackup: document.querySelector("#exportBackupButton"),
  importBackup: document.querySelector("#importBackupInput"),
  exportRoster: document.querySelector("#exportRosterButton"),
  resetLocalData: document.querySelector("#resetLocalDataButton"),
  studentDialog: document.querySelector("#studentDialog"),
  studentForm: document.querySelector("#studentForm"),
  closeStudentDialog: document.querySelector("#closeStudentDialogButton"),
  cancelStudent: document.querySelector("#cancelStudentButton"),
  dialogStudentName: document.querySelector("#dialogStudentName"),
  dialogStudentMeta: document.querySelector("#dialogStudentMeta"),
  projectInput: document.querySelector("#studentProjectInput"),
  trackInput: document.querySelector("#studentTrackInput"),
  githubInput: document.querySelector("#studentGithubInput"),
  repositoryInput: document.querySelector("#studentRepositoryInput"),
  repositoryStatusInput: document.querySelector("#repositoryStatusInput"),
  academicStatusInput: document.querySelector("#academicStatusInput"),
  goalInput: document.querySelector("#studentGoalInput"),
  goalDateInput: document.querySelector("#studentGoalDateInput"),
  goalStatusInput: document.querySelector("#studentGoalStatusInput"),
  milestoneFields: document.querySelector("#milestoneFields"),
  rubricFields: document.querySelector("#rubricFields"),
  gradePreview: document.querySelector("#gradePreview"),
  gradeVerificationState: document.querySelector("#gradeVerificationState"),
  notesInput: document.querySelector("#studentNotesInput"),
  commitSha: document.querySelector("#dialogCommitSha"),
  commitMessage: document.querySelector("#dialogCommitMessage"),
  commitMeta: document.querySelector("#dialogCommitMeta"),
  commitLink: document.querySelector("#dialogCommitLink"),
  markCommitReviewed: document.querySelector("#markCommitReviewedButton"),
  syncSelectedStudent: document.querySelector("#syncSelectedStudentButton"),
  evidenceRuns: document.querySelector("#evidenceRuns"),
  evidenceExplains: document.querySelector("#evidenceExplains"),
  evidenceLiveChange: document.querySelector("#evidenceLiveChange"),
  evidenceAuthorship: document.querySelector("#evidenceAuthorship"),
  openRosterEditor: document.querySelector("#openRosterEditorButton"),
  rosterDialog: document.querySelector("#rosterDialog"),
  rosterForm: document.querySelector("#rosterForm"),
  rosterEditorList: document.querySelector("#rosterEditorList"),
  closeRosterDialog: document.querySelector("#closeRosterDialogButton"),
  cancelRoster: document.querySelector("#cancelRosterButton"),
  localSaveStatus: document.querySelector("#localSaveStatus"),
  toast: document.querySelector("#toast"),
};

const state = {
  rosterMeta: {},
  students: [],
  attendance: {},
  monitor: { generatedAt: null, students: {}, repositoriesChecked: 0, updatesDetected: 0 },
  history: { events: [] },
  selectedStudentId: null,
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

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDate(value, includeTime = true) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

function shortSha(sha = "") {
  return sha ? sha.slice(0, 7) : "—";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3500);
}

function downloadFile(filename, content, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(state.students));
  elements.localSaveStatus.textContent = `Cambios locales guardados: ${formatDate(new Date().toISOString())}`;
}

function saveAttendance() {
  localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(state.attendance));
  elements.localSaveStatus.textContent = `Asistencia guardada: ${formatDate(new Date().toISOString())}`;
}

function mergeMonitorData() {
  state.students = state.students.map((student) => {
    const monitored = state.monitor.students?.[student.id];
    if (!monitored?.latestCommit) return student;
    return { ...student, latestCommit: monitored.latestCommit };
  });
}

async function fetchJson(url, fallback) {
  try {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`No se pudo cargar ${url}`, error);
    return fallback;
  }
}

async function initialize() {
  const roster = await fetchJson("data/students.json", { students: [] });
  state.rosterMeta = { ...roster };
  delete state.rosterMeta.students;

  const savedStudents = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const savedById = new Map(savedStudents.map((student) => [student.id, student]));
  state.students = roster.students.map((student) => createStudent(student, savedById.get(student.id)));
  state.attendance = safeJsonParse(localStorage.getItem(STORAGE_KEYS.attendance), {});
  elements.attendanceDate.value = todayLocal();

  await refreshMonitorData({ silent: true });
  bindEvents();
  renderAll();
  window.setInterval(() => refreshMonitorData({ silent: true }), 10 * 60 * 1000);
}

async function refreshMonitorData({ silent = false } = {}) {
  const [monitor, history] = await Promise.all([
    fetchJson("data/monitor/latest.json", state.monitor),
    fetchJson("data/monitor/history.json", state.history),
  ]);
  state.monitor = monitor;
  state.history = history;
  mergeMonitorData();
  renderAll();
  if (!silent) showToast("Datos centrales actualizados.");
}

function switchSection(sectionName) {
  elements.navTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.section === sectionName));
  elements.pageSections.forEach((section) => {
    const active = section.dataset.pageSection === sectionName;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getStudentById(id) {
  return state.students.find((student) => student.id === id);
}

function getCommitForStudent(student) {
  return student.latestCommit || state.monitor.students?.[student.id]?.latestCommit || null;
}

function getFilteredStudents() {
  const query = elements.studentSearch.value.trim().toLowerCase();
  const group = elements.studentGroupFilter.value;
  const track = elements.trackFilter.value;
  const status = elements.studentStatusFilter.value;
  return state.students.filter((student) => {
    const searchable = `${student.name} ${student.project} ${student.github} ${student.repository}`.toLowerCase();
    return (!query || searchable.includes(query)) &&
      (group === "all" || student.group === group) &&
      (track === "all" || student.track === track) &&
      (status === "all" || getStudentStatus(student) === status);
  });
}

function renderSummary() {
  const repositories = state.students.filter((student) => student.repository).length;
  const grades = state.students.map((student) => calculateGrade(student.rubric)).filter((grade) => grade !== null);
  const progressTotals = state.students.reduce((acc, student) => {
    const progress = calculateProgress(student.milestones);
    acc.completed += progress.completed;
    acc.total += progress.total;
    return acc;
  }, { completed: 0, total: 0 });
  const newCommits = state.students.filter((student) => {
    const commit = getCommitForStudent(student);
    return getCommitState(commit?.sha, student.lastReviewedSha) === "new" ||
      getCommitState(commit?.sha, student.lastReviewedSha) === "unreviewed";
  }).length;
  const date = elements.attendanceDate.value || todayLocal();
  const attendance = attendanceSummary(state.students, state.attendance[date] || {});

  elements.metricStudents.textContent = state.students.length;
  elements.metricRepositories.textContent = `${repositories}/${state.students.length}`;
  elements.metricNewCommits.textContent = newCommits;
  elements.metricAverage.textContent = grades.length
    ? (grades.reduce((sum, grade) => sum + grade, 0) / grades.length).toFixed(2)
    : "—";
  elements.metricProgress.textContent = progressTotals.total
    ? `${Math.round((progressTotals.completed / progressTotals.total) * 100)}%`
    : "0%";
  elements.metricAttendance.textContent = `${attendance.recorded}/${attendance.total}`;
  elements.metricAttendanceDate.textContent = formatDate(`${date}T12:00:00`, false);
  elements.lastMonitorRun.textContent = state.monitor.generatedAt
    ? `Último monitoreo: ${formatDate(state.monitor.generatedAt)}`
    : "Aún no hay monitoreo automático";
  elements.syncStatus.textContent = state.monitor.generatedAt
    ? `Monitor: ${formatDate(state.monitor.generatedAt)}`
    : "Monitor pendiente";
}

function renderPriorities() {
  const priorities = [];
  const pendingRepos = state.students.filter((student) => !student.repository);
  const newCommitStudents = state.students.filter((student) => {
    const commit = getCommitForStudent(student);
    const stateValue = getCommitState(commit?.sha, student.lastReviewedSha);
    return stateValue === "new" || stateValue === "unreviewed";
  });
  const blockedGoals = state.students.filter((student) => student.goalStatus === "blocked");
  const incompleteGrades = state.students.filter((student) => calculateGrade(student.rubric) === null);

  if (newCommitStudents.length) priorities.push({ icon: "↻", title: `${newCommitStudents.length} commit(s) por revisar`, text: "Prioriza la ejecución, explicación y modificación en vivo." });
  if (pendingRepos.length) priorities.push({ icon: "#", title: `${pendingRepos.length} repositorio(s) pendientes`, text: "Confirma usuario y repositorio durante la entrevista individual." });
  if (blockedGoals.length) priorities.push({ icon: "!", title: `${blockedGoals.length} meta(s) bloqueadas`, text: "Define un bloqueo concreto y una acción de desbloqueo." });
  priorities.push({ icon: "✓", title: `${incompleteGrades.length} evaluaciones sin cerrar`, text: "La nota solo debe consolidarse con rúbrica y evidencias verificadas." });

  elements.priorityList.innerHTML = priorities.map((item) => `
    <div class="priority-item">
      <span class="priority-icon">${escapeHtml(item.icon)}</span>
      <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></div>
    </div>
  `).join("");
}

function renderGroupProgress() {
  const groups = ["11-A", "11-B", "11-C"];
  elements.groupProgressGrid.innerHTML = groups.map((group) => {
    const students = state.students.filter((student) => student.group === group);
    const repos = students.filter((student) => student.repository).length;
    const grades = students.map((student) => calculateGrade(student.rubric)).filter((grade) => grade !== null);
    const totalProgress = students.reduce((sum, student) => sum + calculateProgress(student.milestones).percentage, 0);
    const progress = students.length ? Math.round(totalProgress / students.length) : 0;
    return `
      <article class="group-progress-card">
        <h4>${group}</h4>
        <div class="group-metrics">
          <div class="group-metric"><span>Estudiantes</span><strong>${students.length}</strong></div>
          <div class="group-metric"><span>Repositorios</span><strong>${repos}/${students.length}</strong></div>
          <div class="group-metric"><span>Promedio</span><strong>${grades.length ? (grades.reduce((a,b)=>a+b,0)/grades.length).toFixed(2) : "—"}</strong></div>
          <div class="group-metric"><span>Ruta CSS</span><strong>${students.filter((student) => student.track === "css").length}</strong></div>
        </div>
        <div class="progress-track"><span style="width:${progress}%"></span></div>
        <div class="progress-label"><span>Avance técnico</span><strong>${progress}%</strong></div>
      </article>
    `;
  }).join("");
}

function renderStudentCard(student) {
  const progress = calculateProgress(student.milestones);
  const grade = calculateGrade(student.rubric);
  const status = getStudentStatus(student);
  const commit = getCommitForStudent(student);
  const commitState = getCommitState(commit?.sha, student.lastReviewedSha);
  return `
    <article class="student-card ${student.track === "css" ? "css-student" : ""}" data-student-id="${escapeHtml(student.id)}">
      <button class="student-card-button" type="button" data-card-action="open" aria-label="Abrir ficha de ${escapeHtml(student.name)}"></button>
      <div class="student-card-header">
        <div>
          <h3>${escapeHtml(student.name)}</h3>
          <div class="student-identity">${escapeHtml(student.group)} · N.º ${student.listNumber}</div>
        </div>
        <span class="status-chip status-${status}">${STATUS_LABELS[status] || "Sin estado"}</span>
      </div>
      <span class="track-chip ${student.track}">${escapeHtml(TRACKS[student.track].label)}</span>
      <p class="student-project">${escapeHtml(student.project)}</p>
      <p class="student-goal"><strong>Meta:</strong> ${escapeHtml(student.goal)}</p>
      <div class="card-progress">
        <div class="card-progress-row"><span>Competencias verificadas</span><strong>${progress.completed}/${progress.total}</strong></div>
        <div class="progress-track"><span style="width:${progress.percentage}%"></span></div>
      </div>
      <div class="student-card-footer">
        <div class="grade-box"><strong>${grade === null ? "—" : grade.toFixed(2)}</strong><small>${grade === null ? "Nota pendiente" : isEvidenceVerified(student.evidence) ? "Nota verificada" : "Nota provisional"}</small></div>
        <div class="card-badges">
          <span class="repo-chip repo-${student.repositoryStatus}">${REPO_LABELS[student.repositoryStatus]}</span>
          <span class="goal-chip goal-${student.goalStatus}">${GOAL_LABELS[student.goalStatus]}</span>
          ${commitState === "new" || commitState === "unreviewed" ? `<span class="status-chip status-new-commit">${commitState === "new" ? "Nuevo SHA" : "SHA sin revisar"}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderStudents() {
  const students = getFilteredStudents();
  elements.studentGrid.innerHTML = students.map(renderStudentCard).join("");
  elements.emptyStudentState.hidden = students.length > 0;
}

function getAttendanceStudents() {
  const group = elements.attendanceGroupFilter.value;
  return state.students.filter((student) => group === "all" || student.group === group);
}

function renderAttendance() {
  const date = elements.attendanceDate.value || todayLocal();
  const records = state.attendance[date] || {};
  elements.attendanceTableBody.innerHTML = getAttendanceStudents().map((student) => {
    const entry = records[student.id] || { status: "", note: "" };
    return `
      <tr data-attendance-student-id="${escapeHtml(student.id)}">
        <td>${student.listNumber}</td>
        <td class="attendance-name"><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.project)}</small></td>
        <td>${escapeHtml(student.group)}</td>
        <td>
          <select data-attendance-field="status" aria-label="Asistencia de ${escapeHtml(student.name)}">
            <option value="" ${entry.status === "" ? "selected" : ""}>Sin registrar</option>
            <option value="present" ${entry.status === "present" ? "selected" : ""}>Presente</option>
            <option value="late" ${entry.status === "late" ? "selected" : ""}>Llegó tarde</option>
            <option value="absent" ${entry.status === "absent" ? "selected" : ""}>Ausente</option>
            <option value="excused" ${entry.status === "excused" ? "selected" : ""}>Excusa</option>
          </select>
        </td>
        <td><input data-attendance-field="note" type="text" maxlength="220" value="${escapeHtml(entry.note || "")}" placeholder="Observación opcional"></td>
      </tr>
    `;
  }).join("");
}

function renderActivity() {
  const monitorEntries = state.students.map((student) => {
    const central = state.monitor.students?.[student.id] || {};
    const commit = getCommitForStudent(student);
    const commitState = getCommitState(commit?.sha, student.lastReviewedSha);
    return { student, central, commit, commitState };
  });

  elements.activityGrid.innerHTML = monitorEntries.map(({ student, central, commit, commitState }) => {
    const isError = central.status === "error";
    const isNew = commitState === "new" || commitState === "unreviewed";
    return `
      <article class="activity-card ${isError ? "error" : isNew ? "new" : ""}">
        <h3>${escapeHtml(student.name)}</h3>
        <p class="activity-repo">${escapeHtml(student.repository || "Repositorio pendiente")}</p>
        ${isError ? `
          <span class="commit-sha">ERROR</span>
          <p class="commit-message">${escapeHtml(central.error || "No fue posible consultar el repositorio.")}</p>
        ` : commit ? `
          <span class="commit-sha">${escapeHtml(shortSha(commit.sha))}</span>
          <p class="commit-message">${escapeHtml(commit.message)}</p>
          <p class="commit-meta">${escapeHtml(commit.author || "Autor no identificado")} · ${escapeHtml(formatDate(commit.date))}</p>
          <a class="activity-link" href="${escapeHtml(commit.url)}" target="_blank" rel="noopener noreferrer">Abrir commit →</a>
        ` : `
          <span class="commit-sha">PENDIENTE</span>
          <p class="commit-message">Agrega y confirma el repositorio del estudiante.</p>
        `}
      </article>
    `;
  }).join("");

  const events = Array.isArray(state.history.events) ? state.history.events.slice(0, 30) : [];
  elements.historyList.innerHTML = events.length ? events.map((event) => `
    <div class="history-item">
      <span class="history-type">${event.type === "new-commit" ? "+" : event.type === "monitor-error" ? "!" : "·"}</span>
      <div>
        <strong>${escapeHtml(event.name)} · ${escapeHtml(event.group)}</strong>
        <p>${event.commit ? `${escapeHtml(event.commit.shortSha)} — ${escapeHtml(event.commit.message)}` : escapeHtml(event.error || "Línea base registrada")}</p>
      </div>
      <time>${escapeHtml(formatDate(event.detectedAt))}</time>
    </div>
  `).join("") : `<p class="empty-state">El historial aparecerá después de la primera ejecución del monitor.</p>`;
}

function renderAll() {
  renderSummary();
  renderPriorities();
  renderGroupProgress();
  renderStudents();
  renderAttendance();
  renderActivity();
}

function renderMilestoneFields(student) {
  elements.milestoneFields.innerHTML = MILESTONES.map((milestone) => `
    <label class="milestone-check">
      <input type="checkbox" name="milestone-${milestone.id}" ${student.milestones[milestone.id] ? "checked" : ""}>
      <span>${escapeHtml(milestone.label)}</span>
    </label>
  `).join("");
}

function renderRubricFields(student) {
  elements.rubricFields.innerHTML = RUBRIC.map((criterion) => `
    <label class="rubric-field">
      <span><strong>${escapeHtml(criterion.label)}</strong><small>Peso ${criterion.weight}%</small></span>
      <input name="rubric-${criterion.id}" type="number" min="0" max="5" step="0.1" inputmode="decimal" value="${student.rubric[criterion.id] ?? ""}" placeholder="0–5">
    </label>
  `).join("");
}

function updateGradePreview() {
  const scores = {};
  RUBRIC.forEach((criterion) => {
    const input = elements.studentForm.elements[`rubric-${criterion.id}`];
    scores[criterion.id] = input?.value === "" ? null : clampScore(input?.value);
  });
  const grade = calculateGrade(scores);
  const evidence = {
    runs: elements.evidenceRuns.checked,
    explains: elements.evidenceExplains.checked,
    liveChange: elements.evidenceLiveChange.checked,
    authorship: elements.evidenceAuthorship.checked,
  };
  elements.gradePreview.textContent = grade === null ? "Pendiente" : grade.toFixed(2);
  elements.gradeVerificationState.textContent = grade === null
    ? "Completa todos los criterios."
    : isEvidenceVerified(evidence)
      ? "Nota respaldada por evidencias individuales."
      : "Nota provisional: faltan evidencias individuales.";
}

function openStudentDialog(studentId) {
  const student = getStudentById(studentId);
  if (!student) return;
  state.selectedStudentId = studentId;
  elements.dialogStudentName.textContent = student.name;
  elements.dialogStudentMeta.textContent = `${student.group} · N.º ${student.listNumber}`;
  elements.projectInput.value = student.project;
  elements.trackInput.value = student.track;
  elements.githubInput.value = student.github;
  elements.repositoryInput.value = student.repository;
  elements.repositoryStatusInput.value = student.repositoryStatus;
  elements.academicStatusInput.value = student.academicStatus;
  elements.goalInput.value = student.goal;
  elements.goalDateInput.value = student.goalDate;
  elements.goalStatusInput.value = student.goalStatus;
  elements.notesInput.value = student.notes;
  elements.evidenceRuns.checked = student.evidence.runs;
  elements.evidenceExplains.checked = student.evidence.explains;
  elements.evidenceLiveChange.checked = student.evidence.liveChange;
  elements.evidenceAuthorship.checked = student.evidence.authorship;
  renderMilestoneFields(student);
  renderRubricFields(student);

  const commit = getCommitForStudent(student);
  elements.commitSha.textContent = commit ? shortSha(commit.sha) : "Sin sincronizar";
  elements.commitMessage.textContent = commit?.message || "No hay información del repositorio.";
  elements.commitMeta.textContent = commit ? `${commit.author || "Autor no identificado"} · ${formatDate(commit.date)}` : "";
  elements.commitLink.hidden = !commit?.url;
  elements.commitLink.href = commit?.url || "#";
  elements.markCommitReviewed.disabled = !commit?.sha;
  elements.syncSelectedStudent.disabled = !student.repository;
  updateGradePreview();
  elements.studentDialog.showModal();
}

function collectStudentForm() {
  const student = getStudentById(state.selectedStudentId);
  if (!student) return null;
  const rubric = {};
  RUBRIC.forEach((criterion) => {
    const raw = elements.studentForm.elements[`rubric-${criterion.id}`].value;
    rubric[criterion.id] = raw === "" ? null : clampScore(raw);
  });
  const milestones = {};
  MILESTONES.forEach((milestone) => {
    milestones[milestone.id] = elements.studentForm.elements[`milestone-${milestone.id}`].checked;
  });
  return {
    ...student,
    project: elements.projectInput.value.trim() || "Proyecto por registrar",
    track: elements.trackInput.value === "css" ? "css" : "core",
    github: elements.githubInput.value.trim(),
    repository: normalizeRepository(elements.repositoryInput.value),
    repositoryStatus: elements.repositoryStatusInput.value,
    academicStatus: elements.academicStatusInput.value,
    goal: elements.goalInput.value.trim() || "Definir una meta concreta y verificable.",
    goalDate: elements.goalDateInput.value,
    goalStatus: elements.goalStatusInput.value,
    milestones,
    rubric,
    evidence: {
      runs: elements.evidenceRuns.checked,
      explains: elements.evidenceExplains.checked,
      liveChange: elements.evidenceLiveChange.checked,
      authorship: elements.evidenceAuthorship.checked,
    },
    notes: elements.notesInput.value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function saveStudentForm(event) {
  event.preventDefault();
  const updated = collectStudentForm();
  if (!updated) return;
  const index = state.students.findIndex((student) => student.id === updated.id);
  state.students[index] = updated;
  saveStudents();
  elements.studentDialog.close();
  renderAll();
  showToast(`Ficha de ${updated.name} guardada.`);
}

function markSelectedCommitReviewed() {
  const student = getStudentById(state.selectedStudentId);
  const commit = student ? getCommitForStudent(student) : null;
  if (!student || !commit?.sha) return;
  student.lastReviewedSha = commit.sha;
  student.updatedAt = new Date().toISOString();
  saveStudents();
  elements.studentDialog.close();
  renderAll();
  openStudentDialog(student.id);
  showToast(`Commit ${shortSha(commit.sha)} marcado como revisado.`);
}

async function fetchLatestCommit(repository) {
  const normalized = normalizeRepository(repository);
  if (!normalized.includes("/")) throw new Error("Repositorio inválido");
  const response = await fetch(`https://api.github.com/repos/${normalized}/commits?per_page=1`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    if (response.status === 403) throw new Error("Límite temporal de GitHub alcanzado");
    if (response.status === 404) throw new Error("Repositorio no encontrado o no público");
    throw new Error(`GitHub respondió ${response.status}`);
  }
  const [commit] = await response.json();
  if (!commit) throw new Error("Repositorio sin commits");
  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: String(commit.commit?.message || "Commit sin mensaje").split("\n")[0],
    author: commit.author?.login || commit.commit?.author?.name || "Autor no identificado",
    date: commit.commit?.committer?.date || commit.commit?.author?.date || null,
    url: commit.html_url,
  };
}

async function syncOneStudent(studentId, { reopenDialog = false } = {}) {
  const student = getStudentById(studentId);
  if (!student?.repository) {
    showToast("Este estudiante no tiene repositorio vinculado.");
    return false;
  }
  try {
    const commit = await fetchLatestCommit(student.repository);
    student.latestCommit = commit;
    student.updatedAt = new Date().toISOString();
    saveStudents();
    renderAll();
    if (reopenDialog) {
      elements.studentDialog.close();
      openStudentDialog(student.id);
    }
    showToast(`${student.name}: último commit actualizado.`);
    return true;
  } catch (error) {
    showToast(`${student.name}: ${error.message}.`);
    return false;
  }
}

async function syncAllGithub() {
  const candidates = state.students.filter((student) => student.repository);
  if (!candidates.length) return;
  elements.syncGithub.disabled = true;
  elements.syncStatus.textContent = `Consultando 0/${candidates.length}…`;
  let completed = 0;
  let errors = 0;
  for (const student of candidates) {
    try {
      student.latestCommit = await fetchLatestCommit(student.repository);
      student.updatedAt = new Date().toISOString();
    } catch (error) {
      errors += 1;
      console.warn(student.repository, error);
    }
    completed += 1;
    elements.syncStatus.textContent = `Consultando ${completed}/${candidates.length}…`;
  }
  saveStudents();
  renderAll();
  elements.syncGithub.disabled = false;
  elements.syncStatus.textContent = errors
    ? `${candidates.length - errors} repos actualizados; ${errors} error(es)`
    : `${candidates.length} repositorios actualizados`;
  showToast(elements.syncStatus.textContent);
}

function handleAttendanceChange(event) {
  const field = event.target.dataset.attendanceField;
  const row = event.target.closest("[data-attendance-student-id]");
  if (!field || !row) return;
  const date = elements.attendanceDate.value || todayLocal();
  const studentId = row.dataset.attendanceStudentId;
  state.attendance[date] ||= {};
  state.attendance[date][studentId] ||= { status: "", note: "" };
  state.attendance[date][studentId][field] = event.target.value;
  if (!state.attendance[date][studentId].status && !state.attendance[date][studentId].note) {
    delete state.attendance[date][studentId];
  }
  saveAttendance();
  renderSummary();
}

function markVisiblePresent() {
  const date = elements.attendanceDate.value || todayLocal();
  state.attendance[date] ||= {};
  getAttendanceStudents().forEach((student) => {
    state.attendance[date][student.id] = {
      status: "present",
      note: state.attendance[date][student.id]?.note || "",
    };
  });
  saveAttendance();
  renderAttendance();
  renderSummary();
  showToast("Estudiantes visibles marcados como presentes.");
}

function exportAttendanceCsv() {
  const date = elements.attendanceDate.value || todayLocal();
  const records = state.attendance[date] || {};
  const rows = [
    ["Fecha", "Asignatura", "Grupo", "Número", "Estudiante", "Estado", "Observación"],
    ...state.students.map((student) => {
      const entry = records[student.id] || {};
      return [date, "SEMINARIO PROGRAMACIÓN", student.group, student.listNumber, student.name, entry.status || "sin registrar", entry.note || ""];
    }),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  downloadFile(`asistencia-seminario-${date}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function openRosterDialog() {
  elements.rosterEditorList.innerHTML = state.students.map((student) => `
    <div class="roster-row" data-roster-student-id="${escapeHtml(student.id)}">
      <div class="roster-name"><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.group)} · N.º ${student.listNumber}</small></div>
      <label class="field"><span>Usuario</span><input name="github" value="${escapeHtml(student.github)}" placeholder="usuario"></label>
      <label class="field"><span>Repositorio</span><input name="repository" value="${escapeHtml(student.repository)}" placeholder="usuario/proyecto"></label>
      <label class="field"><span>Proyecto</span><input name="project" value="${escapeHtml(student.project)}"></label>
    </div>
  `).join("");
  elements.rosterDialog.showModal();
}

function saveRoster(event) {
  event.preventDefault();
  [...elements.rosterEditorList.querySelectorAll("[data-roster-student-id]")].forEach((row) => {
    const student = getStudentById(row.dataset.rosterStudentId);
    if (!student) return;
    student.github = row.querySelector('[name="github"]').value.trim();
    student.repository = normalizeRepository(row.querySelector('[name="repository"]').value);
    student.project = row.querySelector('[name="project"]').value.trim() || "Proyecto por registrar";
    student.repositoryStatus = student.repository
      ? student.repositoryStatus === "confirmed" ? "confirmed" : "provisional"
      : "pending";
    student.updatedAt = new Date().toISOString();
  });
  saveStudents();
  elements.rosterDialog.close();
  renderAll();
  showToast("Vínculos locales actualizados. Exporta la lista para actualizar la automatización central.");
}

function exportBackup() {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    rosterMeta: state.rosterMeta,
    students: state.students,
    attendance: state.attendance,
  };
  downloadFile(`seminario-goal-respaldo-${todayLocal()}.json`, JSON.stringify(payload, null, 2));
}

async function importBackup(event) {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (!Array.isArray(payload.students) || typeof payload.attendance !== "object") throw new Error("Formato inválido");
    state.students = payload.students.map((student) => createStudent(student));
    state.attendance = payload.attendance || {};
    saveStudents();
    saveAttendance();
    renderAll();
    showToast("Respaldo restaurado correctamente.");
  } catch (error) {
    console.warn(error);
    showToast("No fue posible importar ese respaldo.");
  } finally {
    event.target.value = "";
  }
}

function exportRoster() {
  const payload = {
    ...state.rosterMeta,
    students: state.students.map((student) => ({
      id: student.id,
      listNumber: student.listNumber,
      name: student.name,
      group: student.group,
      github: student.github,
      repository: student.repository,
      repositoryStatus: student.repositoryStatus,
      project: student.project,
      track: student.track,
      goal: student.goal,
      goalStatus: student.goalStatus,
      milestones: student.milestones,
    })),
  };
  downloadFile("students.json", JSON.stringify(payload, null, 2));
}

function resetLocalData() {
  const confirmed = window.confirm("¿Eliminar evaluaciones, metas editadas y asistencia guardadas en este navegador?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEYS.students);
  localStorage.removeItem(STORAGE_KEYS.attendance);
  window.location.reload();
}

function bindEvents() {
  elements.navTabs.forEach((tab) => tab.addEventListener("click", () => switchSection(tab.dataset.section)));
  elements.refreshMonitor.addEventListener("click", () => refreshMonitorData());
  elements.syncGithub.addEventListener("click", syncAllGithub);
  [elements.studentSearch, elements.studentGroupFilter, elements.trackFilter, elements.studentStatusFilter]
    .forEach((control) => control.addEventListener(control.tagName === "INPUT" ? "input" : "change", renderStudents));
  elements.studentGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-student-id]");
    if (card) openStudentDialog(card.dataset.studentId);
  });
  elements.attendanceDate.addEventListener("change", () => { renderAttendance(); renderSummary(); });
  elements.attendanceGroupFilter.addEventListener("change", renderAttendance);
  elements.attendanceTableBody.addEventListener("change", handleAttendanceChange);
  elements.attendanceTableBody.addEventListener("input", handleAttendanceChange);
  elements.markVisiblePresent.addEventListener("click", markVisiblePresent);
  elements.exportAttendanceCsv.addEventListener("click", exportAttendanceCsv);
  elements.studentForm.addEventListener("submit", saveStudentForm);
  elements.studentForm.addEventListener("input", updateGradePreview);
  elements.closeStudentDialog.addEventListener("click", () => elements.studentDialog.close());
  elements.cancelStudent.addEventListener("click", () => elements.studentDialog.close());
  elements.markCommitReviewed.addEventListener("click", markSelectedCommitReviewed);
  elements.syncSelectedStudent.addEventListener("click", () => syncOneStudent(state.selectedStudentId, { reopenDialog: true }));
  elements.openRosterEditor.addEventListener("click", openRosterDialog);
  elements.rosterForm.addEventListener("submit", saveRoster);
  elements.closeRosterDialog.addEventListener("click", () => elements.rosterDialog.close());
  elements.cancelRoster.addEventListener("click", () => elements.rosterDialog.close());
  elements.exportBackup.addEventListener("click", exportBackup);
  elements.importBackup.addEventListener("change", importBackup);
  elements.exportRoster.addEventListener("click", exportRoster);
  elements.resetLocalData.addEventListener("click", resetLocalData);
}

initialize();
