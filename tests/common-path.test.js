import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStudentRoute,
  emptyChecks,
  inferPrimaryProjectId,
  nextMissingCriterion,
  percentFromChecks,
  projectProgress,
  routeProgress,
  statusFromPercent,
  teamForStudent,
} from "../js/common-path-core.js";

const pathway = {
  criteria: [
    { id: "interface" },
    { id: "functionality" },
    { id: "data" },
    { id: "css" },
    { id: "evidence" },
  ],
  projects: [
    { id: "registration", shortName: "Registro", allowedVariants: ["Registro estudiantil"] },
    { id: "operations", shortName: "Operaciones", allowedVariants: ["Carrito"] },
    { id: "integration", shortName: "Integración", allowedVariants: ["Resumen"] },
  ],
};

test("cada criterio representa veinte por ciento", () => {
  assert.equal(percentFromChecks({ interface: true, functionality: true }), 40);
  assert.equal(percentFromChecks({
    interface: true,
    functionality: true,
    data: true,
    css: true,
    evidence: true,
  }), 100);
});

test("clasifica el proyecto con estados simples", () => {
  assert.equal(statusFromPercent(0).id, "not-started");
  assert.equal(statusFromPercent(20).id, "building");
  assert.equal(statusFromPercent(60).id, "functional");
  assert.equal(statusFromPercent(100).id, "complete");
});

test("prioriza el primer criterio pendiente", () => {
  assert.equal(nextMissingCriterion({ interface: true, functionality: false }), "functionality");
  assert.equal(nextMissingCriterion({
    interface: true,
    functionality: true,
    data: true,
    css: true,
    evidence: true,
  }), null);
});

test("calcula el promedio de la ruta de tres proyectos", () => {
  const projects = {
    registration: { checks: { ...emptyChecks(), interface: true } },
    operations: { checks: { ...emptyChecks(), interface: true, functionality: true } },
    integration: { checks: emptyChecks() },
  };
  assert.equal(routeProgress(projects, ["registration", "operations", "integration"]), 20);
});

test("mapea los proyectos existentes a la ruta común", () => {
  assert.equal(inferPrimaryProjectId("Registro de actividades"), "registration");
  assert.equal(inferPrimaryProjectId("Carrito de restaurante"), "operations");
  assert.equal(inferPrimaryProjectId("Cajero automático"), "operations");
});

test("construye una ruta sin inventar avance en proyectos no relacionados", () => {
  const route = buildStudentRoute({
    student: {
      id: "a",
      project: "Carrito de restaurante",
      repository: "usuario/carrito",
    },
    auditProject: {
      audit: {
        criteria: [
          { id: "html", percent: 68 },
          { id: "javascript", percent: 88 },
          { id: "domEvents", percent: 76 },
          { id: "validation", percent: 32 },
          { id: "storage", percent: 60 },
          { id: "css", percent: 72 },
          { id: "integration", percent: 100 },
        ],
      },
    },
    pathway,
    savedRoute: {},
  });
  assert.equal(route.primaryProjectId, "operations");
  assert.equal(projectProgress(route.projects.operations).percent, 80);
  assert.equal(projectProgress(route.projects.registration).percent, 0);
  assert.equal(projectProgress(route.projects.integration).percent, 0);
});

test("encuentra la pareja de un estudiante", () => {
  const team = { id: "t1", memberIds: ["a", "b"] };
  assert.equal(teamForStudent([team], "b"), team);
  assert.equal(teamForStudent([team], "c"), null);
});
