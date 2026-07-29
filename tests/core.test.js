import test from "node:test";
import assert from "node:assert/strict";
import {
  attendanceSummary,
  calculateGrade,
  calculateProgress,
  createEmptyMilestones,
  getCommitState,
  normalizeRepository,
} from "../js/core.js";

test("calcula la nota ponderada con la rúbrica completa", () => {
  const grade = calculateGrade({
    html: 4,
    javascript: 3.5,
    domEvents: 4,
    css: 3,
    storage: 4,
    validation: 3.5,
    integration: 4,
    gitDocs: 3,
  });
  assert.equal(grade, 3.65);
});

test("mantiene la nota pendiente cuando falta un criterio", () => {
  assert.equal(calculateGrade({ html: 4 }), null);
});

test("calcula el avance técnico", () => {
  const milestones = createEmptyMilestones();
  milestones.html = true;
  milestones.css = true;
  milestones.javascript = true;
  assert.deepEqual(calculateProgress(milestones), {
    completed: 3,
    total: 11,
    percentage: 27,
  });
});

test("normaliza una URL de GitHub", () => {
  assert.equal(
    normalizeRepository("https://github.com/usuario/proyecto.git"),
    "usuario/proyecto"
  );
});

test("detecta el estado de revisión del commit", () => {
  assert.equal(getCommitState("abc", null), "unreviewed");
  assert.equal(getCommitState("abc", "abc"), "reviewed");
  assert.equal(getCommitState("def", "abc"), "new");
});

test("resume la asistencia", () => {
  const summary = attendanceSummary(
    [{ id: "a" }, { id: "b" }, { id: "c" }],
    {
      a: { status: "present" },
      b: { status: "late" },
    }
  );
  assert.deepEqual(summary, {
    total: 3,
    recorded: 2,
    present: 1,
    late: 1,
    absent: 0,
    excused: 0,
  });
});
