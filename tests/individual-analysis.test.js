import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAuditSummary,
  criterionLevel,
  criterionPercent,
  priorityCriterion,
  projectGap,
} from "../js/individual-analysis-core.js";

test("convierte puntaje de cinco a porcentaje", () => {
  assert.equal(criterionPercent({ score: 3.6 }), 72);
  assert.equal(criterionPercent({ percent: 64 }), 64);
});

test("clasifica el nivel de un criterio", () => {
  assert.equal(criterionLevel(82).id, "complete");
  assert.equal(criterionLevel(68).id, "functional");
  assert.equal(criterionLevel(42).id, "partial");
  assert.equal(criterionLevel(20).id, "initial");
});

test("prioriza la competencia funcional mas debil", () => {
  const priority = priorityCriterion([
    { id: "html", score: 3.4 },
    { id: "javascript", score: 4.4 },
    { id: "validation", score: 1.6 },
    { id: "gitDocs", score: 0 },
  ]);
  assert.equal(priority.id, "validation");
});

test("calcula distancia positiva frente al referente", () => {
  assert.equal(projectGap(42, 71), 29);
  assert.equal(projectGap(80, 71), 0);
});

test("mantiene pendiente al estudiante sin repositorio auditado", () => {
  const summary = buildAuditSummary({
    student: { name: "Estudiante" },
    project: null,
    benchmark: { percent: 71 },
  });
  assert.equal(summary.evaluable, false);
  assert.equal(summary.grade, null);
});

test("resume fortalezas brechas y riesgos del proyecto", () => {
  const summary = buildAuditSummary({
    student: { name: "Estudiante" },
    benchmark: { percent: 71 },
    project: {
      audit: {
        score: { grade: 2.5, percent: 50 },
        criteria: [
          {
            id: "html",
            label: "HTML",
            score: 3,
            evidence: ["Interfaz visible"],
            missing: [],
            risk: [],
          },
          {
            id: "css",
            label: "CSS",
            score: 0,
            evidence: [],
            missing: ["Crear estilos"],
            risk: ["Sin capa visual"],
          },
        ],
      },
    },
  });
  assert.equal(summary.evaluable, true);
  assert.equal(summary.gap, 21);
  assert.equal(summary.strongest.id, "html");
  assert.equal(summary.priority.id, "css");
  assert.match(summary.missing[0], /CSS/);
  assert.match(summary.risks[0], /Sin capa visual/);
});
