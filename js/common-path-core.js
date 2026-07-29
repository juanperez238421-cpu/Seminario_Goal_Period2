export const COMMON_CRITERION_IDS = Object.freeze([
  "interface",
  "functionality",
  "data",
  "css",
  "evidence",
]);

export function normalizeRepository(value = "") {
  return String(value)
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

export function emptyChecks() {
  return Object.fromEntries(COMMON_CRITERION_IDS.map((id) => [id, false]));
}

export function percentFromChecks(checks = {}) {
  const completed = COMMON_CRITERION_IDS.filter((id) => Boolean(checks[id])).length;
  return completed * 20;
}

export function statusFromPercent(percent) {
  const value = Number(percent) || 0;
  if (value >= 100) return { id: "complete", label: "Completo", action: "Mantener y mejorar" };
  if (value >= 60) return { id: "functional", label: "Funcional parcial", action: "Cerrar faltantes" };
  if (value >= 20) return { id: "building", label: "En construcción", action: "Continuar desarrollo" };
  return { id: "not-started", label: "Sin iniciar", action: "Crear estructura" };
}

export function projectProgress(projectState = {}) {
  const checks = { ...emptyChecks(), ...(projectState.checks || {}) };
  const percent = percentFromChecks(checks);
  return {
    checks,
    percent,
    status: statusFromPercent(percent),
  };
}

export function routeProgress(projectStates = {}, projectIds = []) {
  if (!projectIds.length) return 0;
  const total = projectIds.reduce((sum, id) => sum + projectProgress(projectStates[id]).percent, 0);
  return Math.round(total / projectIds.length);
}

export function inferPrimaryProjectId(projectName = "") {
  const text = String(projectName).toLowerCase();
  if (/registro|formulario|inscrip|usuario|actividad/.test(text)) return "registration";
  if (/carrito|delivery|pedido|cajero|atm|inventario|tarea|nota|calculadora/.test(text)) return "operations";
  return "operations";
}

function criterionPercent(audit, id) {
  const criterion = audit?.criteria?.find((item) => item.id === id);
  const value = Number(criterion?.percent);
  return Number.isFinite(value) ? value : 0;
}

export function inferInitialChecks({ audit, projectName, projectId } = {}) {
  if (!audit || projectId !== inferPrimaryProjectId(projectName)) return emptyChecks();
  const html = criterionPercent(audit, "html");
  const javascript = criterionPercent(audit, "javascript");
  const dom = criterionPercent(audit, "domEvents");
  const validation = criterionPercent(audit, "validation");
  const storage = criterionPercent(audit, "storage");
  const css = criterionPercent(audit, "css");
  const integration = criterionPercent(audit, "integration");

  return {
    interface: html >= 45,
    functionality: javascript >= 35 && dom >= 20 && integration >= 45,
    data: validation >= 45 || storage >= 50,
    css: css >= 50,
    evidence: false,
  };
}

export function nextMissingCriterion(checks = {}) {
  return COMMON_CRITERION_IDS.find((id) => !checks[id]) || null;
}

export function buildStudentRoute({ student, auditProject, pathway, savedRoute = {} } = {}) {
  const projects = pathway?.projects || [];
  const primaryProjectId = savedRoute.primaryProjectId || inferPrimaryProjectId(student?.project || "");
  const states = {};

  for (const project of projects) {
    const saved = savedRoute.projects?.[project.id];
    const checks = saved?.checks
      ? { ...emptyChecks(), ...saved.checks }
      : inferInitialChecks({
          audit: auditProject?.audit,
          projectName: student?.project,
          projectId: project.id,
        });
    states[project.id] = {
      variant: saved?.variant || (project.id === primaryProjectId ? student?.project || project.shortName : project.allowedVariants?.[0] || project.shortName),
      repository: normalizeRepository(saved?.repository || (project.id === primaryProjectId ? student?.repository || "" : "")),
      checks,
      notes: saved?.notes || "",
      updatedAt: saved?.updatedAt || null,
    };
  }

  return {
    primaryProjectId,
    projects: states,
    percent: routeProgress(states, projects.map((project) => project.id)),
  };
}

export function teamForStudent(teams = [], studentId = "") {
  return teams.find((team) => Array.isArray(team.memberIds) && team.memberIds.includes(studentId)) || null;
}

export function membersForTeam(team, students = []) {
  if (!team) return [];
  const ids = new Set(team.memberIds || []);
  return students.filter((student) => ids.has(student.id));
}

export function buildInterviewInstruction({ project, progress, criterionLabels = {} } = {}) {
  if (!project) return "Selecciona un proyecto de la ruta común.";
  const missingId = nextMissingCriterion(progress?.checks || {});
  if (!missingId) return `El proyecto ${project.shortName} cumple los cinco criterios. Pide una mejora pequeña y confirma autoría.`;
  const label = criterionLabels[missingId] || missingId;
  return `Revisa ${project.shortName}. El siguiente objetivo único es completar: ${label}.`;
}
