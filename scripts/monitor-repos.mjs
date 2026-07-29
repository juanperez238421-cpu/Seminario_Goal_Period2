import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const rosterPath = path.join(root, "data", "students.json");
const latestPath = path.join(root, "data", "monitor", "latest.json");
const historyPath = path.join(root, "data", "monitor", "history.json");
const summaryPath = path.join(root, "data", "monitor", "summary.md");

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function fetchLatestCommit(repository) {
  const response = await fetch(`https://api.github.com/repos/${repository}/commits?per_page=1`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Seminario-Goal-Monitor",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error("Repositorio no encontrado o no público");
    if (response.status === 403) throw new Error("Límite de GitHub alcanzado");
    throw new Error(`GitHub respondió ${response.status}`);
  }

  const [commit] = await response.json();
  if (!commit) throw new Error("Repositorio sin commits");

  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: String(commit.commit?.message || "Commit sin mensaje").split("\n")[0],
    author: commit.author?.login || commit.commit?.author?.name || "Autor no identificado",
    date: commit.commit?.committer?.date || commit.commit?.author?.date || null,
    url: commit.html_url,
  };
}

const roster = await readJson(rosterPath, { students: [] });
const previous = await readJson(latestPath, { students: {} });
const history = await readJson(historyPath, { events: [] });
const generatedAt = new Date().toISOString();
const result = {
  generatedAt,
  repositoriesChecked: 0,
  updatesDetected: 0,
  students: {},
};
const newEvents = [];

for (const student of roster.students) {
  if (!student.repository) {
    result.students[student.id] = {
      studentId: student.id,
      name: student.name,
      group: student.group,
      repository: "",
      status: "pending",
      checkedAt: generatedAt,
    };
    continue;
  }

  result.repositoriesChecked += 1;
  try {
    const latestCommit = await fetchLatestCommit(student.repository);
    const previousSha = previous.students?.[student.id]?.latestCommit?.sha || null;
    const changed = Boolean(previousSha && previousSha !== latestCommit.sha);
    const firstObservation = !previousSha;
    if (changed) result.updatesDetected += 1;

    result.students[student.id] = {
      studentId: student.id,
      name: student.name,
      group: student.group,
      repository: student.repository,
      status: "ok",
      changed,
      firstObservation,
      previousSha,
      latestCommit,
      checkedAt: generatedAt,
    };

    if (changed || firstObservation) {
      newEvents.push({
        id: `${student.id}-${latestCommit.sha}`,
        type: firstObservation ? "baseline" : "new-commit",
        studentId: student.id,
        name: student.name,
        group: student.group,
        repository: student.repository,
        detectedAt: generatedAt,
        commit: latestCommit,
      });
    }
  } catch (error) {
    result.students[student.id] = {
      studentId: student.id,
      name: student.name,
      group: student.group,
      repository: student.repository,
      status: "error",
      error: error.message,
      checkedAt: generatedAt,
    };
    newEvents.push({
      id: `${student.id}-error-${generatedAt}`,
      type: "monitor-error",
      studentId: student.id,
      name: student.name,
      group: student.group,
      repository: student.repository,
      detectedAt: generatedAt,
      error: error.message,
    });
  }
}

const knownEventIds = new Set(history.events.map((event) => event.id));
const mergedHistory = [...newEvents.filter((event) => !knownEventIds.has(event.id)), ...history.events]
  .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
  .slice(0, 500);

const summaryLines = [
  "# Monitor de repositorios — Seminario Goal",
  "",
  `- Última ejecución: ${generatedAt}`,
  `- Repositorios consultados: ${result.repositoriesChecked}`,
  `- Actualizaciones detectadas: ${result.updatesDetected}`,
  "",
  "| Grupo | Estudiante | Repositorio | Estado | Último commit |",
  "|---|---|---|---|---|",
  ...roster.students.map((student) => {
    const entry = result.students[student.id];
    const commit = entry?.latestCommit;
    const state = !student.repository
      ? "Pendiente"
      : entry?.status === "error"
        ? `Error: ${entry.error}`
        : entry?.changed
          ? "Commit nuevo"
          : "Sin cambios";
    const commitText = commit ? `${commit.shortSha} — ${commit.message}` : "—";
    return `| ${student.group} | ${student.name} | ${student.repository || "—"} | ${state} | ${commitText} |`;
  }),
  "",
];

await fs.mkdir(path.dirname(latestPath), { recursive: true });
await fs.writeFile(latestPath, `${JSON.stringify(result, null, 2)}\n`);
await fs.writeFile(historyPath, `${JSON.stringify({ events: mergedHistory }, null, 2)}\n`);
await fs.writeFile(summaryPath, `${summaryLines.join("\n")}\n`);

console.log(`Monitor finalizado: ${result.repositoriesChecked} repositorios, ${result.updatesDetected} actualizaciones.`);
