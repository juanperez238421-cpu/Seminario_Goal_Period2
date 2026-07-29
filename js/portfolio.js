const STORAGE_KEYS = {
  students: "seminario-goal-p2-students-v1",
  teams: "seminario-goal-p2-teams-v1",
};

const elements = {
  refresh: document.querySelector("#refreshButton"),
  search: document.querySelector("#searchInput"),
  group: document.querySelector("#groupFilter"),
  status: document.querySelector("#statusFilter"),
  newTeam: document.querySelector("#newTeamButton"),
  exportTeams: document.querySelector("#exportTeamsButton"),
  projectGrid: document.querySelector("#projectGrid"),
  emptyState: document.querySelector("#emptyState"),
  generatedAt: document.querySelector("#generatedAtLabel"),
  metricProjects: document.querySelector("#metricProjects"),
  metricReady: document.querySelector("#metricReady"),
  metricTeams: document.querySelector("#metricTeams"),
  metricPending: document.querySelector("#metricPending"),
  metricBenchmark: document.querySelector("#metricBenchmark"),
  metricBenchmarkName: document.querySelector("#metricBenchmarkName"),
  benchmarkDescription: document.querySelector("#benchmarkDescription"),
  benchmarkScore: document.querySelector("#benchmarkScore"),
  benchmarkPercent: document.querySelector("#benchmarkPercent"),
  teacherGuide: document.querySelector("#teacherGuideLink"),
  referenceGuide: document.querySelector("#referenceGuideLink"),
  teamDialog: document.querySelector("#teamDialog"),
  teamForm: document.querySelector("#teamForm"),
  teamDialogTitle: document.querySelector("#teamDialogTitle"),
  teamId: document.querySelector("#teamIdInput"),
  primaryStudent: document.querySelector("#primaryStudentInput"),
  partnerStudent: document.querySelector("#partnerStudentInput"),
  teamProject: document.querySelector("#teamProjectInput"),
  teamRepository: document.querySelector("#teamRepositoryInput"),
  primaryRole: document.querySelector("#primaryRoleInput"),
  partnerRole: document.querySelector("#partnerRoleInput"),
  teamGoal: document.querySelector("#teamGoalInput"),
  deleteTeam: document.querySelector("#deleteTeamButton"),
  closeTeamDialog: document.querySelector("#closeTeamDialogButton"),
  cancelTeam: document.querySelector("#cancelTeamButton"),
  saveStatus: document.querySelector("#saveStatus"),
  toast: document.querySelector("#toast"),
};

const state = {
  roster: [],
  students: [],
  projectIndex: { projects: {}, benchmark: null },
  guides: { students: [] },
  teams: [],
  entities: [],
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

function normalizeRepository(value = "") {
  return String(value)
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

function slug(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value) {
  if (!value) return "Sin actualización";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3600);
}

async function fetchJson(url, fallback) {
  try {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } catch (error) {
    console.warn(url, error);
    return fallback;
  }
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

function guideForStudent(studentId) {
  return state.guides.students?.find((guide) => guide.id === studentId) || null;
}

function projectForStudent(studentId) {
  return state.projectIndex.projects?.[studentId] || null;
}

function studentById(studentId) {
  return state.students.find((student) => student.id === studentId) || null;
}

function loadLocalStudents(rosterStudents) {
  const saved = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const savedById = new Map(Array.isArray(saved) ? saved.map((student) => [student.id, student]) : []);
  return rosterStudents.map((base) => ({ ...base, ...(savedById.get(base.id) || {}) }));
}

function loadTeams() {
  const saved = safeJsonParse(localStorage.getItem(STORAGE_KEYS.teams), []);
  state.teams = Array.isArray(saved) ? saved.filter((team) => Array.isArray(team.memberIds) && team.memberIds.length) : [];
}

function saveTeams() {
  localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(state.teams));
  elements.saveStatus.textContent = `Equipos guardados: ${formatDate(new Date().toISOString())}`;
}

function auditCandidate(memberIds, repository) {
  const normalized = normalizeRepository(repository);
  const candidates = memberIds.map(projectForStudent).filter(Boolean);
  return candidates.find((project) => normalizeRepository(project.repository) === normalized && project.audit)
    || candidates.find((project) => project.audit)
    || null;
}

function createEntity({ id, memberIds, project, repository, goal, roles = {}, explicitTeam = false }) {
  const members = memberIds.map(studentById).filter(Boolean);
  const normalizedRepo = normalizeRepository(repository || members.find((member) => member.repository)?.repository || "");
  const auditProject = auditCandidate(memberIds, normalizedRepo);
  const audit = auditProject?.audit || null;
  const referenceId = state.projectIndex.benchmark?.studentId;
  const isReference = memberIds.includes(referenceId);
  const score = audit?.score || null;
  const syntaxErrors = audit?.indicators?.syntaxErrors?.length || 0;
  const ready = Boolean(auditProject?.status === "ready" && audit);
  const percent = score?.percent ?? null;
  let priority = "medium";
  let priorityLabel = "Consolidar proyecto";
  if (!normalizedRepo || !ready) {
    priority = "pending";
    priorityLabel = "Vincular repositorio";
  } else if (syntaxErrors || percent < 35) {
    priority = "high";
    priorityLabel = syntaxErrors ? "Corregir bloqueo de ejecución" : "Intervención prioritaria";
  } else if (isReference) {
    priority = "reference";
    priorityLabel = "Profundización y CSS";
  }
  return {
    id,
    memberIds,
    members,
    project: project || members[0]?.project || "Proyecto por registrar",
    repository: normalizedRepo,
    goal: goal || members[0]?.goal || "Definir una meta verificable.",
    roles,
    explicitTeam,
    auditProject,
    audit,
    score,
    ready,
    isReference,
    priority,
    priorityLabel,
  };
}

function buildEntities() {
  const assigned = new Set();
  const entities = [];

  for (const team of state.teams) {
    const memberIds = [...new Set(team.memberIds)].filter((id) => studentById(id)).slice(0, 2);
    if (!memberIds.length) continue;
    memberIds.forEach((id) => assigned.add(id));
    entities.push(createEntity({
      id: team.id,
      memberIds,
      project: team.project,
      repository: team.repository,
      goal: team.goal,
      roles: team.roles || {},
      explicitTeam: true,
    }));
  }

  const repoGroups = new Map();
  for (const student of state.students) {
    if (assigned.has(student.id)) continue;
    const repo = normalizeRepository(student.repository || "");
    if (repo) {
      const list = repoGroups.get(repo) || [];
      list.push(student);
      repoGroups.set(repo, list);
    }
  }

  for (const [repository, members] of repoGroups) {
    const memberIds = members.map((member) => member.id).slice(0, 2);
    memberIds.forEach((id) => assigned.add(id));
    entities.push(createEntity({
      id: `repo-${slug(repository)}`,
      memberIds,
      project: members[0]?.project,
      repository,
      goal: members[0]?.goal,
      explicitTeam: members.length > 1,
    }));
  }

  for (const student of state.students) {
    if (assigned.has(student.id)) continue;
    entities.push(createEntity({
      id: `student-${student.id}`,
      memberIds: [student.id],
      project: student.project,
      repository: student.repository,
      goal: student.goal,
    }));
  }

  const priorityOrder = { high: 0, medium: 1, reference: 2, pending: 3 };
  state.entities = entities.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff) return priorityDiff;
    const scoreA = a.score?.percent ?? -1;
    const scoreB = b.score?.percent ?? -1;
    return scoreA - scoreB || a.project.localeCompare(b.project, "es");
  });
}

function filteredEntities() {
  const query = elements.search.value.trim().toLowerCase();
  const group = elements.group.value;
  const status = elements.status.value;
  return state.entities.filter((entity) => {
    const groups = entity.members.map((member) => member.group);
    const searchable = [
      entity.project,
      entity.repository,
      entity.goal,
      ...entity.members.flatMap((member) => [member.name, member.group, member.github || ""]),
    ].join(" ").toLowerCase();
    const statusMatch = status === "all"
      || (status === "ready" && entity.ready)
      || (status === "pending" && !entity.ready)
      || (status === "team" && entity.members.length === 2)
      || (status === "individual" && entity.members.length === 1);
    return (!query || searchable.includes(query))
      && (group === "all" || groups.includes(group))
      && statusMatch;
  });
}

function missingItems(entity) {
  if (!entity.ready) {
    return [
      "Confirmar usuario y repositorio público.",
      "Subir una página HTML principal ejecutable.",
      "Agregar README con integrantes y roles.",
    ];
  }
  const actions = entity.audit?.feedback?.nextActions || entity.audit?.feedback?.missing || [];
  return actions.slice(0, 4);
}

function guideLinks(entity) {
  return entity.members.map((member) => {
    const guide = guideForStudent(member.id);
    const role = entity.roles?.[member.id] || (entity.members.length === 1 ? "Proyecto individual" : "Rol por confirmar");
    return `
      <div class="member-row">
        <div>
          <strong>${escapeHtml(member.name)}</strong>
          <small>${escapeHtml(member.group)} · ${escapeHtml(role)}</small>
        </div>
        ${guide?.pdf ? `<a class="member-guide" href="${escapeHtml(guide.pdf)}" target="_blank" rel="noopener noreferrer">Guía PDF</a>` : ""}
      </div>
    `;
  }).join("");
}

function projectCard(entity) {
  const score = entity.score;
  const percent = score?.percent ?? 0;
  const grade = score?.grade;
  const benchmarkPercent = state.projectIndex.benchmark?.percent || 0;
  const relative = benchmarkPercent && score ? Math.round((percent / benchmarkPercent) * 100) : null;
  const commit = entity.auditProject?.commit;
  const reviewStudentId = entity.auditProject?.studentId || entity.memberIds[0];
  const teamLabel = entity.members.length === 2 ? "Pareja" : "Individual";
  const classes = [
    "project-card",
    entity.isReference ? "is-reference" : "",
    `priority-${entity.priority}`,
  ].filter(Boolean).join(" ");
  return `
    <article class="${classes}" data-entity-id="${escapeHtml(entity.id)}">
      <header class="project-header">
        <div class="project-header-top">
          <div>
            <div class="project-chips">
              <span class="team-chip">${teamLabel}</span>
              <span class="status-chip ${entity.ready ? "ready" : "pending"}">${entity.ready ? "Repositorio auditado" : "Repositorio pendiente"}</span>
              ${entity.isReference ? `<span class="reference-chip">Referencia</span>` : ""}
            </div>
            <h3>${escapeHtml(entity.project)}</h3>
            <p class="project-repo">${escapeHtml(entity.repository || "Sin repositorio vinculado")}</p>
          </div>
          <div class="score-badge ${score ? "" : "pending"}">
            <strong>${grade == null ? "—" : grade.toFixed(2)}</strong>
            <small>${score ? `${percent}%` : "No evaluable"}</small>
          </div>
        </div>
      </header>

      <div class="member-list">${guideLinks(entity)}</div>

      <div class="project-body">
        <div>
          <div class="progress-head"><span>Avance técnico automatizado</span><strong>${score ? `${percent}%` : "Pendiente"}</strong></div>
          <div class="progress-track ${entity.isReference ? "reference-progress" : ""}"><span style="width:${Math.max(0, Math.min(100, percent))}%"></span></div>
        </div>

        <div class="project-summary-grid">
          <div><span>Prioridad</span><strong>${escapeHtml(entity.priorityLabel)}</strong></div>
          <div><span>Commit</span><strong>${escapeHtml(commit?.shortSha || "—")}</strong></div>
          <div><span>Frente a referencia</span><strong>${relative == null ? "—" : `${relative}%`}</strong></div>
        </div>

        <div>
          <strong class="mini-title">Faltantes inmediatos</strong>
          <ul class="missing-list">${missingItems(entity).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>

        <div class="goal-box"><strong>Meta:</strong> ${escapeHtml(entity.goal)}</div>

        <div class="project-footer">
          ${entity.ready ? `<a class="button primary" href="project-review.html?student=${encodeURIComponent(reviewStudentId)}">Abrir proyecto real</a>` : ""}
          ${entity.repository ? `<a class="button secondary" href="https://github.com/${escapeHtml(entity.repository)}" target="_blank" rel="noopener noreferrer">Repositorio</a>` : ""}
          <button class="button secondary" type="button" data-action="edit-team" data-entity-id="${escapeHtml(entity.id)}">${entity.members.length === 2 ? "Editar pareja" : "Vincular pareja"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderBenchmark() {
  const benchmark = state.projectIndex.benchmark;
  if (!benchmark) {
    elements.metricBenchmark.textContent = "—";
    elements.metricBenchmarkName.textContent = "sin auditoría";
    elements.benchmarkDescription.textContent = "No existe todavía un proyecto auditado para usar como referencia.";
    elements.benchmarkScore.textContent = "—";
    elements.benchmarkPercent.textContent = "—";
    return;
  }
  elements.metricBenchmark.textContent = `${benchmark.percent}%`;
  elements.metricBenchmarkName.textContent = benchmark.name;
  elements.benchmarkDescription.textContent = `${benchmark.name} · ${benchmark.project}. Se usa como comparación por ser el repositorio con mayor evidencia técnica, no porque esté terminado.`;
  elements.benchmarkScore.textContent = `${benchmark.grade.toFixed(2)}/5.00`;
  elements.benchmarkPercent.textContent = `${benchmark.percent}% técnico`;
}

function renderMetrics() {
  const ready = state.entities.filter((entity) => entity.ready).length;
  const teams = state.entities.filter((entity) => entity.members.length === 2).length;
  const pending = state.entities.filter((entity) => !entity.ready).length;
  elements.metricProjects.textContent = state.entities.length;
  elements.metricReady.textContent = ready;
  elements.metricTeams.textContent = teams;
  elements.metricPending.textContent = pending;
  renderBenchmark();
}

function renderProjects() {
  const entities = filteredEntities();
  elements.projectGrid.innerHTML = entities.map(projectCard).join("");
  elements.emptyState.hidden = entities.length > 0;
}

function renderAll() {
  buildEntities();
  renderMetrics();
  renderProjects();
  elements.generatedAt.textContent = state.projectIndex.generatedAt
    ? `Auditoría: ${formatDate(state.projectIndex.generatedAt)}`
    : "Auditoría pendiente";
}

function populateStudentSelects() {
  const options = state.students
    .map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)} · ${escapeHtml(student.group)}</option>`)
    .join("");
  elements.primaryStudent.innerHTML = options;
  elements.partnerStudent.innerHTML = `<option value="">Proyecto individual</option>${options}`;
}

function removeMembersFromTeams(memberIds, exceptTeamId = "") {
  state.teams = state.teams
    .filter((team) => team.id === exceptTeamId || !team.memberIds.some((id) => memberIds.includes(id)))
    .map((team) => ({ ...team, memberIds: team.memberIds.filter((id) => !memberIds.includes(id)) }))
    .filter((team) => team.memberIds.length);
}

function openTeamDialog(entityId = "") {
  populateStudentSelects();
  const entity = state.entities.find((item) => item.id === entityId) || null;
  const explicit = entity ? state.teams.find((team) => team.id === entity.id) : null;
  const memberIds = entity?.memberIds || [];
  const first = memberIds[0] || state.students[0]?.id || "";
  const second = memberIds[1] || "";
  elements.teamId.value = explicit?.id || "";
  elements.primaryStudent.value = first;
  elements.partnerStudent.value = second;
  elements.teamProject.value = explicit?.project || entity?.project || studentById(first)?.project || "";
  elements.teamRepository.value = explicit?.repository || entity?.repository || studentById(first)?.repository || "";
  elements.primaryRole.value = explicit?.roles?.[first] || "";
  elements.partnerRole.value = second ? (explicit?.roles?.[second] || "") : "";
  elements.teamGoal.value = explicit?.goal || entity?.goal || studentById(first)?.goal || "";
  elements.teamDialogTitle.textContent = explicit ? "Editar pareja de proyecto" : "Vincular estudiantes al proyecto";
  elements.deleteTeam.hidden = !explicit;
  elements.teamDialog.showModal();
}

function saveTeam(event) {
  event.preventDefault();
  const primaryId = elements.primaryStudent.value;
  const partnerId = elements.partnerStudent.value;
  if (!primaryId) return;
  if (partnerId && partnerId === primaryId) {
    showToast("Los integrantes deben ser diferentes.");
    return;
  }
  const memberIds = [primaryId, partnerId].filter(Boolean);
  const existingId = elements.teamId.value;
  removeMembersFromTeams(memberIds, existingId);
  const team = {
    id: existingId || `team-${memberIds.map(slug).sort().join("-")}-${Date.now().toString(36)}`,
    memberIds,
    project: elements.teamProject.value.trim() || studentById(primaryId)?.project || "Proyecto compartido",
    repository: normalizeRepository(elements.teamRepository.value),
    goal: elements.teamGoal.value.trim() || "Definir una meta compartida verificable.",
    roles: {
      [primaryId]: elements.primaryRole.value.trim() || "Responsabilidad por confirmar",
      ...(partnerId ? { [partnerId]: elements.partnerRole.value.trim() || "Responsabilidad por confirmar" } : {}),
    },
    updatedAt: new Date().toISOString(),
  };
  const index = state.teams.findIndex((item) => item.id === team.id);
  if (index >= 0) state.teams[index] = team;
  else state.teams.push(team);
  saveTeams();
  elements.teamDialog.close();
  renderAll();
  showToast(partnerId ? "Pareja vinculada al proyecto." : "Proyecto configurado como individual.");
}

function deleteTeam() {
  const teamId = elements.teamId.value;
  if (!teamId) return;
  state.teams = state.teams.filter((team) => team.id !== teamId);
  saveTeams();
  elements.teamDialog.close();
  renderAll();
  showToast("El vínculo de pareja fue eliminado.");
}

function exportTeams() {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    maxTeamSize: 2,
    teams: state.teams,
  };
  downloadFile(`equipos-seminario-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
}

async function loadData() {
  const [roster, projectIndex, guides] = await Promise.all([
    fetchJson("data/students.json", { students: [] }),
    fetchJson("student-projects/index.json", { projects: {}, benchmark: null }),
    fetchJson("guides/index.json", { students: [] }),
  ]);
  state.roster = roster.students || [];
  state.students = loadLocalStudents(state.roster);
  state.projectIndex = projectIndex || { projects: {}, benchmark: null };
  state.guides = guides || { students: [] };
  loadTeams();
  elements.teacherGuide.href = state.guides.teacherGuide || elements.teacherGuide.href;
  elements.referenceGuide.href = state.guides.referenceGuide || elements.referenceGuide.href;
  renderAll();
}

function bindEvents() {
  elements.refresh.addEventListener("click", async () => {
    await loadData();
    showToast("Repositorios, auditorías, equipos y guías actualizados.");
  });
  elements.search.addEventListener("input", renderProjects);
  elements.group.addEventListener("change", renderProjects);
  elements.status.addEventListener("change", renderProjects);
  elements.newTeam.addEventListener("click", () => openTeamDialog());
  elements.exportTeams.addEventListener("click", exportTeams);
  elements.projectGrid.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="edit-team"]');
    if (button) openTeamDialog(button.dataset.entityId);
  });
  elements.teamForm.addEventListener("submit", saveTeam);
  elements.deleteTeam.addEventListener("click", deleteTeam);
  elements.closeTeamDialog.addEventListener("click", () => elements.teamDialog.close());
  elements.cancelTeam.addEventListener("click", () => elements.teamDialog.close());
  elements.primaryStudent.addEventListener("change", () => {
    const student = studentById(elements.primaryStudent.value);
    if (!student) return;
    if (!elements.teamProject.value.trim()) elements.teamProject.value = student.project || "";
    if (!elements.teamRepository.value.trim()) elements.teamRepository.value = student.repository || "";
    if (!elements.teamGoal.value.trim()) elements.teamGoal.value = student.goal || "";
  });
}

bindEvents();
loadData().catch((error) => {
  console.error(error);
  showToast("No fue posible cargar el portafolio de proyectos.");
});
