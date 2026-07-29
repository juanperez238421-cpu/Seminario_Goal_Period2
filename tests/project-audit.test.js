import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { applyBenchmark, auditProject } from "../scripts/project-audit.mjs";

async function createProject(files) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "seminario-audit-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(directory, ...relativePath.split("/"));
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content);
  }
  const filePaths = Object.keys(files);
  return {
    directory,
    scan: {
      files: filePaths,
      filesCount: filePaths.length,
      totalBytes: Object.values(files).reduce((sum, content) => sum + Buffer.byteLength(content), 0),
      htmlFiles: filePaths.filter((file) => /\.html?$/i.test(file)),
    },
  };
}

test("a complete DOM project scores above an empty exercise", async (t) => {
  const advanced = await createProject({
    "index.html": `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width"><title>Gestor</title><link rel="stylesheet" href="styles.css"><script src="app.js" defer></script></head><body><header><h1>Gestor</h1></header><main><form id="form"><label>Nombre<input id="name" required minlength="2"></label><button>Agregar</button></form><section id="result"></section></main><footer>Curso</footer></body></html>`,
    "styles.css": `:root{--primary:#245;} body{font-family:sans-serif;margin:0}.layout{display:grid;gap:1rem}button:hover{opacity:.8}input:focus{outline:2px solid var(--primary)}@media(max-width:600px){.layout{display:block}}`,
    "app.js": `const form=document.querySelector('#form'); const result=document.querySelector('#result'); const items=JSON.parse(localStorage.getItem('items')||'[]'); function render(){result.textContent=items.join(', ')} form.addEventListener('submit',(event)=>{event.preventDefault(); const value=document.querySelector('#name').value.trim(); if(value.length<2){result.textContent='Dato inválido'; return;} items.push(value); localStorage.setItem('items',JSON.stringify(items)); render();}); render();`,
    "README.md": "# Gestor académico\n\nAplicación de ejemplo con instrucciones de ejecución, propósito, autores, validación y persistencia local.\n",
  });
  const basic = await createProject({
    "index.html": "<!doctype html><html><head><title>Document</title><script src=\"app.js\"></script></head><body></body></html>",
    "app.js": "let answer = prompt('dato'); alert(answer);",
  });
  t.after(async () => {
    await fs.rm(advanced.directory, { recursive: true, force: true });
    await fs.rm(basic.directory, { recursive: true, force: true });
  });

  const student = { id: "student", name: "Student", group: "11-A", project: "Project", repository: "owner/repo" };
  const commit = { sha: "abc", message: "feat: complete project flow" };
  const advancedAudit = await auditProject({ ...advanced, student, latestCommit: commit });
  const basicAudit = await auditProject({ ...basic, student, latestCommit: { sha: "def", message: "final" } });

  assert.ok(advancedAudit.score.percent > basicAudit.score.percent);
  assert.equal(advancedAudit.criteria.length, 8);
  assert.equal(advancedAudit.score.provisional, true);
  assert.ok(advancedAudit.feedback.strengths.length > 0);
  assert.ok(basicAudit.feedback.missing.length > 0);
});

test("benchmark selects the highest technical score and computes gaps", () => {
  const criteria = (score) => [
    { id: "html", label: "HTML", score },
    { id: "javascript", label: "JS", score },
  ];
  const index = {
    projects: {
      a: { studentId: "a", name: "A", group: "11-A", project: "A", repository: "a/a", status: "ready", commit: { sha: "a" }, audit: { score: { percent: 80, grade: 4 }, criteria: criteria(4), indicators: { filesCount: 3 } } },
      b: { studentId: "b", name: "B", group: "11-B", project: "B", repository: "b/b", status: "ready", commit: { sha: "b" }, audit: { score: { percent: 60, grade: 3 }, criteria: criteria(3), indicators: { filesCount: 5 } } },
    },
  };

  applyBenchmark(index);
  assert.equal(index.benchmark.studentId, "a");
  assert.equal(index.projects.b.audit.benchmark.relativePercent, 75);
  assert.equal(index.projects.b.audit.benchmark.gaps[0].gap, 1);
});
