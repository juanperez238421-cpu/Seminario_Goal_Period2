export const CRITERION_ORDER = Object.freeze([
  "html",
  "javascript",
  "domEvents",
  "css",
  "storage",
  "validation",
  "integration",
  "gitDocs",
]);

const LEVELS = Object.freeze([
  { minimum: 80, id: "complete", label: "Cercano al cierre" },
  { minimum: 65, id: "functional", label: "Funcional" },
  { minimum: 35, id: "partial", label: "Parcial" },
  { minimum: 0, id: "initial", label: "Inicial" },
]);

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function clampPercent(value) {
  const number = finiteNumber(value);
  if (number == null) return null;
  return Math.max(0, Math.min(100, number));
}

export function criterionPercent(criterion = {}) {
  const explicit = clampPercent(criterion.percent);
  if (explicit != null) return Math.round(explicit);
  const score = finiteNumber(criterion.score);
  return score == null ? null : Math.round(Math.max(0, Math.min(5, score)) * 20);
}

export function criterionLevel(value) {
  const percent = clampPercent(value);
  if (percent == null) return { id: "pending", label: "Sin evidencia", percent: null };
  const level = LEVELS.find((item) => percent >= item.minimum) || LEVELS.at(-1);
  return { ...level, percent: Math.round(percent) };
}

export function sortCriteria(criteria = []) {
  const order = new Map(CRITERION_ORDER.map((id, index) => [id, index]));
  return [...criteria].sort((a, b) => {
    const aOrder = order.has(a.id) ? order.get(a.id) : 999;
    const bOrder = order.has(b.id) ? order.get(b.id) : 999;
    return aOrder - bOrder;
  });
}

export function strongestCriterion(criteria = []) {
  return [...criteria]
    .filter((criterion) => criterionPercent(criterion) != null)
    .sort((a, b) => criterionPercent(b) - criterionPercent(a))[0] || null;
}

export function priorityCriterion(criteria = []) {
  const functionalIds = new Set(["html", "javascript", "domEvents", "validation", "integration", "storage", "css"]);
  const functional = criteria.filter((criterion) => functionalIds.has(criterion.id));
  const source = functional.length ? functional : criteria;
  return [...source]
    .filter((criterion) => criterionPercent(criterion) != null)
    .sort((a, b) => {
      const difference = criterionPercent(a) - criterionPercent(b);
      if (difference !== 0) return difference;
      return CRITERION_ORDER.indexOf(a.id) - CRITERION_ORDER.indexOf(b.id);
    })[0] || null;
}

export function projectGap(projectPercent, benchmarkPercent) {
  const project = clampPercent(projectPercent);
  const benchmark = clampPercent(benchmarkPercent);
  if (project == null || benchmark == null) return null;
  return Math.max(0, Math.round((benchmark - project) * 10) / 10);
}

export function uniqueItems(items = [], limit = Infinity) {
  return [...new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))].slice(0, limit);
}

export function collectAuditItems(criteria = [], field, limit = 12) {
  const values = [];
  for (const criterion of sortCriteria(criteria)) {
    for (const item of criterion?.[field] || []) {
      values.push(`${criterion.label}: ${item}`);
    }
  }
  return uniqueItems(values, limit);
}

export function buildAuditSummary({ student = {}, project = null, benchmark = null } = {}) {
  const audit = project?.audit || null;
  if (!audit?.score) {
    return {
      evaluable: false,
      grade: null,
      percent: null,
      level: criterionLevel(null),
      gap: null,
      strongest: null,
      priority: null,
      evidence: [],
      missing: [],
      risks: [],
      message: `${student.name || "El estudiante"} todavía no tiene un repositorio auditado.`,
    };
  }

  const criteria = Array.isArray(audit.criteria) ? audit.criteria : [];
  const percent = clampPercent(audit.score.percent);
  const grade = finiteNumber(audit.score.grade);
  const strongest = strongestCriterion(criteria);
  const priority = priorityCriterion(criteria);
  const gap = projectGap(percent, benchmark?.percent);

  return {
    evaluable: true,
    grade,
    percent,
    level: criterionLevel(percent),
    gap,
    strongest,
    priority,
    evidence: collectAuditItems(criteria, "evidence"),
    missing: collectAuditItems(criteria, "missing"),
    risks: collectAuditItems(criteria, "risk"),
    message: `${student.name || "El estudiante"} tiene un diagnóstico técnico provisional de ${grade?.toFixed(2) || "—"}/5.00 (${Math.round(percent)}%).`,
  };
}
