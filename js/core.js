export const RUBRIC = [
  { id: "html", label: "HTML y estructura semántica", weight: 15 },
  { id: "javascript", label: "JavaScript y lógica", weight: 20 },
  { id: "domEvents", label: "DOM, funciones y eventos", weight: 15 },
  { id: "css", label: "CSS y presentación", weight: 15 },
  { id: "storage", label: "Navegación y localStorage", weight: 10 },
  { id: "validation", label: "Validación y manejo de errores", weight: 10 },
  { id: "integration", label: "Integración del flujo completo", weight: 10 },
  { id: "gitDocs", label: "Commits y documentación", weight: 5 },
];

export const MILESTONES = [
  { id: "html", label: "Estructura HTML visible y organizada" },
  { id: "css", label: "CSS conectado y organizado" },
  { id: "javascript", label: "JavaScript conectado correctamente" },
  { id: "events", label: "Eventos asociados a la interfaz" },
  { id: "dom", label: "Resultados renderizados con DOM" },
  { id: "validation", label: "Validación real de entradas" },
  { id: "processing", label: "Funciones de procesamiento reutilizables" },
  { id: "storage", label: "Navegación o persistencia con localStorage" },
  { id: "integration", label: "Flujo principal completo de inicio a fin" },
  { id: "readme", label: "README con propósito e instrucciones" },
  { id: "commits", label: "Commits pequeños y descriptivos" },
];

export const TRACKS = {
  core: {
    label: "Consolidación funcional",
    description: "Completar una aplicación integrada antes de ampliar el alcance.",
  },
  css: {
    label: "Especialización CSS",
    description: "Mejorar jerarquía visual, responsive, accesibilidad y componentes reutilizables.",
  },
};

export function clampScore(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(5, Math.max(0, Math.round(numeric * 10) / 10));
}

export function createEmptyRubric() {
  return Object.fromEntries(RUBRIC.map(({ id }) => [id, null]));
}

export function createEmptyMilestones() {
  return Object.fromEntries(MILESTONES.map(({ id }) => [id, false]));
}

export function calculateGrade(scores = {}) {
  const normalized = RUBRIC.map((criterion) => clampScore(scores[criterion.id]));
  if (normalized.some((score) => score === null)) return null;
  const grade = RUBRIC.reduce((sum, criterion, index) => {
    return sum + normalized[index] * (criterion.weight / 100);
  }, 0);
  return Math.round(grade * 100) / 100;
}

export function calculateProgress(milestones = {}) {
  const completed = MILESTONES.filter(({ id }) => Boolean(milestones[id])).length;
  return {
    completed,
    total: MILESTONES.length,
    percentage: Math.round((completed / MILESTONES.length) * 100),
  };
}

export function normalizeRepository(value = "") {
  return String(value)
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

export function getCommitState(latestSha, reviewedSha) {
  if (!latestSha) return "unknown";
  if (!reviewedSha) return "unreviewed";
  return latestSha === reviewedSha ? "reviewed" : "new";
}

export function isEvidenceVerified(evidence = {}) {
  return Boolean(
    evidence.runs &&
    evidence.explains &&
    evidence.liveChange &&
    evidence.authorship
  );
}

export function getStudentStatus(student) {
  if (student.academicStatus === "paused") return "paused";
  const progress = calculateProgress(student.milestones);
  const grade = calculateGrade(student.rubric);
  const commitState = getCommitState(student.latestCommit?.sha, student.lastReviewedSha);
  if (commitState === "new") return "new-commit";
  if (progress.percentage === 100 && grade !== null && grade >= 4.5 && isEvidenceVerified(student.evidence)) {
    return "complete";
  }
  if (progress.percentage >= 70) return "advanced";
  if (progress.percentage >= 40) return "developing";
  return "starting";
}

export function createStudent(base = {}, override = {}) {
  const merged = { ...base, ...override };
  const repository = normalizeRepository(merged.repository || "");
  return {
    id: String(merged.id || "").trim(),
    listNumber: Number(merged.listNumber || 0),
    name: String(merged.name || "Estudiante").trim(),
    group: String(merged.group || "11°").trim(),
    github: String(merged.github || repository.split("/")[0] || "").trim(),
    repository,
    repositoryStatus: merged.repositoryStatus || (repository ? "provisional" : "pending"),
    project: String(merged.project || "Proyecto por registrar").trim(),
    track: merged.track === "css" ? "css" : "core",
    academicStatus: merged.academicStatus === "paused" ? "paused" : "active",
    goal: String(merged.goal || "Definir una meta concreta y verificable.").trim(),
    goalDate: merged.goalDate || "",
    goalStatus: merged.goalStatus || "not-started",
    milestones: { ...createEmptyMilestones(), ...(merged.milestones || {}) },
    rubric: { ...createEmptyRubric(), ...(merged.rubric || {}) },
    evidence: {
      runs: false,
      explains: false,
      liveChange: false,
      authorship: false,
      ...(merged.evidence || {}),
    },
    notes: String(merged.notes || "").trim(),
    latestCommit: merged.latestCommit || null,
    lastReviewedSha: merged.lastReviewedSha || null,
    updatedAt: merged.updatedAt || null,
  };
}

export function attendanceSummary(students = [], attendanceForDate = {}) {
  const statuses = Object.values(attendanceForDate).map((entry) => entry?.status).filter(Boolean);
  return {
    total: students.length,
    recorded: statuses.length,
    present: statuses.filter((status) => status === "present").length,
    late: statuses.filter((status) => status === "late").length,
    absent: statuses.filter((status) => status === "absent").length,
    excused: statuses.filter((status) => status === "excused").length,
  };
}
