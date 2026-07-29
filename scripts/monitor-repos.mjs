import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const rosterPath = path.join(root, "data", "students.json");
const latestPath = path.join(root, "data", "monitor", "latest.json");
const historyPath = path.join(root, "data", "monitor", "history.json");
const summaryPath = path.join(root, "data", "monitor", "summary.md");
const projectsRoot = path.join(root, "student-projects");
const tempRoot = path.join(root, ".student-projects-tmp");
const projectIndexPath = path.join(projectsRoot, "index.json");
const MAX_PROJECT_BYTES = 50 * 1024 * 1024;
const MAX_PROJECT_FILES = 5000;

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "Seminario-Goal-Monitor",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

async function fetchLatestCommit(repository) {
  const response = await fetch(`https://api.github.com/repos/${repository}/commits?per_page=1`, {
    headers: githubHeaders(),
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

function assertSafeStudentId(studentId) {
  if (!/^[a-z0-9-]+$/i.test(studentId)) {
    throw new Error("Identificador de estudiante no seguro");
  }
}

async function runGit(args, cwd = root) {
  const { stdout, stderr } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (stderr?.trim()) console.log(stderr.trim());
  return stdout.trim();
}

async function scanProject(directory) {
  const files = [];
  let totalBytes = 0;

  async function walk(currentDirectory) {
    const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name);
      const relativePath = path.relative(directory, absolutePath).split(path.sep).join("/");

      if (entry.isSymbolicLink()) {
        await fs.rm(absolutePath, { force: true });
        continue;
      }
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;

      const stat = await fs.stat(absolutePath);
      totalBytes += stat.size;
      files.push(relativePath);

      if (files.length > MAX_PROJECT_FILES) {
        throw new Error(`El repositorio supera ${MAX_PROJECT_FILES} archivos`);
      }
      if (totalBytes > MAX_PROJECT_BYTES) {
        throw new Error("El repositorio supera el límite local de 50 MB");
      }
    }
  }

  await walk(directory);
  return {
    files,
    filesCount: files.length,
    totalBytes,
    htmlFiles: files.filter((file) => /\.html?$/i.test(file)),
  };
}

function scoreEntryPath(filePath) {
  const normalized = filePath.toLowerCase();
  if (normalized === "index.html") return -1000;
  if (normalized.endsWith("/index.html")) return -900 + filePath.split("/").length;
  if (normalized.includes("indexcarrito")) return -850;
  if (normalized.includes("delivery")) return -800;
  if (normalized.includes("primera")) return -750;
  if (normalized.includes("formulario")) return -700;
  return filePath.split("/").length * 20 + filePath.length;
}

async function mirrorRepository(student, latestCommit) {
  assertSafeStudentId(student.id);
  const studentRoot = path.join(projectsRoot, student.id);
  const currentPath = path.join(studentRoot, "current");
  const manifestPath = path.join(studentRoot, "manifest.json");
  const existingManifest = await readJson(manifestPath, null);

  if (
    existingManifest?.commit?.sha === latestCommit.sha &&
    await pathExists(currentPath)
  ) {
    return { ...existingManifest, reused: true };
  }

  const tempPath = path.join(tempRoot, student.id);
  await fs.rm(tempPath, { recursive: true, force: true });
  await fs.mkdir(tempPath, { recursive: true });

  try {
    await runGit(["init", "--quiet"], tempPath);
    await runGit(["remote", "add", "origin", `https://github.com/${student.repository}.git`], tempPath);
    await runGit(["fetch", "--quiet", "--depth", "1", "origin", latestCommit.sha], tempPath);
    await runGit(["checkout", "--quiet", "--detach", "FETCH_HEAD"], tempPath);
    const checkedOutSha = await runGit(["rev-parse", "HEAD"], tempPath);
    if (checkedOutSha !== latestCommit.sha) {
      throw new Error("El SHA descargado no coincide con el commit monitoreado");
    }

    await fs.rm(path.join(tempPath, ".git"), { recursive: true, force: true });
    const scan = await scanProject(tempPath);
    const htmlFiles = [...scan.htmlFiles].sort((a, b) => scoreEntryPath(a) - scoreEntryPath(b) || a.localeCompare(b));
    const mirroredAt = new Date().toISOString();
    const manifest = {
      schemaVersion: 1,
      studentId: student.id,
      studentName: student.name,
      group: student.group,
      project: student.project,
      repository: student.repository,
      commit: latestCommit,
      mirroredAt,
      localRoot: `student-projects/${student.id}/current/`,
      defaultEntry: htmlFiles[0] || "",
      htmlFiles,
      filesCount: scan.filesCount,
      totalBytes: scan.totalBytes,
      status: "ready",
    };

    await fs.mkdir(studentRoot, { recursive: true });
    await fs.rm(currentPath, { recursive: true, force: true });
    await fs.rename(tempPath, currentPath);
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  } catch (error) {
    await fs.rm(tempPath, { recursive: true, force: true });
    throw error;
  }
}

const roster = await readJson(rosterPath, { students: [] });
const previous = await readJson(latestPath, { students: {} });
const history = await readJson(historyPath, { events: [] });
const generatedAt = new Date().toISOString();
const result = {
  generatedAt,
  repositoriesChecked: 0,
  updatesDetected: 0,
  mirrorsReady: 0,
  students: {},
};
const newEvents = [];
const projectIndex = {
  schemaVersion: 1,
  generatedAt,
  projects: {},
};

await fs.mkdir(projectsRoot, { recursive: true });
await fs.mkdir(tempRoot, { recursive: true });

for (const student of roster.students) {
  if (!student.repository) {
    result.students[student.id] = {
      studentId: student.id,
      name: student.name,
      group: student.group,
      repository: "",
      status: "pending",
      mirror: { status: "pending" },
      checkedAt: generatedAt,
    };
    projectIndex.projects[student.id] = {
      studentId: student.id,
      name: student.name,
      group: student.group,
      repository: "",
      status: "pending",
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

    let mirror;
    try {
      mirror = await mirrorRepository(student, latestCommit);
      result.mirrorsReady += 1;
    } catch (mirrorError) {
      mirror = {
        status: "error",
        error: mirrorError.message,
        repository: student.repository,
        commit: latestCommit,
      };
      newEvents.push({
        id: `${student.id}-mirror-error-${latestCommit.sha}`,
        type: "mirror-error",
        studentId: student.id,
        name: student.name,
        group: student.group,
        repository: student.repository,
        detectedAt: generatedAt,
        error: mirrorError.message,
        commit: latestCommit,
      });
    }

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
      mirror: {
        status: mirror.status,
        manifestPath: mirror.status === "ready" ? `student-projects/${student.id}/manifest.json` : null,
        localRoot: mirror.localRoot || null,
        htmlFiles: mirror.htmlFiles || [],
        defaultEntry: mirror.defaultEntry || "",
        filesCount: mirror.filesCount || 0,
        totalBytes: mirror.totalBytes || 0,
        mirroredAt: mirror.mirroredAt || null,
        reused: Boolean(mirror.reused),
        error: mirror.error || null,
      },
      checkedAt: generatedAt,
    };

    projectIndex.projects[student.id] = {
      studentId: student.id,
      name: student.name,
      group: student.group,
      project: student.project,
      repository: student.repository,
      status: mirror.status,
      commit: latestCommit,
      manifestPath: mirror.status === "ready" ? `student-projects/${student.id}/manifest.json` : null,
      localRoot: mirror.localRoot || null,
      defaultEntry: mirror.defaultEntry || "",
      htmlFiles: mirror.htmlFiles || [],
      filesCount: mirror.filesCount || 0,
      totalBytes: mirror.totalBytes || 0,
      mirroredAt: mirror.mirroredAt || null,
      error: mirror.error || null,
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
      mirror: { status: "error", error: error.message },
      checkedAt: generatedAt,
    };
    projectIndex.projects[student.id] = {
      studentId: student.id,
      name: student.name,
      group: student.group,
      repository: student.repository,
      status: "error",
      error: error.message,
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

await fs.rm(tempRoot, { recursive: true, force: true });

const knownEventIds = new Set(history.events.map((event) => event.id));
const mergedHistory = [...newEvents.filter((event) => !knownEventIds.has(event.id)), ...history.events]
  .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
  .slice(0, 500);

const summaryLines = [
  "# Monitor y copias locales — Seminario Goal",
  "",
  `- Última ejecución: ${generatedAt}`,
  `- Repositorios consultados: ${result.repositoriesChecked}`,
  `- Copias locales listas: ${result.mirrorsReady}`,
  `- Actualizaciones detectadas: ${result.updatesDetected}`,
  "",
  "| Grupo | Estudiante | Repositorio | Monitor | Copia local | Último commit |",
  "|---|---|---|---|---|---|",
  ...roster.students.map((student) => {
    const entry = result.students[student.id];
    const commit = entry?.latestCommit;
    const monitorState = !student.repository
      ? "Pendiente"
      : entry?.status === "error"
        ? `Error: ${entry.error}`
        : entry?.changed
          ? "Commit nuevo"
          : "Sin cambios";
    const mirrorState = entry?.mirror?.status === "ready"
      ? `${entry.mirror.filesCount} archivos`
      : entry?.mirror?.status === "error"
        ? `Error: ${entry.mirror.error}`
        : "Pendiente";
    const commitText = commit ? `${commit.shortSha} — ${commit.message}` : "—";
    return `| ${student.group} | ${student.name} | ${student.repository || "—"} | ${monitorState} | ${mirrorState} | ${commitText} |`;
  }),
  "",
];

await fs.mkdir(path.dirname(latestPath), { recursive: true });
await fs.writeFile(latestPath, `${JSON.stringify(result, null, 2)}\n`);
await fs.writeFile(historyPath, `${JSON.stringify({ events: mergedHistory }, null, 2)}\n`);
await fs.writeFile(summaryPath, `${summaryLines.join("\n")}\n`);
await fs.writeFile(projectIndexPath, `${JSON.stringify(projectIndex, null, 2)}\n`);

console.log(
  `Monitor finalizado: ${result.repositoriesChecked} repositorios, ${result.mirrorsReady} copias locales, ${result.updatesDetected} actualizaciones.`
);
