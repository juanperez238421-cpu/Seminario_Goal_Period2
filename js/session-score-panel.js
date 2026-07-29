import { buildScoreRecommendation, calculateInterviewScore } from "./interview-score.js";

const STORAGE_KEY = "seminario-goal-p2-interview-scores-v1";

const SELECTORS = {
  studentName: "#studentName",
  repositoryPercent: "#technicalPercent",
  activityPercent: "#activityPercent",
  activityStatus: "#activityStatus",
  activityPath: "#activityPath",
  saveButton: "#saveSessionButton",
  interviewPanel: ".interview-panel",
  heading: ".interview-panel > .panel-heading",
  checks: {
    runs: "#checkRuns",
    concept: "#checkConcept",
    explains: "#checkExplains",
    role: "#checkRole",
    liveChange: "#checkLiveChange",
    commit: "#checkCommit",
  },
};

function parsePercent(text) {
  const match = String(text || "").match(/(\d+(?:[.,]\d+)?)\s*%/);
  return match ? Number(match[1].replace(",", ".")) : null;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadSnapshots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readEvidence() {
  return Object.fromEntries(
    Object.entries(SELECTORS.checks).map(([id, selector]) => [id, Boolean(document.querySelector(selector)?.checked)]),
  );
}

function readCurrentInput() {
  return {
    repositoryPercent: parsePercent(document.querySelector(SELECTORS.repositoryPercent)?.textContent),
    activityPercent: parsePercent(document.querySelector(SELECTORS.activityPercent)?.textContent),
    activityStatus: document.querySelector(SELECTORS.activityStatus)?.textContent || "",
    evidence: readEvidence(),
  };
}

function progressBar(label, value, className = "") {
  const safe = value == null ? 0 : Math.max(0, Math.min(100, value));
  return `
    <div class="score-component ${className}">
      <div><span>${escapeHtml(label)}</span><strong>${value == null ? "—" : `${Math.round(value)}%`}</strong></div>
      <div class="score-track"><span style="width:${safe}%"></span></div>
    </div>
  `;
}

function ensurePanel() {
  let panel = document.querySelector("#sessionScorePanel");
  if (panel) return panel;
  const host = document.querySelector(SELECTORS.interviewPanel);
  const heading = document.querySelector(SELECTORS.heading);
  if (!host || !heading) return null;

  panel = document.createElement("section");
  panel.id = "sessionScorePanel";
  panel.className = "session-score-panel";
  panel.setAttribute("aria-live", "polite");
  panel.innerHTML = `
    <div class="session-score-heading">
      <div>
        <span>Valoración orientadora</span>
        <strong id="sessionScoreGrade">—</strong>
        <small id="sessionScoreStatus">Sin evidencia suficiente</small>
      </div>
      <span class="score-confidence" id="sessionScoreConfidence">Confianza baja</span>
    </div>
    <div id="sessionScoreComponents"></div>
    <div class="completion-gate" id="completionGate"></div>
    <p class="score-recommendation" id="scoreRecommendation"></p>
    <p class="score-disclaimer">Combina diagnóstico del repositorio, estado de la actividad y evidencias observadas. No reemplaza la sustentación docente.</p>
  `;
  heading.insertAdjacentElement("afterend", panel);
  return panel;
}

function confidenceLabel(value) {
  if (value === "high") return "Confianza alta";
  if (value === "medium") return "Confianza media";
  return "Confianza baja";
}

function render() {
  const panel = ensurePanel();
  if (!panel) return;
  const score = calculateInterviewScore(readCurrentInput());
  const grade = panel.querySelector("#sessionScoreGrade");
  const status = panel.querySelector("#sessionScoreStatus");
  const confidence = panel.querySelector("#sessionScoreConfidence");
  const components = panel.querySelector("#sessionScoreComponents");
  const gate = panel.querySelector("#completionGate");
  const recommendation = panel.querySelector("#scoreRecommendation");

  grade.textContent = score.grade == null ? "—" : score.grade.toFixed(2);
  status.textContent = score.grade == null
    ? score.status.label
    : `${score.percent}% · ${score.status.label} · provisional`;
  confidence.textContent = confidenceLabel(score.confidence);
  confidence.dataset.level = score.confidence;
  components.innerHTML = [
    progressBar("Repositorio", score.components.repository),
    progressBar("Actividad", score.components.activity),
    progressBar("Evidencia individual", score.components.evidence, "individual"),
  ].join("");

  if (score.finalizable) {
    gate.className = "completion-gate is-ready";
    gate.innerHTML = `<strong>Actividad verificable como finalizada</strong><span>Conserva el SHA y la evidencia individual.</span>`;
  } else {
    const pending = score.blockers.slice(0, 3);
    gate.className = "completion-gate is-pending";
    gate.innerHTML = `
      <strong>Cierre pendiente</strong>
      <ul>${pending.length ? pending.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>Completa la revisión individual.</li>"}</ul>
    `;
  }
  recommendation.textContent = buildScoreRecommendation(score);
  panel.dataset.finalizable = String(score.finalizable);
  panel.dataset.grade = score.grade == null ? "" : String(score.grade);
}

function saveSnapshot() {
  const studentName = document.querySelector(SELECTORS.studentName)?.textContent?.trim();
  if (!studentName || studentName === "Selecciona un estudiante") return;
  const input = readCurrentInput();
  const score = calculateInterviewScore(input);
  const activityPath = document.querySelector(SELECTORS.activityPath)?.textContent?.trim() || "sin-actividad";
  const snapshots = loadSnapshots();
  const key = `${studentName}::${activityPath}`;
  snapshots[key] ||= [];
  snapshots[key].unshift({
    studentName,
    activityPath,
    savedAt: new Date().toISOString(),
    input,
    score,
  });
  snapshots[key] = snapshots[key].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

function bind() {
  ensurePanel();
  document.querySelectorAll(Object.values(SELECTORS.checks).join(",")).forEach((control) => {
    control.addEventListener("change", render);
  });
  document.querySelector(SELECTORS.saveButton)?.addEventListener("click", () => {
    window.setTimeout(saveSnapshot, 0);
  });

  const observerTargets = [
    document.querySelector(SELECTORS.repositoryPercent),
    document.querySelector(SELECTORS.activityPercent),
    document.querySelector(SELECTORS.activityStatus),
    document.querySelector(SELECTORS.studentName),
  ].filter(Boolean);
  const observer = new MutationObserver(render);
  observerTargets.forEach((target) => observer.observe(target, { childList: true, subtree: true, characterData: true }));
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind, { once: true });
} else {
  bind();
}
