const STORAGE_KEYS = {
  students: "seminario-goal-p2-students-v1",
  teams: "seminario-goal-p2-teams-v1",
  sessions: "seminario-goal-p2-interviews-v2",
};

const STATUS_LABELS = {
  complete: "Finalizable",
  functional: "Funcional",
  partial: "Parcial",
  initial: "Inicial",
  blocked: "Bloqueada",
};

const CONCEPTS = [
  {
    id: "receipt",
    match: /recibo|receipt|print/i,
    label: "Recibo y persistencia",
    expected: [
      "Recuperar datos guardados con localStorage y JSON.",
      "Renderizar productos, cantidades, subtotales y total.",
      "Manejar el caso en que no existan datos guardados.",
    ],
    storageRequired: true,
  },
  {
    id: "order",
    match: /delivery|domicilio|carrito|pizza|pixa|cand(?:y|ies)|concierto|ticket|pedido/i,
    label: "Pedido o compra",
    expected: [
      "Seleccionar productos o cantidades desde una interfaz visible.",
      "Validar entradas y calcular subtotales y total.",
      "Mostrar el pedido dentro de la pagina y conservarlo cuando corresponda.",
    ],
    storageRequired: true,
  },
  {
    id: "atm",
    match: /atm|cajero|banco|cuenta|credencial|login/i,
    label: "Acceso y operaciones",
    expected: [
      "Validar usuario y credencial con intentos controlados.",
      "Mostrar saldo u opciones dentro de la interfaz.",
      "Ejecutar una operacion y rechazar valores invalidos o fondos insuficientes.",
    ],
    storageRequired: true,
  },
  {
    id: "grades",
    match: /grade|nota|promedio|calificacion/i,
    label: "Calculo y reporte",
    expected: [
      "Capturar valores numericos desde campos visibles.",
      "Validar rangos y calcular el resultado con funciones.",
      "Presentar el resultado y su interpretacion en el DOM.",
    ],
    storageRequired: false,
  },
  {
    id: "form",
    match: /formulario|form|primera|segunda|registro|gym/i,
    label: "Formulario y registro",
    expected: [
      "Capturar varios datos con label y controles adecuados.",
      "Validar campos vacios, tipos y rangos.",
      "Mostrar un resumen y conservar la informacion si cambia de pagina.",
    ],
    storageRequired: true,
  },
  {
    id: "generic",
    match: /.*/,
    label: "Actividad web",
    expected: [
      "Presentar una interfaz visible con un objetivo claro.",
      "Conectar un evento con una funcion de procesamiento.",
      "Mostrar una salida visible y controlar casos invalidos.",
    ],
    storageRequired: false,
  },
];

const elements = {
  refresh: document.querySelector("#refreshButton"),
  studentSearch: document.querySelector("#studentSearch"),
  groupFilter: document.querySelector("#groupFilter"),
  studentList: document.querySelector("#studentList"),
  studentCount: document.querySelector("#studentCount"),
  studentEmpty: document.querySelector("#studentEmpty"),
  studentName: document.querySelector("#studentName"),
  studentMeta: document.querySelector("#studentMeta"),
  memberList: document.querySelector("#memberList"),
  technicalScore: document.querySelector("#technicalScore"),
  technicalPercent: document.querySelector("#technicalPercent"),
  summaryBadges: document.querySelector("#summaryBadges"),
  openingMessage: document.querySelector("#openingMessage"),
  copyOpening: document.querySelector("#copyOpeningButton"),
  openProject: document.querySelector("#openProjectButton"),
  openRepository: document.querySelector("#openRepositoryButton"),
  openGuide: document.querySelector("#openGuideButton"),
  completionDescription: document.querySelector("#completionDescription"),
  referenceName: document.querySelector("#referenceName"),
  referenceProject: document.querySelector("#referenceProject"),
  skillStandardGrid: document.querySelector("#skillStandardGrid"),
  auditDate: document.querySelector("#auditDate"),
  activityList: document.querySelector("#activityList"),
  activityEmpty: document.querySelector("#activityEmpty"),
  activityDetail: document.querySelector("#activityDetail"),
  activityTitle: document.querySelector("#activityTitle"),
  activityPath: document.querySelector("#activityPath"),
  activityPercent: document.querySelector("#activityPercent"),
  activityStatus: document.querySelector("#activityStatus"),
  activityEvidence: document.querySelector("#activityEvidence"),
  activityMissing: document.querySelector("#activityMissing"),
  activityExpected: document.querySelector("#activityExpected"),
  activitySkillsBody: document.querySelector("#activitySkillsBody"),
  teacherComment: document.querySelector("#teacherComment"),
  teacherQuestion: document.querySelector("#teacherQuestion"),
  liveTask: document.querySelector("#liveTask"),
  reviewActivity: document.querySelector("#reviewActivityButton"),
  useAsAgreement: document.querySelector("#useAsAgreementButton"),
  agreementActivity: document.querySelector("#agreementActivity"),
  agreementTask: document.querySelector("#agreementTask"),
  roleAgreement: document.querySelector("#roleAgreement"),
  checkRuns: document.querySelector("#checkRuns"),
  checkConcept: document.querySelector("#checkConcept"),
  checkExplains: document.querySelector("#checkExplains"),
  checkRole: document.querySelector("#checkRole"),
  checkLiveChange: document.querySelector("#checkLiveChange"),
  checkCommit: document.querySelector("#checkCommit"),
  sessionNotes: document.querySelector("#sessionNotes"),
  lastSessionLabel: document.querySelector("#lastSessionLabel"),
  saveSession: document.querySelector("#saveSessionButton"),
  copySummary: document.querySelector("#copySummaryButton"),
  sessionHistory: document.querySelector("#sessionHistory"),
  saveStatus: document.querySelector("#saveStatus"),
  toast: document.querySelector("#toast"),
};

const state = {
  roster: [],
  students: [],
  teams: [],
  projectIndex: { projects: {}, benchmark: null },
  guides: { students: [] },
  model: { skills: [], completionRule: {} },
  sessions: {},
  selectedStudentId: null,
  context: null,
  activities: [],
  selectedActivityPath: "",
  analysisCache: new Map(),
};

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeRepository(value = "") {
  return String(value)
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

function encodePath(filePath = "") {
  return String(filePath).split("/").map((part) => encodeURIComponent(part)).join("/");
}

function normalizePath(value = "") {
  const output = [];
  for (const part of String(value).replaceAll("\\", "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") output.pop();
    else output.push(part);
  }
  return output.join("/");
}

function resolveLocalReference(fromPath, reference) {
  const raw = String(reference || "").split("#")[0].split("?")[0].trim();
  if (!raw || /^(?:[a-z]+:|\/\/|#|data:|mailto:|tel:|javascript:)/i.test(raw)) return null;
  const directory = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
  return normalizePath(`${directory}/${decodeURIComponent(raw)}`);
}

function formatDate(value) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3500);
}

async function fetchJson(url, fallback) {
  try {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } catch (error) {
    console.warn(url, error);
    return fallback;
  }
}

async function fetchText(url) {
  const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo cargar ${url} (${response.status})`);
  return await response.text();
}

function copyText(text, successMessage) {
  navigator.clipboard.writeText(text).then(
    () => showToast(successMessage),
    () => showToast("No fue posible copiar automaticamente. Selecciona el texto manualmente.")
  );
}

function studentById(studentId) {
  return state.students.find((student) => student.id === studentId) || null;
}

function projectForStudent(studentId) {
  return state.projectIndex.projects?.[studentId] || null;
}

function guideForStudent(studentId) {
  return state.guides.students?.find((guide) => guide.id === studentId) || null;
}

function loadLocalData() {
  const savedStudents = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const savedById = new Map(Array.isArray(savedStudents) ? savedStudents.map((student) => [student.id, student]) : []);
  state.students = state.roster.map((base) => ({ ...base, ...(savedById.get(base.id) || {}) }));
  const teams = safeJsonParse(localStorage.getItem(STORAGE_KEYS.teams), []);
  state.teams = Array.isArray(teams) ? teams : [];
  const sessions = safeJsonParse(localStorage.getItem(STORAGE_KEYS.sessions), {});
  state.sessions = sessions && typeof sessions === "object" ? sessions : {};
}

function sameRepositoryMembers(repository) {
  const normalized = normalizeRepository(repository);
  if (!normalized) return [];
  return state.students.filter((student) => normalizeRepository(student.repository) === normalized).slice(0, 2);
}

function contextForStudent(studentId) {
  const student = studentById(studentId);
  if (!student) return null;
  const explicitTeam = state.teams.find((team) => Array.isArray(team.memberIds) && team.memberIds.includes(studentId));
  let members = explicitTeam
    ? explicitTeam.memberIds.map(studentById).filter(Boolean).slice(0, 2)
    : sameRepositoryMembers(student.repository);
  if (!members.length) members = [student];

  const repository = normalizeRepository(
    explicitTeam?.repository || members.find((member) => member.repository)?.repository || student.repository || ""
  );
  const candidates = Object.values(state.projectIndex.projects || {}).filter((project) => {
    return project?.status === "ready" && normalizeRepository(project.repository) === repository;
  });
  const auditProject = candidates.find((project) => members.some((member) => member.id === project.studentId))
    || candidates[0]
    || projectForStudent(studentId);

  return {
    student,
    members,
    team: explicitTeam || null,
    project: explicitTeam?.project || auditProject?.project || student.project,
    repository,
    goal: explicitTeam?.goal || student.goal,
    roles: explicitTeam?.roles || {},
    auditProject: auditProject?.audit ? auditProject : null,
    sourceStudentId: auditProject?.studentId || student.id,
  };
}

function getFilteredStudents() {
  const query = elements.studentSearch.value.trim().toLowerCase();
  const group = elements.groupFilter.value;
  return state.students.filter((student) => {
    const context = contextForStudent(student.id);
    const searchable = [
      student.name,
      student.group,
      context?.project || student.project,
      context?.repository || student.repository,
    ].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) && (group === "all" || student.group === group);
  });
}

function renderStudentList() {
  const students = getFilteredStudents();
  elements.studentCount.textContent = students.length;
  elements.studentEmpty.hidden = students.length > 0;
  elements.studentList.innerHTML = students.map((student) => {
    const context = contextForStudent(student.id);
    const ready = Boolean(context?.auditProject?.audit);
    return `
      <button class="student-item ${student.id === state.selectedStudentId ? "is-selected" : ""}" type="button" data-student-id="${escapeHtml(student.id)}">
        <div class="student-item-top">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <small>${escapeHtml(student.group)} · N.º ${Number(student.listNumber || 0)}</small>
          </div>
          <span class="student-state ${ready ? "ready" : ""}" title="${ready ? "Proyecto auditado" : "Repositorio pendiente"}"></span>
        </div>
        <p>${escapeHtml(context?.project || student.project || "Proyecto por registrar")}</p>
      </button>
    `;
  }).join("");
}

function renderCompletionModel() {
  const benchmark = state.projectIndex.benchmark;
  elements.referenceName.textContent = benchmark?.name || "Sin referencia";
  elements.referenceProject.textContent = benchmark
    ? `${benchmark.project} · ${benchmark.percent}% tecnico actual`
    : "Aun no existe auditoria";
  elements.completionDescription.textContent = state.model.referenceRule
    || "El referente se usa como base, pero el cierre exige funcionamiento, pertinencia y demostracion individual.";
  elements.skillStandardGrid.innerHTML = (state.model.skills || []).map((skill) => `
    <article class="skill-standard-card">
      <strong>${escapeHtml(skill.label)} <span class="skill-weight">${Number(skill.weight || 0)}%</span></strong>
      <p>${escapeHtml(skill.finalEvidence || "Evidencia por definir.")}</p>
    </article>
  `).join("");
}

function countMatches(text, pattern) {
  if (!text) return 0;
  return [...String(text).matchAll(pattern)].length;
}

function inspectScript(text) {
  const source = String(text || "");
  let syntaxError = "";
  if (source.trim() && !/^\s*(?:import|export)\b/m.test(source)) {
    try {
      new Function(source);
    } catch (error) {
      syntaxError = String(error.message || error);
    }
  }
  return {
    functions: countMatches(source, /\bfunction\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g),
    conditions: countMatches(source, /\bif\s*\(|\bswitch\s*\(|\?[^:]+:/g),
    arraysObjects: countMatches(source, /\.map\s*\(|\.filter\s*\(|\.find(?:Index)?\s*\(|\.reduce\s*\(|\.push\s*\(|JSON\.(?:parse|stringify)|\bObject\./g),
    domQueries: countMatches(source, /\b(?:document\.)?(?:getElementById|getElementsByClassName|getElementsByTagName|querySelector(?:All)?)\s*\(/g),
    domWrites: countMatches(source, /\.(?:innerHTML|textContent|innerText)\s*=|\bcreateElement\s*\(|\bappend(?:Child)?\s*\(|\bclassList\./g),
    events: countMatches(source, /\baddEventListener\s*\(|\.on(?:click|change|input|submit|load)\s*=/g),
    storage: countMatches(source, /\b(?:localStorage|sessionStorage)\b/g),
    json: countMatches(source, /JSON\.(?:parse|stringify)/g),
    navigation: countMatches(source, /\b(?:window\.)?location(?:\.href)?\s*=|\blocation\.(?:assign|replace)\s*\(/g),
    validation: countMatches(source, /\b(?:Number\.isFinite|Number\.isNaN|isNaN|parseInt|parseFloat|\.trim\s*\(|\.length\b|checkValidity|validity)|(?:===|!==|<=|>=)\s*(?:""|0|null|undefined)/g),
    feedback: countMatches(source, /\b(?:alert|confirm)\s*\(|\.(?:innerHTML|textContent|innerText)\s*=/g),
    prompts: countMatches(source, /\bprompt\s*\(/g),
    syntaxError,
  };
}

function inspectStyle(text) {
  const source = String(text || "");
  return {
    rules: countMatches(source, /[^@{}][^{]*\{[^{}]*\}/g),
    layout: countMatches(source, /display\s*:\s*(?:flex|grid)|grid-template|flex(?:-direction|-wrap)?\s*:/gi),
    responsive: countMatches(source, /@media\b/gi),
    variables: countMatches(source, /--[\w-]+\s*:|var\(--[\w-]+\)/g),
    states: countMatches(source, /:(?:hover|focus|focus-visible|active|disabled|invalid|valid)\b/g),
  };
}

function conceptForActivity(filePath, title) {
  const text = `${filePath} ${title}`;
  return CONCEPTS.find((concept) => concept.match.test(text)) || CONCEPTS.at(-1);
}

function skillState(id, stateId, detail, percent = 0) {
  const definition = (state.model.skills || []).find((skill) => skill.id === id) || { id, label: id, weight: 0 };
  return {
    ...definition,
    state: stateId,
    detail,
    percent,
  };
}

async function analyzeActivity(context, filePath) {
  const project = context.auditProject;
  const localRoot = project?.localRoot || "";
  const url = `${localRoot}${encodePath(filePath)}`;
  const html = await fetchText(url);
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  const bodyClone = documentNode.body?.cloneNode(true);
  bodyClone?.querySelectorAll("script,style,noscript").forEach((node) => node.remove());
  const bodyText = bodyClone?.textContent?.replace(/\s+/g, " ").trim() || "";
  const title = documentNode.title?.trim() || filePath.split("/").at(-1) || "Actividad";
  const controls = documentNode.querySelectorAll("input,select,textarea,button").length;
  const labels = documentNode.querySelectorAll("label").length;
  const headings = documentNode.querySelectorAll("h1,h2,h3,h4,h5,h6").length;
  const semantic = documentNode.querySelectorAll("main,header,nav,section,article,aside,footer").length;
  const forms = documentNode.querySelectorAll("form").length;
  const htmlConstraints = documentNode.querySelectorAll("[required],[min],[max],[minlength],[maxlength],[pattern],input[type=number],input[type=email],input[type=date]").length;
  const inlineHandlers = [...documentNode.querySelectorAll("*")].reduce((sum, node) => {
    return sum + [...node.attributes].filter((attribute) => /^on[a-z]+$/i.test(attribute.name)).length;
  }, 0);

  const scripts = [];
  const styles = [];
  const missingReferences = [];
  const externalScripts = [];

  for (const script of documentNode.querySelectorAll("script")) {
    if (script.src) {
      const reference = script.getAttribute("src");
      const resolved = resolveLocalReference(filePath, reference);
      if (!resolved) {
        externalScripts.push(reference);
        continue;
      }
      try {
        scripts.push({ path: resolved, text: await fetchText(`${localRoot}${encodePath(resolved)}`) });
      } catch {
        missingReferences.push(resolved);
      }
    } else if (script.textContent?.trim()) {
      scripts.push({ path: `${filePath}#inline`, text: script.textContent });
    }
  }

  for (const link of documentNode.querySelectorAll('link[rel~="stylesheet"]')) {
    const reference = link.getAttribute("href");
    const resolved = resolveLocalReference(filePath, reference);
    if (!resolved) continue;
    try {
      styles.push({ path: resolved, text: await fetchText(`${localRoot}${encodePath(resolved)}`) });
    } catch {
      missingReferences.push(resolved);
    }
  }

  for (const style of documentNode.querySelectorAll("style")) {
    if (style.textContent?.trim()) styles.push({ path: `${filePath}#inline-style`, text: style.textContent });
  }

  const scriptStats = scripts.map((script) => inspectScript(script.text));
  const js = scriptStats.reduce((sum, item) => {
    for (const key of ["functions", "conditions", "arraysObjects", "domQueries", "domWrites", "events", "storage", "json", "navigation", "validation", "feedback", "prompts"]) {
      sum[key] += item[key];
    }
    if (item.syntaxError) sum.syntaxErrors.push(item.syntaxError);
    return sum;
  }, {
    functions: 0,
    conditions: 0,
    arraysObjects: 0,
    domQueries: 0,
    domWrites: 0,
    events: 0,
    storage: 0,
    json: 0,
    navigation: 0,
    validation: 0,
    feedback: 0,
    prompts: 0,
    syntaxErrors: [],
  });

  const css = styles.map((style) => inspectStyle(style.text)).reduce((sum, item) => {
    for (const key of ["rules", "layout", "responsive", "variables", "states"]) sum[key] += item[key];
    return sum;
  }, { rules: 0, layout: 0, responsive: 0, variables: 0, states: 0 });

  const concept = conceptForActivity(filePath, title);
  const visibleInterface = bodyText.length >= 20 && (headings > 0 || controls > 0 || forms > 0);
  const meaningfulControls = controls >= 2 || (controls >= 1 && headings >= 1);
  const logicPresent = scripts.length > 0 && (js.functions >= 1 || js.conditions >= 1 || js.arraysObjects >= 1);
  const domConnected = js.domQueries >= 1 && (js.events + inlineHandlers >= 1);
  const visibleOutput = js.domWrites >= 1 || js.navigation >= 1 || (js.feedback >= 1 && js.prompts === 0);
  const validationPresent = htmlConstraints >= 2 || js.validation >= 2;
  const cssPresent = styles.length > 0 && css.rules >= 3;
  const cssAdvanced = css.layout >= 1 && (css.responsive >= 1 || css.states >= 1);
  const storageApplicable = concept.storageRequired;
  const storagePresent = !storageApplicable || (js.storage >= 2 && js.json >= 1);
  const integrationPresent = visibleInterface && scripts.length > 0 && visibleOutput && missingReferences.length === 0 && js.syntaxErrors.length === 0;

  const skills = [
    skillState("html", visibleInterface && meaningfulControls ? "met" : visibleInterface ? "partial" : "missing",
      visibleInterface
        ? `${headings} titulo(s), ${controls} control(es), ${semantic} elemento(s) semantico(s).`
        : "La pagina no presenta una interfaz visible suficiente.",
      visibleInterface && meaningfulControls ? 100 : visibleInterface ? 55 : 0),
    skillState("javascript", logicPresent && js.functions >= 2 ? "met" : logicPresent ? "partial" : "missing",
      logicPresent
        ? `${scripts.length} script(s), ${js.functions} funcion(es), ${js.conditions} condicion(es), ${js.arraysObjects} uso(s) de datos.`
        : "No se detecta logica JavaScript suficiente para completar la actividad.",
      logicPresent && js.functions >= 2 ? 100 : logicPresent ? 55 : 0),
    skillState("domEvents", domConnected && visibleOutput ? "met" : (domConnected || visibleOutput) ? "partial" : "missing",
      `${js.domQueries} consulta(s) DOM, ${js.events + inlineHandlers} evento(s), ${js.domWrites} salida(s) visible(s).`,
      domConnected && visibleOutput ? 100 : (domConnected || visibleOutput) ? 50 : 0),
    skillState("css", cssPresent && cssAdvanced ? "met" : cssPresent ? "partial" : "missing",
      cssPresent
        ? `${styles.length} hoja(s), ${css.rules} regla(s), layout ${css.layout}, responsive ${css.responsive}, estados ${css.states}.`
        : "No hay una capa visual propia conectada a esta actividad.",
      cssPresent && cssAdvanced ? 100 : cssPresent ? 50 : 0),
    skillState("storage", storageApplicable
      ? storagePresent ? "met" : js.storage > 0 ? "partial" : "missing"
      : "na",
      storageApplicable
        ? `${js.storage} uso(s) de storage y ${js.json} operacion(es) JSON.`
        : "La persistencia no es obligatoria para cerrar este concepto.",
      storageApplicable ? storagePresent ? 100 : js.storage > 0 ? 45 : 0 : 100),
    skillState("validation", validationPresent && js.feedback >= 1 ? "met" : validationPresent ? "partial" : "missing",
      `${htmlConstraints + js.validation} comprobacion(es) y ${js.feedback} mecanismo(s) de retroalimentacion.`,
      validationPresent && js.feedback >= 1 ? 100 : validationPresent ? 50 : 0),
    skillState("integration", integrationPresent ? "met" : visibleInterface && scripts.length ? "partial" : "missing",
      integrationPresent
        ? "Entrada, procesamiento y salida estan conectados sin bloqueos estaticos detectados."
        : `${missingReferences.length} referencia(s) faltante(s), ${js.syntaxErrors.length} error(es) sintactico(s), salida visible: ${visibleOutput ? "si" : "no"}.`,
      integrationPresent ? 100 : visibleInterface && scripts.length ? 45 : 0),
    skillState("gitDocs", "na", "Se evalua a nivel de repositorio, README, roles y commits.", 100),
  ];

  const applicableSkills = skills.filter((skill) => skill.state !== "na");
  const totalWeight = applicableSkills.reduce((sum, skill) => sum + Number(skill.weight || 0), 0) || 1;
  const weighted = applicableSkills.reduce((sum, skill) => sum + skill.percent * Number(skill.weight || 0), 0);
  const percent = Math.round(weighted / totalWeight);
  const blocked = js.syntaxErrors.length > 0 || missingReferences.length > 0;
  const status = blocked
    ? "blocked"
    : percent >= 80 && ["html", "javascript", "domEvents", "validation", "integration"].every((id) => skills.find((skill) => skill.id === id)?.state === "met")
      ? "complete"
      : percent >= 65
        ? "functional"
        : percent >= 35
          ? "partial"
          : "initial";

  const evidence = [];
  if (visibleInterface) evidence.push(`Interfaz visible con ${controls} control(es) y ${headings} titulo(s).`);
  if (logicPresent) evidence.push(`Logica conectada mediante ${scripts.length} archivo(s) o bloque(s) JavaScript.`);
  if (domConnected) evidence.push("Eventos conectados con elementos del DOM.");
  if (visibleOutput) evidence.push("Existe una salida visible, navegacion o retroalimentacion.");
  if (validationPresent) evidence.push("Se detectan validaciones de entrada.");
  if (cssPresent) evidence.push("La actividad tiene estilos CSS propios.");
  if (storageApplicable && js.storage > 0) evidence.push("Se detecta persistencia local.");
  if (externalScripts.length) evidence.push(`${externalScripts.length} dependencia(s) externa(s) declarada(s).`);
  if (!evidence.length) evidence.push("Solo se detecta la estructura inicial de la actividad.");

  const missing = [];
  for (const skill of skills) {
    if (skill.state === "missing") missing.push(skill.finalEvidence || `Completar ${skill.label}.`);
    else if (skill.state === "partial") missing.push(`Consolidar ${skill.label.toLowerCase()}: ${skill.detail}`);
  }
  if (js.prompts > 0) missing.push(`Reemplazar ${js.prompts} uso(s) de prompt() por campos y eventos visibles.`);
  if (js.syntaxErrors.length) missing.push(`Corregir error sintactico: ${js.syntaxErrors[0]}.`);
  if (missingReferences.length) missing.push(`Corregir referencia local: ${missingReferences[0]}.`);
  if (labels < Math.max(1, Math.ceil((controls - documentNode.querySelectorAll("button").length) * 0.6))) {
    missing.push("Asociar labels descriptivos a los campos de entrada.");
  }

  const weakest = [...skills]
    .filter((skill) => skill.state !== "na")
    .sort((a, b) => a.percent - b.percent)[0];
  const teacherComment = status === "complete"
    ? `La actividad esta cerca del modelo finalizado. Debes comprobar que el flujo funciona con un caso valido y uno invalido antes de cerrarla.`
    : status === "functional"
      ? `La actividad ya demuestra su concepto principal, pero aun no cumple todas las habilidades del modelo finalizado. El siguiente commit debe cerrar ${weakest?.label || "el faltante principal"}.`
      : status === "blocked"
        ? `La actividad no puede considerarse funcional hasta eliminar el bloqueo de ejecucion. Corrige primero rutas o sintaxis y luego vuelve a probar el flujo completo.`
        : `La actividad contiene una base, pero todavia funciona como ejercicio aislado. Debe convertirse en una interfaz con entrada, procesamiento, salida y validacion visibles.`;

  return {
    filePath,
    title,
    concept,
    percent,
    status,
    evidence: [...new Set(evidence)].slice(0, 7),
    missing: [...new Set(missing)].slice(0, 8),
    expected: concept.expected,
    skills,
    teacherComment,
    teacherQuestion: weakest?.teacherQuestion || "Explica la entrada, el proceso y la salida de esta actividad.",
    liveTask: weakest?.liveTask || "Completa el paso que impide cerrar el flujo principal.",
    defaultAgreement: missing[0] || concept.expected[0],
  };
}

async function analyzeCurrentProject(context) {
  const project = context?.auditProject;
  if (!project?.localRoot || !Array.isArray(project.htmlFiles) || !project.htmlFiles.length) return [];
  const cacheKey = `${project.studentId}:${project.commit?.sha || "current"}`;
  if (state.analysisCache.has(cacheKey)) return state.analysisCache.get(cacheKey);

  const results = [];
  for (const filePath of project.htmlFiles) {
    try {
      results.push(await analyzeActivity(context, filePath));
    } catch (error) {
      results.push({
        filePath,
        title: filePath.split("/").at(-1),
        concept: CONCEPTS.at(-1),
        percent: 0,
        status: "blocked",
        evidence: [],
        missing: [`No fue posible leer la actividad: ${error.message}.`],
        expected: CONCEPTS.at(-1).expected,
        skills: (state.model.skills || []).map((skill) => skillState(skill.id, "missing", "No evaluable hasta cargar el archivo.", 0)),
        teacherComment: "Primero confirma que el archivo existe y puede abrirse desde la copia central.",
        teacherQuestion: "Que archivo deberia abrir esta actividad y desde donde se enlaza?",
        liveTask: "Corregir la ruta o agregar el archivo faltante.",
        defaultAgreement: "Corregir la ruta y lograr que la actividad abra desde el repositorio.",
      });
    }
  }
  state.analysisCache.set(cacheKey, results);
  return results;
}

function repositoryCriteriaSummary(context) {
  const criteria = context?.auditProject?.audit?.criteria || [];
  const ordered = [...criteria].sort((a, b) => b.score - a.score);
  return {
    strongest: ordered.find((criterion) => criterion.score > 0),
    weakest: [...ordered].reverse().find((criterion) => criterion.id !== "gitDocs") || ordered.at(-1),
  };
}

function buildOpeningMessage(context) {
  if (!context?.auditProject?.audit) {
    return `${context.student.name}, hoy primero debemos confirmar el repositorio o la pareja con la que estas trabajando. Sin una copia publica no puedo comentar el estado real de tus actividades. La meta inicial es vincular el repositorio, identificar una pagina principal y dejar un README con proyecto, integrantes y roles.`;
  }
  const score = context.auditProject.audit.score;
  const summary = repositoryCriteriaSummary(context);
  const counts = state.activities.reduce((acc, activity) => {
    acc[activity.status] = (acc[activity.status] || 0) + 1;
    return acc;
  }, {});
  const activityText = [
    counts.complete ? `${counts.complete} finalizable(s)` : "",
    counts.functional ? `${counts.functional} funcional(es)` : "",
    counts.partial ? `${counts.partial} parcial(es)` : "",
    counts.initial ? `${counts.initial} inicial(es)` : "",
    counts.blocked ? `${counts.blocked} bloqueada(s)` : "",
  ].filter(Boolean).join(", ");
  const benchmark = state.projectIndex.benchmark;
  const gap = benchmark ? Math.max(0, benchmark.percent - score.percent) : 0;
  return `${context.student.name}, el repositorio actual obtiene ${score.grade.toFixed(2)}/5.00 (${score.percent}%) en el diagnostico tecnico provisional. Tiene ${state.activities.length} actividad(es): ${activityText || "sin clasificacion"}. Tu fortaleza principal es ${summary.strongest?.label || "la estructura inicial"}; el faltante prioritario es ${summary.weakest?.label || "cerrar el flujo"}. El proyecto de referencia marca una base de ${benchmark?.percent || 0}%, pero el estado final exige que tu concepto funcione de principio a fin, valide errores y pueda ser explicado y modificado por ti. Hoy acordaremos una sola actividad y un resultado observable para el siguiente commit${gap ? `; actualmente estas a ${gap} puntos del referente tecnico` : ""}.`;
}

function roleText(context) {
  if (!context) return "";
  if (context.members.length === 1) return "Proyecto individual: el estudiante implementa, prueba, documenta y explica el flujo completo.";
  return context.members.map((member, index) => {
    const fallback = index === 0 ? "HTML, estructura y CSS" : "JavaScript, DOM y persistencia";
    return `${member.name}: ${context.roles?.[member.id] || fallback}`;
  }).join("\n");
}

function renderSummary(context) {
  const score = context?.auditProject?.audit?.score;
  const teamLabel = context?.members?.length === 2 ? "Pareja" : "Individual";
  elements.studentName.textContent = context.student.name;
  elements.studentMeta.textContent = `${context.student.group} · N.º ${context.student.listNumber} · ${context.project || "Proyecto por registrar"}`;
  elements.memberList.innerHTML = context.members.map((member) => {
    const role = context.roles?.[member.id] || (context.members.length === 1 ? "Responsable del proyecto" : "Rol por confirmar");
    return `<span class="member-chip">${escapeHtml(member.name)} · ${escapeHtml(role)}</span>`;
  }).join("");
  elements.technicalScore.textContent = score ? `${score.grade.toFixed(2)}` : "—";
  elements.technicalPercent.textContent = score ? `${score.percent}% · ${score.statusLabel}` : "Sin auditoria";
  elements.summaryBadges.innerHTML = [
    `<span class="badge">${teamLabel}</span>`,
    `<span class="badge">${context.repository ? "Repo vinculado" : "Repo pendiente"}</span>`,
    context.auditProject?.commit?.shortSha ? `<span class="badge">${escapeHtml(context.auditProject.commit.shortSha)}</span>` : "",
  ].join("");
  elements.openingMessage.textContent = buildOpeningMessage(context);
  elements.copyOpening.disabled = false;

  elements.openProject.hidden = !context.auditProject;
  elements.openProject.href = context.auditProject
    ? `project-review.html?student=${encodeURIComponent(context.sourceStudentId)}`
    : "#";
  elements.openRepository.hidden = !context.repository;
  elements.openRepository.href = context.repository ? `https://github.com/${context.repository}` : "#";
  const guide = guideForStudent(context.student.id);
  elements.openGuide.hidden = !guide?.pdf;
  elements.openGuide.href = guide?.pdf || "#";
  elements.auditDate.textContent = context.auditProject?.audit?.generatedAt
    ? `Diagnostico: ${formatDate(context.auditProject.audit.generatedAt)}`
    : "Sin diagnostico";
}

function renderActivities() {
  elements.activityEmpty.hidden = state.activities.length > 0;
  elements.activityList.innerHTML = state.activities.map((activity) => `
    <button class="activity-card ${activity.filePath === state.selectedActivityPath ? "is-selected" : ""}" type="button" data-activity-path="${escapeHtml(activity.filePath)}">
      <div class="activity-card-top">
        <div>
          <h3>${escapeHtml(activity.title)}</h3>
          <code>${escapeHtml(activity.filePath)}</code>
        </div>
        <span class="status-chip status-${escapeHtml(activity.status)}">${escapeHtml(STATUS_LABELS[activity.status] || activity.status)}</span>
      </div>
      <div class="activity-progress">
        <div class="progress-track"><span style="width:${Math.max(0, Math.min(100, activity.percent))}%"></span></div>
        <div class="progress-label"><span>${escapeHtml(activity.concept.label)}</span><strong>${activity.percent}%</strong></div>
      </div>
    </button>
  `).join("");

  elements.agreementActivity.innerHTML = state.activities.length
    ? `<option value="">Selecciona una actividad</option>${state.activities.map((activity) => `<option value="${escapeHtml(activity.filePath)}">${escapeHtml(activity.title)} · ${activity.percent}%</option>`).join("")}`
    : `<option value="">Sin actividades disponibles</option>`;
}

function activityByPath(filePath) {
  return state.activities.find((activity) => activity.filePath === filePath) || null;
}

function renderList(element, items, fallback) {
  element.innerHTML = (items?.length ? items : [fallback]).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderActivityDetail(filePath) {
  const activity = activityByPath(filePath);
  if (!activity) {
    elements.activityDetail.hidden = true;
    return;
  }
  state.selectedActivityPath = filePath;
  renderActivities();
  elements.activityDetail.hidden = false;
  elements.activityTitle.textContent = `${activity.title} · ${activity.concept.label}`;
  elements.activityPath.textContent = activity.filePath;
  elements.activityPercent.textContent = `${activity.percent}%`;
  elements.activityStatus.textContent = STATUS_LABELS[activity.status] || activity.status;
  renderList(elements.activityEvidence, activity.evidence, "No se detecta evidencia suficiente.");
  renderList(elements.activityMissing, activity.missing, "No hay faltantes estaticos detectados; falta validar la ejecucion real.");
  renderList(elements.activityExpected, activity.expected, "Completar entrada, proceso y salida.");
  elements.activitySkillsBody.innerHTML = activity.skills.map((skill) => `
    <tr>
      <td><strong>${escapeHtml(skill.label)}</strong></td>
      <td><span class="skill-state ${escapeHtml(skill.state)}">${skill.state === "met" ? "Cumple" : skill.state === "partial" ? "Parcial" : skill.state === "na" ? "No aplica" : "Falta"}</span></td>
      <td>${escapeHtml(skill.detail)}</td>
    </tr>
  `).join("");
  elements.teacherComment.textContent = activity.teacherComment;
  elements.teacherQuestion.textContent = activity.teacherQuestion;
  elements.liveTask.textContent = activity.liveTask;
  elements.reviewActivity.href = `project-review.html?student=${encodeURIComponent(state.context.sourceStudentId)}&entry=${encodeURIComponent(activity.filePath)}`;
  elements.agreementActivity.value = activity.filePath;
}

function setInterviewEnabled(enabled) {
  [
    elements.agreementActivity,
    elements.agreementTask,
    elements.roleAgreement,
    elements.checkRuns,
    elements.checkConcept,
    elements.checkExplains,
    elements.checkRole,
    elements.checkLiveChange,
    elements.checkCommit,
    elements.sessionNotes,
    elements.saveSession,
    elements.copySummary,
  ].forEach((control) => { control.disabled = !enabled; });
}

function sessionsForStudent(studentId) {
  state.sessions[studentId] ||= [];
  return state.sessions[studentId];
}

function renderSessionHistory(studentId) {
  const sessions = sessionsForStudent(studentId);
  elements.lastSessionLabel.textContent = sessions[0] ? formatDate(sessions[0].savedAt) : "Sin registro";
  elements.sessionHistory.innerHTML = sessions.length
    ? sessions.slice(0, 6).map((session) => `
        <article class="history-item">
          <strong>${escapeHtml(session.activityTitle || session.activityPath || "Sesion")}</strong>
          <p>${escapeHtml(formatDate(session.savedAt))} · ${escapeHtml(session.task || "Sin acuerdo registrado")}</p>
        </article>
      `).join("")
    : `<p class="empty-state">Aun no hay acuerdos guardados.</p>`;
}

function resetInterviewForm(context) {
  elements.agreementActivity.value = "";
  elements.agreementTask.value = "";
  elements.roleAgreement.value = roleText(context);
  elements.checkRuns.checked = false;
  elements.checkConcept.checked = false;
  elements.checkExplains.checked = false;
  elements.checkRole.checked = false;
  elements.checkLiveChange.checked = false;
  elements.checkCommit.checked = false;
  elements.sessionNotes.value = "";
  setInterviewEnabled(Boolean(context));
  renderSessionHistory(context.student.id);
}

async function selectStudent(studentId) {
  const context = contextForStudent(studentId);
  if (!context) return;
  state.selectedStudentId = studentId;
  state.context = context;
  state.selectedActivityPath = "";
  renderStudentList();
  state.activities = await analyzeCurrentProject(context);
  renderSummary(context);
  renderActivities();
  elements.activityDetail.hidden = true;
  resetInterviewForm(context);
  const requestedEntry = new URLSearchParams(window.location.search).get("entry");
  const preferred = requestedEntry && activityByPath(requestedEntry)
    ? requestedEntry
    : context.auditProject?.defaultEntry && activityByPath(context.auditProject.defaultEntry)
      ? context.auditProject.defaultEntry
      : state.activities[0]?.filePath;
  if (preferred) renderActivityDetail(preferred);
}

function useSelectedActivityAsAgreement() {
  const activity = activityByPath(state.selectedActivityPath);
  if (!activity) return;
  elements.agreementActivity.value = activity.filePath;
  elements.agreementTask.value = activity.defaultAgreement;
  elements.roleAgreement.value ||= roleText(state.context);
  elements.agreementTask.focus();
  showToast("El faltante principal se uso como acuerdo. Ajustalo a un resultado observable.");
}

function saveSessions() {
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(state.sessions));
  elements.saveStatus.textContent = `Acuerdo guardado: ${formatDate(new Date().toISOString())}`;
}

function collectSession() {
  const activity = activityByPath(elements.agreementActivity.value);
  return {
    id: `${state.selectedStudentId}-${Date.now()}`,
    studentId: state.selectedStudentId,
    memberIds: state.context.members.map((member) => member.id),
    project: state.context.project,
    repository: state.context.repository,
    commitSha: state.context.auditProject?.commit?.sha || null,
    activityPath: activity?.filePath || elements.agreementActivity.value,
    activityTitle: activity?.title || "Actividad por definir",
    activityDiagnosticPercent: activity?.percent ?? null,
    task: elements.agreementTask.value.trim(),
    roles: elements.roleAgreement.value.trim(),
    evidence: {
      runs: elements.checkRuns.checked,
      concept: elements.checkConcept.checked,
      explains: elements.checkExplains.checked,
      role: elements.checkRole.checked,
      liveChange: elements.checkLiveChange.checked,
      commit: elements.checkCommit.checked,
    },
    notes: elements.sessionNotes.value.trim(),
    savedAt: new Date().toISOString(),
  };
}

function saveSession() {
  if (!state.context) return;
  const session = collectSession();
  if (!session.activityPath) {
    showToast("Selecciona la actividad revisada.");
    return;
  }
  if (!session.task) {
    showToast("Define el resultado esperado para el siguiente commit.");
    return;
  }
  const sessions = sessionsForStudent(state.selectedStudentId);
  sessions.unshift(session);
  state.sessions[state.selectedStudentId] = sessions.slice(0, 30);
  saveSessions();
  renderSessionHistory(state.selectedStudentId);
  showToast(`Acuerdo de ${state.context.student.name} guardado.`);
}

function buildSessionSummary() {
  const context = state.context;
  if (!context) return "";
  const activity = activityByPath(elements.agreementActivity.value);
  const session = collectSession();
  const evidenceLabels = [
    [session.evidence.runs, "ejecucion verificada"],
    [session.evidence.concept, "concepto pertinente"],
    [session.evidence.explains, "explicacion verificada"],
    [session.evidence.role, "responsabilidad individual verificada"],
    [session.evidence.liveChange, "modificacion en vivo"],
    [session.evidence.commit, "commit descriptivo"],
  ].filter(([checked]) => checked).map(([, label]) => label);
  return [
    `SEMINARIO DE PROGRAMACION - ENTREVISTA DE PROYECTO`,
    `Estudiante: ${context.student.name} (${context.student.group})`,
    `Proyecto: ${context.project}`,
    `Repositorio: ${context.repository || "pendiente"}`,
    context.members.length === 2 ? `Pareja: ${context.members.map((member) => member.name).join(" / ")}` : "Modalidad: individual",
    `Actividad: ${activity?.title || session.activityTitle} (${activity?.filePath || session.activityPath})`,
    activity ? `Diagnostico de actividad: ${activity.percent}% - ${STATUS_LABELS[activity.status]}` : "",
    `Acuerdo: ${session.task || "pendiente"}`,
    `Roles: ${session.roles || "por confirmar"}`,
    `Evidencias: ${evidenceLabels.length ? evidenceLabels.join(", ") : "sin verificar"}`,
    session.notes ? `Observaciones: ${session.notes}` : "",
    `Siguiente control: ejecutar el nuevo commit y comparar el SHA.`,
  ].filter(Boolean).join("\n");
}

function copySessionSummary() {
  copyText(buildSessionSummary(), "Resumen de la entrevista copiado.");
}

async function initialize() {
  const [roster, projectIndex, guides, model] = await Promise.all([
    fetchJson("data/students.json", { students: [] }),
    fetchJson("student-projects/index.json", { projects: {}, benchmark: null }),
    fetchJson("guides/index.json", { students: [] }),
    fetchJson("data/completion-model.json", { skills: [], completionRule: {} }),
  ]);
  state.roster = Array.isArray(roster.students) ? roster.students : [];
  state.projectIndex = projectIndex;
  state.guides = guides;
  state.model = model;
  loadLocalData();
  renderCompletionModel();
  renderStudentList();
  bindEvents();

  const requestedStudentId = new URLSearchParams(window.location.search).get("student");
  const initialStudent = studentById(requestedStudentId) || state.students[0];
  if (initialStudent) await selectStudent(initialStudent.id);
}

function bindEvents() {
  elements.refresh.addEventListener("click", () => window.location.reload());
  elements.studentSearch.addEventListener("input", renderStudentList);
  elements.groupFilter.addEventListener("change", renderStudentList);
  elements.studentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-student-id]");
    if (button) selectStudent(button.dataset.studentId);
  });
  elements.copyOpening.addEventListener("click", () => copyText(elements.openingMessage.textContent, "Comentario inicial copiado."));
  elements.activityList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-activity-path]");
    if (button) renderActivityDetail(button.dataset.activityPath);
  });
  elements.agreementActivity.addEventListener("change", () => {
    if (elements.agreementActivity.value) renderActivityDetail(elements.agreementActivity.value);
  });
  elements.useAsAgreement.addEventListener("click", useSelectedActivityAsAgreement);
  elements.saveSession.addEventListener("click", saveSession);
  elements.copySummary.addEventListener("click", copySessionSummary);
}

initialize().catch((error) => {
  console.error(error);
  showToast("No fue posible iniciar el modo entrevista.");
});
