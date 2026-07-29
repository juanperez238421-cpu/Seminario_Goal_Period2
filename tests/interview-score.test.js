import test from "node:test";
import assert from "node:assert/strict";
import {
  buildScoreRecommendation,
  calculateEvidencePercent,
  calculateInterviewScore,
} from "../js/interview-score.js";

test("calcula el porcentaje de evidencia individual", () => {
  assert.equal(calculateEvidencePercent({
    runs: true,
    concept: true,
    explains: true,
    role: false,
    liveChange: true,
    commit: false,
  }), 80);
});

test("combina repositorio actividad y evidencia en escala de cinco", () => {
  const score = calculateInterviewScore({
    repositoryPercent: 71,
    activityPercent: 80,
    activityStatus: "Finalizable",
    evidence: {
      runs: true,
      concept: true,
      explains: true,
      role: true,
      liveChange: true,
      commit: false,
    },
  });
  assert.equal(score.percent, 80.3);
  assert.equal(score.grade, 4.02);
  assert.equal(score.finalizable, true);
  assert.equal(score.confidence, "high");
});

test("no permite cierre cuando la actividad esta bloqueada", () => {
  const score = calculateInterviewScore({
    repositoryPercent: 90,
    activityPercent: 90,
    activityStatus: "Bloqueada",
    evidence: {
      runs: true,
      concept: true,
      explains: true,
      role: true,
      liveChange: true,
      commit: true,
    },
  });
  assert.equal(score.finalizable, false);
  assert.match(buildScoreRecommendation(score), /No asignes cierre/);
});

test("mantiene la nota pendiente sin diagnostico tecnico", () => {
  const score = calculateInterviewScore({
    repositoryPercent: null,
    activityPercent: null,
    evidence: {},
  });
  assert.equal(score.grade, null);
  assert.equal(score.finalizable, false);
  assert.equal(score.blockers.length, 2);
});
