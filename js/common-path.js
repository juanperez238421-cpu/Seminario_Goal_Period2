import {
  buildInterviewInstruction,
  buildStudentRoute,
  membersForTeam,
  nextMissingCriterion,
  normalizeRepository,
  projectProgress,
  routeProgress,
  statusFromPercent,
  teamForStudent,
} from "./common-path-core.js";

const STORAGE_KEYS = {
  students: "seminario-goal-p2-students-v1",
  teams: "seminario-goal-p2-teams-v1",
  routes: "seminario-goal-p2-common-path-v1",
};

const elements = {
  refresh: document.querySelector("#refreshButton"),
  print: document.querySelector("#printButton"),
  linkTeam: document.querySelector("#linkTeamButton"),
  search: document.querySelector("#studentSearch"),
  group: document.querySelector("#groupFilter"),
  mode: document.querySelector("#modeFilter"),
  studentList: document.querySelector("#studentList"),
  studentCount: document.querySelector("#studentCount"),
  studentEmpty: document.querySelector("#studentEmpty"),
  pathwayTitle: document.querySelector("#pathwayTitle"),
  pathwayDescription: document.querySelector("#pathwayDescription"),
  commonProjectOverview: document.querySelector("#commonProjectOverview"),
  studentName: document.querySelector("#studentName"),
  studentMeta: document.querySelector("#studentMeta"),
  memberList: document.querySelector("#memberList"),
  routePercent: document.querySelector("#routePercent"),
  routeStatus: document.querySelector("#routeStatus"),
  summaryBadges: document.querySelector("#summaryBadges"),
  openRunner: document.querySelector("#openRunnerButton"),
  openInterview: document.querySelector("#openInterviewButton"),
  openRepository: document.querySelector("#openRepositoryButton"),
  teacherOpening: document.querySelector("#teacherOpening"),
  criteriaStrip: document.querySelector("#criteriaStrip"),
  auditLabel: document.querySelector("#auditLabel"),
  studentProjectGrid: document.querySelector("#studentProjectGrid"),
  nextProjectTitle: document.querySelector("#nextProjectTitle"),
  nextProjectStatus: document.querySelector("#nextProjectStatus"),
  nextCriterion: document.querySelector("#nextCriterion"),
  nextCriterionEvidence: document.querySelector("#nextCriterionEvidence"),
  nextVariant: document.querySelector("#nextVariant"),
  nextMinimum: document.querySelector("#nextMinimum"),
  nextCommit: document.querySelector("#nextCommit"),
  nextInterviewTask: document.querySelector("#nextInterviewTask"),
  advancedTrackPanel: document.querySelector("#advancedTrackPanel"),
  advancedTrackDescription: document.querySelector("#advancedTrackDescription"),
  pageStatus: document.querySelector("#pageStatus"),
  toast: document.querySelector("#toast"),
  teamDialog: document.querySelector("#teamDialog"),
  teamForm: document.querySelector("#teamForm"),
  teamDialogTitle: document.querySelector("#teamDialogTitle"),
  teamId: document.querySelector("#teamIdInput"),
  primaryStudent: document.querySelector("#primaryStudentInput"),
  partnerStudent: document.querySelector("#partnerStudentInput"),
  teamRepository: document.querySelector("#teamRepositoryInput"),
  primaryRole: document.querySelector("#primaryRoleInput"),
  partnerRole: document.querySelector("#partnerRoleInput"),
  sharedProjectChecks: document.querySelector("#sharedProjectChecks"),
  unlinkTeam: document.querySelector("#unlinkTeamButton"),
  closeTeamDialog: document.querySelector("#closeTeamDialogButton"),
  cancelTeam: document.querySelector("#cancelTeamButton"),
};

const state = {
  roster: [],
  students: [],
  projectIndex: { projects: {}, benchmark: null },
  pathway: { projects: [], criteria: [], advancedTrack: {} },
  teams: [],
  routes: {},
  selectedStudentId: null,
  referenceStudentId: "",
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
  showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3200);
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

function studentById(studentId) {
  return state.students.find((student) => student.id === studentId) || null;
}

function projectById(projectId) {
  return state.pathway.projects.find((project) => project.id === projectId) || null;
}

function criterionById(criterionId) {
  return state.pathway.criteria.find((criterion) => criterion.id === criterionId) || null;
}

function auditProjectForContext(student, team) {
  const members = team ? membersForTeam(team, state.students) : [student];
  const repository = normalizeRepository(team?.repository || student.repository || "");
  const candidates = members
    .map((member) => state.projectIndex.projects?.[member.id])
    .filter(Boolean);
  return candidates.find((project) => normalizeRepository(project.repository) === repository && project.audit)
    || candidates.find((project) => project.audit)
    || state.projectIndex.projects?.[student.id]
    || null;
}

function contextForStudent(studentId) {
  const student = studentById(studentId);
  if (!student) return null;
  const team = teamForStudent(state.teams, studentId);
  const members = team ? membersForTeam(team, state.students) : [student];
  const auditProject = auditProjectForContext(student, team);
  const repository = normalizeRepository(team?.repository || student.repository || auditProject?.repository || "");
  return {
    student,
    team,
    members,
    roles: team?.roles || {},
    sharedProjectIds: team?.sharedProjectIds || [],
    repository,
    auditProject,
    sourceStudentId: auditProject?.studentId || student.id,
  };
}

function loadLocalData() {
  const savedStudents = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const savedById = new Map(Array.isArray(savedStudents) ? savedStudents.map((student) => [student.id, student]) : []);
  state.students = state.roster.map((base) => ({ ...base, ...(savedById.get(base.id) || {}) }));
  const teams = safeJsonParse(localStorage.getItem(STORAGE_KEYS.teams), []);
  state.teams = Array.isArray(teams) ? teams.filter((team) => Array.isArray(team.memberIds) && team.memberIds.length) : [];
  const routes = safeJsonParse(localStorage.getItem(STORAGE_KEYS.routes), {});
  state.routes = routes && typeof routes === "object" ? routes : {};
}

function saveRoutes(message = "Ruta actualizada") {
  localStorage.setItem(STORAGE_KEYS.routes, JSON.stringify(state.routes));
  elements.pageStatus.textContent = `${message}: ${formatDate(new Date().toISOString())}`;
}

function saveTeams() {
  localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(state.teams));
  elements.pageStatus.textContent = `Parejas actualizadas: ${formatDate(new Date().toISOString())}`;
}

function routeForStudent(studentId) {
  const student = studentById(studentId);
  if (!student) return null;
  const auditProject = state.projectIndex.projects?.[student.id] || null;
  const savedRoute = state.routes[student.id] || {};
  const route = buildStudentRoute({ student, auditProject, pathway: state.pathway, savedRoute });
  state.routes[student.id] = {
    ...savedRoute,
    primaryProjectId: route.primaryProjectId,
    projects: route.projects,
    updatedAt: savedRoute.updatedAt || null,
  };
  return route;
}

function routePercentForStudent(studentId) {
  const route = routeForStudent(studentId);
  return route?.percent || 0;
}

function renderPathway() {
  elements.pathwayTitle.textContent = state.pathway.title || "Ruta común de proyectos";
  elements.pathwayDescription.textContent = state.pathway.description || "Todos trabajan las mismas capacidades.";
  elements.commonProjectOverview.innerHTML = state.pathway.projects.map((project) => `
    <article class="pathway-project-card">
      <span>Proyecto ${project.order}</span>
      <h3>${escapeHtml(project.shortName)}</h3>
      <p>${escapeHtml(project.theme)}</p>
    </article>
  `).join("");
  elements.criteriaStrip.innerHTML = state.pathway.criteria.map((criterion) => `
    <article class="criterion-pill">
      <strong>${escapeHtml(criterion.label)} <span>${criterion.weight}%</span></strong>
      <p>${escapeHtml(criterion.evidence)}</p>
    </article>
  `).join("");
}

function filteredStudents() {
  const query = elements.search.value.trim().toLowerCase();
  const group = elements.group.value;
  const mode = elements.mode.value;
  return state.students.filter((student) => {
    const context = contextForStudent(student.id);
    const searchable = `${student.name} ${student.group} ${student.project} ${context?.repository || ""}`.toLowerCase();
    const modeMatch = mode === "all"
      || (mode === "team" && context?.members.length === 2)
      || (mode === "individual" && context?.members.length === 1)
      || (mode === "pending" && !context?.repository);
    return (!query || searchable.includes(query))
      && (group === "all" || student.group === group)
      && modeMatch;
  });
}

function renderStudentList() {
  const students = filteredStudents();
  elements.studentCount.textContent = students.length;
  elements.studentEmpty.hidden = students.length > 0;
  elements.studentList.innerHTML = students.map((student) => {
    const context = contextForStudent(student.id);
    const percent = routePercentForStudent(student.id);
    const status = statusFromPercent(percent);
    return `
      <button class="student-item ${student.id === state.selectedStudentId ? "is-selected" : ""}" type="button" data-student-id="${escapeHtml(student.id)}">
        <div class="student-item-top">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <small>${escapeHtml(student.group)} · N.º ${Number(student.listNumber || 0)}</small>
          </div>
          <span class="student-state ${context?.repository ? "ready" : ""}"></span>
        </div>
        <p>${escapeHtml(student.project || "Proyecto por definir")}</p>
        <small>${percent}% · ${escapeHtml(status.label)}${context?.members.length === 2 ? " · Pareja" : ""}</small>
      </button>
    `;
  }).join("");
}

function renderMembers(context) {
  elements.memberList.innerHTML = context.members.map((member, index) => {
    const fallback = context.members.length === 1
      ? "Responsable del flujo completo"
      : index === 0 ? "Interfaz y CSS" : "JavaScript, DOM y datos";
    const role = context.roles?.[member.id] || fallback;
    return `<span class="member-chip">${escapeHtml(member.name)} · ${escapeHtml(role)}</span>`;
  }).join("");
}

function currentRouteState(studentId) {
  const route = routeForStudent(studentId);
  return state.routes[studentId] || route;
}

function isShared(context, projectId) {
  return context.members.length === 2 && context.sharedProjectIds.includes(projectId);
}

function projectCard(context, project, routeState) {
  const projectState = routeState.projects[project.id];
  const progress = projectProgress(projectState);
  const shared = isShared(context, project.id);
  const primary = routeState.primaryProjectId === project.id;
  return `
    <article class="student-project-card ${primary ? "is-primary" : ""}" data-project-id="${escapeHtml(project.id)}">
      <div class="student-project-heading">
        <div>
          <h3>${escapeHtml(project.name)}</h3>
          <p>${escapeHtml(project.minimum)}</p>
        </div>
        <span class="project-status-chip ${escapeHtml(progress.status.id)}">${escapeHtml(progress.status.label)}</span>
      </div>

      <div>
        <div class="route-progress-head"><span>Avance</span><strong>${progress.percent}%</strong></div>
        <div class="route-progress-track"><span style="width:${progress.percent}%"></span></div>
      </div>

      <div class="project-fields">
        <label class="field">
          <span>Variante del proyecto${shared ? " · compartida" : ""}</span>
          <input type="text" data-field="variant" value="${escapeHtml(projectState.variant || "")}" placeholder="Ej.: Carrito, ATM o registro">
        </label>
        <label class="field">
          <span>Repositorio${shared ? " · compartido" : ""}</span>
          <input type="text" data-field="repository" value="${escapeHtml(projectState.repository || context.repository || "")}" placeholder="usuario/repositorio">
        </label>
      </div>

      <div class="project-criteria">
        ${state.pathway.criteria.map((criterion) => `
          <label class="project-criterion">
            <input type="checkbox" data-criterion-id="${escapeHtml(criterion.id)}" ${projectState.checks?.[criterion.id] ? "checked" : ""}>
            <span>${escapeHtml(criterion.label)}<small>${escapeHtml(criterion.evidence)}</small></span>
          </label>
        `).join("")}
      </div>

      <div class="student-project-actions">
        <button class="button ${primary ? "ghost" : "secondary"}" type="button" data-action="set-primary">${primary ? "Proyecto actual" : "Trabajar ahora"}</button>
        ${shared ? `<span class="button ghost" aria-label="Proyecto compartido">Compartido</span>` : ""}
      </div>
    </article>
  `;
}

function nextProjectData(routeState) {
  const ordered = state.pathway.projects;
  const primary = projectById(routeState.primaryProjectId);
  if (primary && projectProgress(routeState.projects[primary.id]).percent < 100) return primary;
  return ordered.find((project) => projectProgress(routeState.projects[project.id]).percent < 100)
    || ordered.at(-1)
    || null;
}

function commitForCriterion(criterionId, project) {
  const name = project?.shortName?.toLowerCase() || "proyecto";
  const messages = {
    interface: `feat: crea interfaz visible de ${name}`,
    functionality: `feat: conecta eventos y funcionamiento de ${name}`,
    data: `fix: valida y conserva datos de ${name}`,
    css: `style: aplica diseño responsive a ${name}`,
    evidence: `docs: explica avances y responsabilidades de ${name}`,
  };
  return messages[criterionId] || `feat: completa ${name}`;
}

function renderNextStep(context, routeState) {
  const project = nextProjectData(routeState);
  if (!project) return;
  const progress = projectProgress(routeState.projects[project.id]);
  const missingId = nextMissingCriterion(progress.checks);
  const criterion = criterionById(missingId);
  elements.nextProjectTitle.textContent = project.name;
  elements.nextProjectStatus.textContent = progress.status.label;
  elements.nextCriterion.textContent = criterion?.label || "Proyecto terminado";
  elements.nextCriterionEvidence.textContent = criterion?.evidence || "Mantener funcionamiento y aplicar una mejora pequeña.";
  elements.nextVariant.textContent = routeState.projects[project.id].variant || project.allowedVariants?.[0] || project.shortName;
  elements.nextMinimum.textContent = project.minimum;
  elements.nextCommit.textContent = commitForCriterion(missingId, project);
  elements.nextInterviewTask.textContent = buildInterviewInstruction({
    project,
    progress,
    criterionLabels: Object.fromEntries(state.pathway.criteria.map((item) => [item.id, item.label])),
  });
}

function buildTeacherOpening(context, routeState) {
  const percent = routeProgress(routeState.projects, state.pathway.projects.map((project) => project.id));
  const project = nextProjectData(routeState);
  const progress = project ? projectProgress(routeState.projects[project.id]) : null;
  const missing = criterionById(nextMissingCriterion(progress?.checks || {}));
  const teamText = context.members.length === 2
    ? ` Trabajas con ${context.members.find((member) => member.id !== context.student.id)?.name || "una pareja"}; el funcionamiento puede ser compartido, pero hoy debes explicar y modificar tu parte.`
    : "";
  const repositoryText = context.repository
    ? ` El repositorio vinculado es ${context.repository}.`
    : " Primero debemos confirmar o crear tu repositorio.";
  return `${context.student.name}, todos en el curso trabajan la misma ruta de tres proyectos. Tu avance registrado es ${percent}%. Hoy revisaremos ${project?.shortName || "el primer proyecto"} y solo acordaremos una meta: ${missing?.label || "mantener el proyecto completo"}.${repositoryText}${teamText}`;
}

function renderAdvancedTrack(context) {
  const advanced = context.student.id === state.referenceStudentId
    || context.auditProject?.studentId === state.projectIndex.benchmark?.studentId;
  elements.advancedTrackPanel.hidden = !advanced;
  if (advanced) {
    elements.advancedTrackDescription.textContent = state.pathway.advancedTrack?.description
      || "Aplicar una capa CSS consistente a todos los proyectos de la ruta.";
  }
}

function renderSelected(context) {
  const routeState = currentRouteState(context.student.id);
  const percent = routeProgress(routeState.projects, state.pathway.projects.map((project) => project.id));
  const status = statusFromPercent(percent);
  const commit = context.auditProject?.commit;

  elements.studentName.textContent = context.student.name;
  elements.studentMeta.textContent = `${context.student.group} · N.º ${context.student.listNumber} · ${context.student.project || "Proyecto por definir"}`;
  renderMembers(context);
  elements.routePercent.textContent = `${percent}%`;
  elements.routeStatus.textContent = status.label;
  elements.summaryBadges.innerHTML = [
    `<span class="badge">${context.members.length === 2 ? "Pareja" : "Individual"}</span>`,
    `<span class="badge">${context.repository ? "Repo vinculado" : "Repo pendiente"}</span>`,
    commit?.shortSha ? `<span class="badge">${escapeHtml(commit.shortSha)}</span>` : "",
  ].join("");

  elements.teacherOpening.textContent = buildTeacherOpening(context, routeState);
  elements.auditLabel.textContent = context.auditProject?.audit?.generatedAt
    ? `Auditoría base: ${formatDate(context.auditProject.audit.generatedAt)}`
    : "Sin auditoría automática";
  elements.studentProjectGrid.innerHTML = state.pathway.projects
    .map((project) => projectCard(context, project, routeState))
    .join("");
  renderNextStep(context, routeState);
  renderAdvancedTrack(context);

  elements.openRunner.hidden = !context.auditProject;
  elements.openRunner.href = `project-review.html?student=${encodeURIComponent(context.sourceStudentId)}`;
  elements.openInterview.href = `session.html?student=${encodeURIComponent(context.student.id)}`;
  elements.openRepository.hidden = !context.repository;
  elements.openRepository.href = context.repository ? `https://github.com/${context.repository}` : "#";
  elements.pageStatus.textContent = `Ficha de ${context.student.name} lista.`;
}

function selectStudent(studentId) {
  const context = contextForStudent(studentId);
  if (!context) return;
  state.selectedStudentId = studentId;
  renderStudentList();
  renderSelected(context);
  const url = new URL(window.location.href);
  url.searchParams.set("student", studentId);
  window.history.replaceState({}, "", url);
}

function updateProjectField(projectId, field, value) {
  const studentId = state.selectedStudentId;
  const context = contextForStudent(studentId);
  if (!context) return;
  const routeState = currentRouteState(studentId);
  routeState.projects[projectId][field] = field === "repository" ? normalizeRepository(value) : String(value).trim();
  routeState.projects[projectId].updatedAt = new Date().toISOString();
  routeState.updatedAt = new Date().toISOString();

  if (isShared(context, projectId)) {
    for (const member of context.members) {
      if (member.id === studentId) continue;
      const partnerRoute = currentRouteState(member.id);
      partnerRoute.projects[projectId][field] = routeState.projects[projectId][field];
      partnerRoute.projects[projectId].updatedAt = routeState.projects[projectId].updatedAt;
      state.routes[member.id] = partnerRoute;
    }
  }
  state.routes[studentId] = routeState;
  saveRoutes("Proyecto actualizado");
}

function updateCriterion(projectId, criterionId, checked) {
  const studentId = state.selectedStudentId;
  const context = contextForStudent(studentId);
  if (!context) return;
  const routeState = currentRouteState(studentId);
  routeState.projects[projectId].checks[criterionId] = checked;
  routeState.projects[projectId].updatedAt = new Date().toISOString();
  routeState.updatedAt = new Date().toISOString();

  if (criterionId !== "evidence" && isShared(context, projectId)) {
    for (const member of context.members) {
      if (member.id === studentId) continue;
      const partnerRoute = currentRouteState(member.id);
      partnerRoute.projects[projectId].checks[criterionId] = checked;
      partnerRoute.projects[projectId].updatedAt = routeState.projects[projectId].updatedAt;
      state.routes[member.id] = partnerRoute;
    }
  }

  state.routes[studentId] = routeState;
  saveRoutes("Criterio actualizado");
  renderStudentList();
  renderSelected(context);
}

function setPrimaryProject(projectId) {
  const routeState = currentRouteState(state.selectedStudentId);
  routeState.primaryProjectId = projectId;
  routeState.updatedAt = new Date().toISOString();
  state.routes[state.selectedStudentId] = routeState;
  saveRoutes("Proyecto actual definido");
  renderStudentList();
  renderSelected(contextForStudent(state.selectedStudentId));
}

function populateTeamDialog(context) {
  const options = state.students.map((student) => `
    <option value="${escapeHtml(student.id)}">${escapeHtml(student.name)} · ${escapeHtml(student.group)}</option>
  `).join("");
  elements.primaryStudent.innerHTML = options;
  elements.partnerStudent.innerHTML = `<option value="">Proyecto individual</option>${options}`;
  elements.sharedProjectChecks.innerHTML = state.pathway.projects.map((project) => `
    <label><input type="checkbox" name="sharedProject" value="${escapeHtml(project.id)}"> ${escapeHtml(project.shortName)}</label>
  `).join("");

  const team = context.team;
  const partner = context.members.find((member) => member.id !== context.student.id);
  elements.teamId.value = team?.id || "";
  elements.primaryStudent.value = context.student.id;
  elements.partnerStudent.value = partner?.id || "";
  elements.teamRepository.value = team?.repository || context.repository || "";
  elements.primaryRole.value = team?.roles?.[context.student.id] || "";
  elements.partnerRole.value = partner ? team?.roles?.[partner.id] || "" : "";
  const shared = new Set(team?.sharedProjectIds || []);
  elements.sharedProjectChecks.querySelectorAll('input[name="sharedProject"]').forEach((input) => {
    input.checked = shared.has(input.value);
  });
  elements.teamDialogTitle.textContent = team ? "Editar pareja" : "Vincular pareja";
  elements.unlinkTeam.hidden = !team;
}

function openTeamDialog() {
  const context = contextForStudent(state.selectedStudentId);
  if (!context) return;
  populateTeamDialog(context);
  elements.teamDialog.showModal();
}

function removeMembersFromTeams(memberIds, exceptTeamId = "") {
  state.teams = state.teams.filter((team) => {
    if (team.id === exceptTeamId) return true;
    return !(team.memberIds || []).some((id) => memberIds.includes(id));
  });
}

function syncSharedRoutes(primaryId, partnerId, projectIds, repository) {
  if (!partnerId) return;
  const primaryRoute = currentRouteState(primaryId);
  const partnerRoute = currentRouteState(partnerId);
  for (const projectId of projectIds) {
    const primaryProject = primaryRoute.projects[projectId];
    const partnerEvidence = partnerRoute.projects[projectId]?.checks?.evidence || false;
    partnerRoute.projects[projectId] = {
      ...primaryProject,
      repository: repository || primaryProject.repository,
      checks: {
        ...primaryProject.checks,
        evidence: partnerEvidence,
      },
      updatedAt: new Date().toISOString(),
    };
    primaryRoute.projects[projectId].repository = repository || primaryProject.repository;
  }
  state.routes[primaryId] = primaryRoute;
  state.routes[partnerId] = partnerRoute;
  saveRoutes("Avance compartido sincronizado");
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

  if (!partnerId) {
    if (existingId) state.teams = state.teams.filter((team) => team.id !== existingId);
    saveTeams();
    elements.teamDialog.close();
    selectStudent(primaryId);
    showToast("El proyecto quedó configurado como individual.");
    return;
  }

  const sharedProjectIds = [...elements.sharedProjectChecks.querySelectorAll('input[name="sharedProject"]:checked')]
    .map((input) => input.value);
  const repository = normalizeRepository(elements.teamRepository.value);
  const team = {
    id: existingId || `team-${memberIds.map(slug).sort().join("-")}-${Date.now().toString(36)}`,
    memberIds,
    project: "Ruta común de proyectos",
    repository,
    goal: "Completar los proyectos seleccionados de la ruta común.",
    sharedProjectIds,
    roles: {
      [primaryId]: elements.primaryRole.value.trim() || "Interfaz, estructura y CSS",
      [partnerId]: elements.partnerRole.value.trim() || "JavaScript, DOM y datos",
    },
    updatedAt: new Date().toISOString(),
  };
  const index = state.teams.findIndex((item) => item.id === team.id);
  if (index >= 0) state.teams[index] = team;
  else state.teams.push(team);
  saveTeams();
  syncSharedRoutes(primaryId, partnerId, sharedProjectIds, repository);
  elements.teamDialog.close();
  selectStudent(primaryId);
  showToast("Pareja y proyectos compartidos guardados.");
}

function unlinkSelectedTeam() {
  const context = contextForStudent(state.selectedStudentId);
  if (!context?.team) return;
  state.teams = state.teams.filter((team) => team.id !== context.team.id);
  saveTeams();
  elements.teamDialog.close();
  selectStudent(state.selectedStudentId);
  showToast("La pareja fue desvinculada. Los avances individuales se conservaron.");
}

async function loadData() {
  const [roster, projectIndex, pathway] = await Promise.all([
    fetchJson("data/students.json", { students: [], referenceStudentId: "" }),
    fetchJson("student-projects/index.json", { projects: {}, benchmark: null }),
    fetchJson("data/common-project-path.json", { projects: [], criteria: [], advancedTrack: {} }),
  ]);
  state.roster = roster.students || [];
  state.referenceStudentId = roster.referenceStudentId || projectIndex.benchmark?.studentId || "";
  state.projectIndex = projectIndex || { projects: {}, benchmark: null };
  state.pathway = pathway;
  loadLocalData();
  for (const student of state.students) routeForStudent(student.id);
  renderPathway();
  renderStudentList();

  const requested = new URLSearchParams(window.location.search).get("student");
  const initial = studentById(requested) || state.students[0];
  if (initial) selectStudent(initial.id);
}

function bindEvents() {
  elements.refresh.addEventListener("click", async () => {
    await loadData();
    showToast("Ruta, repositorios y parejas actualizados.");
  });
  elements.print.addEventListener("click", () => window.print());
  elements.linkTeam.addEventListener("click", openTeamDialog);
  elements.search.addEventListener("input", renderStudentList);
  elements.group.addEventListener("change", renderStudentList);
  elements.mode.addEventListener("change", renderStudentList);
  elements.studentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-student-id]");
    if (button) selectStudent(button.dataset.studentId);
  });
  elements.studentProjectGrid.addEventListener("change", (event) => {
    const card = event.target.closest("[data-project-id]");
    if (!card) return;
    const projectId = card.dataset.projectId;
    if (event.target.matches("[data-criterion-id]")) {
      updateCriterion(projectId, event.target.dataset.criterionId, event.target.checked);
    } else if (event.target.matches('[data-field="variant"]')) {
      updateProjectField(projectId, "variant", event.target.value);
      renderStudentList();
      renderSelected(contextForStudent(state.selectedStudentId));
    } else if (event.target.matches('[data-field="repository"]')) {
      updateProjectField(projectId, "repository", event.target.value);
      renderSelected(contextForStudent(state.selectedStudentId));
    }
  });
  elements.studentProjectGrid.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="set-primary"]');
    if (!button) return;
    const card = button.closest("[data-project-id]");
    if (card) setPrimaryProject(card.dataset.projectId);
  });
  elements.teamForm.addEventListener("submit", saveTeam);
  elements.unlinkTeam.addEventListener("click", unlinkSelectedTeam);
  elements.closeTeamDialog.addEventListener("click", () => elements.teamDialog.close());
  elements.cancelTeam.addEventListener("click", () => elements.teamDialog.close());
}

bindEvents();
loadData().catch((error) => {
  console.error(error);
  showToast("No fue posible iniciar la ruta común.");
});
