export const INTERVIEW_SCORE_WEIGHTS = Object.freeze({
  repository: 30,
  activity: 40,
  evidence: 30,
});

export const EVIDENCE_WEIGHTS = Object.freeze({
  runs: 20,
  concept: 15,
  explains: 20,
  role: 10,
  liveChange: 25,
  commit: 10,
});

const EVIDENCE_LABELS = Object.freeze({
  runs: "La actividad abre y ejecuta",
  concept: "El concepto aplicado es pertinente",
  explains: "Explica entrada, proceso y salida",
  role: "Demuestra su responsabilidad individual",
  liveChange: "Realiza una modificación en vivo",
  commit: "Deja un commit descriptivo",
});

function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, number));
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + 1e-10) * factor) / factor;
}

export function calculateEvidencePercent(evidence = {}) {
  return Object.entries(EVIDENCE_WEIGHTS).reduce((sum, [id, weight]) => {
    return sum + (evidence[id] ? weight : 0);
  }, 0);
}

export function statusFromPercent(percent) {
  if (percent == null) return { id: "pending", label: "Sin evidencia suficiente" };
  if (percent >= 85) return { id: "advanced", label: "Avanzado" };
  if (percent >= 70) return { id: "competent", label: "Competente" };
  if (percent >= 50) return { id: "developing", label: "En desarrollo" };
  if (percent >= 30) return { id: "basic", label: "Básico" };
  return { id: "starting", label: "Inicial" };
}

export function calculateInterviewScore({
  repositoryPercent,
  activityPercent,
  activityStatus = "",
  evidence = {},
} = {}) {
  const repository = clamp(repositoryPercent);
  const activity = clamp(activityPercent);
  const evidencePercent = calculateEvidencePercent(evidence);
  const missingEvidence = Object.keys(EVIDENCE_WEIGHTS)
    .filter((id) => !evidence[id])
    .map((id) => EVIDENCE_LABELS[id]);

  if (repository == null || activity == null) {
    return {
      grade: null,
      percent: null,
      status: statusFromPercent(null),
      components: { repository, activity, evidence: evidencePercent },
      finalizable: false,
      missingEvidence,
      blockers: [
        repository == null ? "No existe diagnóstico técnico del repositorio." : "",
        activity == null ? "No existe diagnóstico de la actividad seleccionada." : "",
      ].filter(Boolean),
      confidence: "low",
    };
  }

  const percent = round(
    repository * (INTERVIEW_SCORE_WEIGHTS.repository / 100)
      + activity * (INTERVIEW_SCORE_WEIGHTS.activity / 100)
      + evidencePercent * (INTERVIEW_SCORE_WEIGHTS.evidence / 100),
    1,
  );
  const grade = round(percent / 20, 2);
  const normalizedStatus = String(activityStatus).trim().toLowerCase();
  const blockedActivity = normalizedStatus.includes("bloque") || normalizedStatus === "blocked";
  const activityReady = normalizedStatus.includes("finalizable")
    || normalizedStatus === "complete"
    || activity >= 80;
  const requiredEvidenceIds = ["runs", "concept", "explains", "role", "liveChange"];
  const requiredEvidenceComplete = requiredEvidenceIds.every((id) => Boolean(evidence[id]));
  const finalizable = !blockedActivity && activityReady && requiredEvidenceComplete;
  const checkedCount = Object.keys(EVIDENCE_WEIGHTS).filter((id) => evidence[id]).length;
  const confidence = checkedCount >= 5 ? "high" : checkedCount >= 3 ? "medium" : "low";
  const blockers = [];

  if (blockedActivity) blockers.push("La actividad está bloqueada por sintaxis, rutas o ejecución.");
  if (!activityReady) blockers.push("La actividad todavía no alcanza el criterio técnico de cierre.");
  for (const id of requiredEvidenceIds) {
    if (!evidence[id]) blockers.push(EVIDENCE_LABELS[id]);
  }

  return {
    grade,
    percent,
    status: statusFromPercent(percent),
    components: {
      repository,
      activity,
      evidence: evidencePercent,
    },
    finalizable,
    missingEvidence,
    blockers: [...new Set(blockers)],
    confidence,
  };
}

export function buildScoreRecommendation(score) {
  if (!score || score.grade == null) {
    return "Primero vincula el repositorio y selecciona una actividad diagnosticada.";
  }
  if (score.finalizable) {
    return "La actividad puede registrarse como finalizada después de confirmar autoría y conservar el SHA del commit revisado.";
  }
  if (score.blockers.some((item) => item.includes("bloqueada"))) {
    return "No asignes cierre: elimina primero el bloqueo y vuelve a ejecutar el flujo completo.";
  }
  if (score.confidence === "low") {
    return "La nota sigue siendo diagnóstica. Verifica ejecución, explicación y una modificación en vivo antes de consolidarla.";
  }
  return `Trabaja el primer requisito pendiente: ${score.blockers[0] || score.missingEvidence[0] || "cerrar el flujo principal"}`;
}
