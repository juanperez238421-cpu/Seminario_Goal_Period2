import {
  buildAuditSummary,
  criterionLevel,
  criterionPercent,
  sortCriteria,
  uniqueItems,
} from "./individual-analysis-core.js";

const STORAGE_KEYS = {
  students: "seminario-goal-p2-students-v1",
  teams: "seminario-goal-p2-teams-v1",
};

const STUDENT_PLANS = Object.freeze({
  "juan-pablo-arango-giraldo": {
    expectedProject: "Una aplicación de pedidos operada completamente desde la interfaz: el usuario selecciona productos y cantidades, recibe validaciones visibles, observa subtotales y total, conserva el pedido y obtiene un resumen final.",
    concepts: ["formularios HTML", "eventos", "funciones reutilizables", "arreglos y objetos", "renderizado DOM", "validación", "localStorage con JSON", "CSS responsive"],
    missing: ["Reemplazar prompt() por campos y botones visibles.", "Convertir la lista de productos en objetos o un arreglo.", "Mostrar pedido, subtotales y total dentro de delivery.html.", "Crear una capa CSS y un README de proyecto."],
    flow: ["Seleccionar productos", "Validar cantidades", "Calcular subtotales", "Renderizar pedido", "Guardar con JSON", "Abrir resumen", "Recuperar y mostrar total"],
    questions: ["¿Qué variable almacena la cantidad de cada producto?", "¿Dónde se calcula el total y qué función debería contener ese cálculo?", "¿Qué información se guarda actualmente en localStorage?", "¿Cómo reemplazarías el ciclo de prompt() por eventos del DOM?"],
    liveTest: ["Abrir delivery.html.", "Realizar un pedido con dos productos.", "Probar una cantidad inválida.", "Finalizar y abrir print.html.", "Recargar la página final y comprobar que la información persiste."],
    agreement: "Convertir delivery.html en una interfaz visible que permita seleccionar productos y cantidades, validar la entrada y mostrar el pedido y el total mediante DOM.",
    commit: "feat: convierte delivery en formulario interactivo",
  },
  "jeronimo-mazo-lopez": {
    expectedProject: "Un sistema de registro estudiantil con varios campos, validaciones, un objeto de datos, resumen visible, persistencia local y posibilidad de corregir la información.",
    concepts: ["estructura HTML", "formularios", "labels", "eventos", "objeto estudiante", "validación", "DOM", "localStorage", "CSS"],
    missing: ["Vincular un repositorio público.", "Crear index.html, styles.css, app.js y README.md.", "Implementar una primera entrada, un evento y una salida visible.", "Confirmar si el trabajo es individual o en pareja."],
    flow: ["Capturar datos", "Validar campos", "Construir objeto", "Mostrar resumen", "Guardar información", "Editar o reiniciar"],
    questions: ["¿Trabajas individualmente o con una pareja?", "¿Cuál será el dato principal del registro?", "¿Qué función procesará el formulario?", "¿Dónde aparecerá el resumen?"],
    liveTest: ["Crear o abrir el repositorio.", "Mostrar index.html.", "Ingresar tres datos.", "Pulsar un botón y mostrar un resumen.", "Realizar el primer commit descriptivo."],
    agreement: "Crear la estructura inicial del sistema de registro con formulario de datos múltiples y un resumen visible.",
    commit: "feat: crea formulario base de registro estudiantil",
  },
  "jeronimo-rodriguez-pena": {
    expectedProject: "Un carrito completo: selección de productos, cantidades válidas, contenido visible, subtotales, total, persistencia y recibo funcional; después debe mejorar su arquitectura CSS y respuesta en distintas pantallas.",
    concepts: ["arreglos de objetos", "find y findIndex", "funciones", "eventos", "DOM", "cálculo de subtotales", "JSON", "localStorage", "CSS responsive"],
    missing: ["Activar el guardado del carrito y la navegación al recibo.", "Implementar scriptRecibo.js y renderizar productos y total.", "Validar cantidades enteras positivas.", "Agregar responsive, variables CSS y documentación técnica."],
    flow: ["Seleccionar productos", "Validar cantidades", "Actualizar carrito", "Mostrar subtotales", "Calcular total", "Guardar arreglo", "Abrir recibo", "Recuperar y renderizar"],
    questions: ["¿Por qué carrito es un arreglo de objetos?", "¿Qué diferencia hay entre find() y findIndex() en tu solución?", "¿Por qué se necesita JSON.stringify() antes de guardar?", "¿Qué debe ocurrir cuando el recibo no encuentra datos?"],
    liveTest: ["Agregar dos productos.", "Cambiar la cantidad de uno.", "Probar cantidad cero o negativa.", "Finalizar el pedido.", "Abrir y recargar el recibo."],
    agreement: "Completar el flujo carrito → almacenamiento → recibo, incluyendo cantidades válidas, subtotales y total general.",
    commit: "feat: completa recibo y persistencia del carrito",
  },
  "pedro-pablo-arbelaez-escobar": {
    expectedProject: "Un cajero automático visual que permita iniciar sesión con intentos limitados, consultar saldo, retirar dinero, validar fondos y mostrar cada resultado dentro de la página.",
    concepts: ["formularios", "eventos", "funciones", "condicionales", "contador de intentos", "validación numérica", "DOM", "objetos de cuenta", "persistencia", "CSS"],
    missing: ["Corregir el error sintáctico detectado.", "Elegir ATM como único proyecto principal.", "Reemplazar prompt() y alert() por una interfaz visible.", "Implementar saldo, retiro, validación de fondos, CSS y README."],
    flow: ["Ingresar usuario y PIN", "Controlar intentos", "Mostrar menú", "Consultar saldo", "Solicitar retiro", "Validar fondos", "Actualizar saldo", "Mostrar comprobante"],
    questions: ["¿Cómo funciona el contador de intentos?", "¿Qué condición bloquea la tarjeta?", "¿Dónde almacenarías el saldo?", "¿Qué debe ocurrir si el retiro supera los fondos?"],
    liveTest: ["Abrir el ATM.", "Probar un PIN incorrecto.", "Probar el PIN correcto.", "Solicitar un retiro válido.", "Solicitar un retiro superior al saldo."],
    agreement: "Convertir el acceso del ATM en una interfaz HTML, controlar tres intentos y mostrar el resultado mediante DOM.",
    commit: "fix: crea acceso visual y valida tres intentos del ATM",
  },
  "samuel-chavarriaga-avendano": {
    expectedProject: "Un formulario multipágina que capture varios datos, valide la entrada, guarde un objeto con JSON y recupere la información en una página de resumen editable.",
    concepts: ["formularios", "eventos", "validación", "objetos", "JSON.stringify", "JSON.parse", "navegación", "DOM", "CSS"],
    missing: ["Confirmar repositorio y pareja.", "Crear dos páginas conectadas.", "Guardar un objeto, no valores aislados.", "Añadir validación, resumen y opción de edición."],
    flow: ["Completar formulario", "Validar", "Crear objeto", "Guardar JSON", "Cambiar de página", "Recuperar datos", "Editar"],
    questions: ["¿Qué campos tendrá el formulario?", "¿Por qué conviene guardar un objeto?", "¿Cómo se recupera el objeto en la segunda página?", "¿Qué responsabilidad tienes si trabajas en pareja?"],
    liveTest: ["Abrir la primera página.", "Completar el formulario.", "Probar un campo vacío.", "Abrir la segunda página.", "Recargar y verificar persistencia."],
    agreement: "Crear dos páginas conectadas, guardar un objeto del formulario y recuperar sus datos en una página de resumen.",
    commit: "feat: conecta formulario y resumen con localStorage",
  },
  "pablo-jaramillo-palacio": {
    expectedProject: "Un sistema de registro con varios campos, validaciones, almacenamiento de un objeto completo, resumen estructurado en una segunda página y opción de editar o reiniciar.",
    concepts: ["inputs y labels", "funciones", "eventos", "objeto registro", "validación", "DOM", "localStorage", "JSON", "CSS"],
    missing: ["Ampliar el formulario más allá de un nombre.", "Guardar un objeto completo mediante JSON.", "Validar campos y mostrar errores visibles.", "Agregar CSS, README y evidencia individual si el repositorio es compartido."],
    flow: ["Ingresar datos", "Validar", "Crear objeto", "Guardar", "Navegar", "Mostrar resumen", "Editar o borrar"],
    questions: ["¿Qué dato se guarda actualmente?", "¿Dónde se recupera en la segunda página?", "¿Qué campos agregarás al objeto registro?", "¿Qué parte del repositorio desarrollaste personalmente?"],
    liveTest: ["Abrir primera.html.", "Guardar el nombre.", "Abrir segunda.html.", "Recargar la segunda página.", "Agregar un nuevo campo y mostrarlo."],
    agreement: "Ampliar el formulario, guardar un objeto completo y mostrar un resumen validado en la segunda página.",
    commit: "feat: amplía registro y guarda datos con JSON",
  },
  "alejandro-rico-paramo": {
    expectedProject: "Un gestor de tareas con objetos, listado dinámico, filtros, cambio de estado, eliminación y persistencia local.",
    concepts: ["arreglo de objetos", "push", "filter", "findIndex", "formularios", "eventos", "renderizado DOM", "localStorage", "CSS"],
    missing: ["Vincular o crear el repositorio.", "Construir formulario y lista inicial.", "Modelar cada tarea como objeto.", "Implementar completar, filtrar, eliminar y persistir."],
    flow: ["Crear tarea", "Validar", "Guardar objeto", "Renderizar lista", "Completar", "Filtrar", "Eliminar", "Persistir"],
    questions: ["¿Qué propiedades tendrá una tarea?", "¿Cómo identificarás una tarea concreta?", "¿Cuándo debes volver a renderizar la lista?", "¿Cómo conservarás las tareas al recargar?"],
    liveTest: ["Crear una tarea.", "Crear una segunda tarea.", "Marcar una como completada.", "Filtrar pendientes.", "Recargar y verificar persistencia."],
    agreement: "Crear tareas como objetos y renderizarlas dinámicamente en una lista desde JavaScript.",
    commit: "feat: crea y renderiza tareas académicas",
  },
  "tomas-gonzalez-giraldo": {
    expectedProject: "Un inventario escolar que registre productos, controle entradas y salidas, impida cantidades negativas y actualice una tabla persistente.",
    concepts: ["objetos", "arreglos", "búsqueda por código", "actualización de cantidades", "validación numérica", "tabla DOM", "eventos", "localStorage", "CSS"],
    missing: ["Vincular o crear el repositorio.", "Crear formulario de productos y tabla.", "Implementar entradas y salidas de inventario.", "Validar códigos duplicados y existencias insuficientes."],
    flow: ["Registrar producto", "Validar código", "Mostrar tabla", "Registrar entrada", "Registrar salida", "Validar existencias", "Actualizar", "Persistir"],
    questions: ["¿Qué propiedades tendrá cada producto?", "¿Cómo buscarás un producto por código?", "¿Qué sucede si una salida deja cantidad negativa?", "¿Cómo actualizarás una fila de la tabla?"],
    liveTest: ["Registrar un producto.", "Registrar otro código.", "Agregar existencias.", "Intentar una salida inválida.", "Recargar la página."],
    agreement: "Registrar productos con nombre, código y cantidad y mostrarlos en una tabla dinámica.",
    commit: "feat: registra productos y actualiza inventario",
  },
  "alejandro-rincon-torres": {
    expectedProject: "Una calculadora de notas que valide la escala, calcule promedios mediante funciones, clasifique el resultado y administre una tabla de estudiantes.",
    concepts: ["inputs numéricos", "Number o parseFloat", "validación de rango", "funciones", "arreglos", "objetos", "promedio", "DOM", "tablas", "CSS"],
    missing: ["Vincular o crear el repositorio.", "Crear formulario de estudiante y notas.", "Validar valores y calcular promedio.", "Mostrar, editar y eliminar registros en una tabla."],
    flow: ["Ingresar estudiante", "Validar notas", "Calcular promedio", "Interpretar resultado", "Agregar a tabla", "Editar", "Eliminar", "Persistir"],
    questions: ["¿Cuál es la escala válida de notas?", "¿Qué función calculará el promedio?", "¿Cómo evitarás cadenas de texto en el cálculo?", "¿Cómo actualizarás un registro existente?"],
    liveTest: ["Ingresar tres notas válidas.", "Probar una nota fuera de rango.", "Calcular el promedio.", "Agregar el resultado a la tabla.", "Editar una nota y recalcular."],
    agreement: "Validar tres notas, calcular el promedio mediante una función y mostrar el resultado en una tabla.",
    commit: "feat: calcula y muestra promedio de notas",
  },
});

const elements = {
  refresh: document.querySelector("#refreshButton"),
  print: document.querySelector("#printButton"),
  search: document.querySelector("#studentSearch"),
  group: document.querySelector("#groupFilter"),
  status: document.querySelector("#statusFilter"),
  studentList: document.querySelector("#studentList"),
  studentCount: document.querySelector("#studentCount"),
  studentEmpty: document.querySelector("#studentEmpty"),
  studentName: document.querySelector("#studentName"),
  studentMeta: document.querySelector("#studentMeta"),
  memberList: document.querySelector("#memberList"),
  technicalGrade: document.querySelector("#technicalGrade"),
  technicalStatus: document.querySelector("#technicalStatus"),
  summaryBadges: document.querySelector("#summaryBadges"),
  teacherOpening: document.querySelector("#teacherOpening"),
  auditDate: document.querySelector("#auditDate"),
  modeValue: document.querySelector("#modeValue"),
  modeDetail: document.querySelector("#modeDetail"),
  repositoryValue: document.querySelector("#repositoryValue"),
  repositoryDetail: document.querySelector("#repositoryDetail"),
  entryValue: document.querySelector("#entryValue"),
  entryDetail: document.querySelector("#entryDetail"),
  priorityValue: document.querySelector("#priorityValue"),
  priorityDetail: document.querySelector("#priorityDetail"),
  benchmarkName: document.querySelector("#benchmarkName"),
  benchmarkDetail: document.querySelector("#benchmarkDetail"),
  projectStats: document.querySelector("#projectStats"),
  projectFlow: document.querySelector("#projectFlow"),
  benchmarkGap: document.querySelector("#benchmarkGap"),
  criteriaGrid: document.querySelector("#criteriaGrid"),
  currentConcepts: document.querySelector("#currentConcepts"),
  missingConcepts: document.querySelector("#missingConcepts"),
  incompleteElements: document.querySelector("#incompleteElements"),
  htmlFiles: document.querySelector("#htmlFiles"),
  expectedProject: document.querySelector("#expectedProject"),
  completionFlow: document.querySelector("#completionFlow"),
  teacherQuestions: document.querySelector("#teacherQuestions"),
  liveTest: document.querySelector("#liveTest"),
  nextAgreement: document.querySelector("#nextAgreement"),
  expectedCommit: document.querySelector("#expectedCommit"),
  pendingPanel: document.querySelector("#pendingPanel"),
  openInterview: document.querySelector("#openInterviewButton"),
  openRunner: document.querySelector("#openRunnerButton"),
  openRepository: document.querySelector("#openRepositoryButton"),
  openDetailedSession: document.querySelector("#openDetailedSessionButton"),
  copyAnalysis: document.querySelector("#copyAnalysisButton"),
  pageStatus: document.querySelector("#pageStatus"),
  toast: document.querySelector("#toast"),
};

const state = {
  roster: [],
  students: [],
  teams: [],
  projectIndex: { projects: {}, benchmark: null },
  selectedStudentId: null,
  context: null,
  summary: null,
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
    const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } catch (error) {
    console.warn(url, error);
    return fallback;
  }
}

function studentById(studentId) {
  return state.students.find((student) => student.id === studentId) || null;
}

function projectForStudent(studentId) {
  return state.projectIndex.projects?.[studentId] || null;
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
    explicitTeam?.repository || members.find((member) => member.repository)?.repository || student.repository || "",
  );
  const repositoryProjects = Object.values(state.projectIndex.projects || {}).filter((project) => {
    return project?.status === "ready" && normalizeRepository(project.repository) === repository;
  });
  const auditProject = repositoryProjects.find((project) => members.some((member) => member.id === project.studentId))
    || repositoryProjects[0]
    || projectForStudent(studentId);

  return {
    student,
    members,
    team: explicitTeam || null,
    repository,
    projectName: explicitTeam?.project || auditProject?.project || student.project,
    roles: explicitTeam?.roles || {},
    auditProject: auditProject?.audit ? auditProject : null,
    sourceStudentId: auditProject?.studentId || student.id,
    plan: STUDENT_PLANS[student.id] || STUDENT_PLANS["jeronimo-mazo-lopez"],
  };
}

function loadLocalData() {
  const savedStudents = safeJsonParse(localStorage.getItem(STORAGE_KEYS.students), []);
  const savedById = new Map(Array.isArray(savedStudents) ? savedStudents.map((student) => [student.id, student]) : []);
  state.students = state.roster.map((base) => ({ ...base, ...(savedById.get(base.id) || {}) }));
  const teams = safeJsonParse(localStorage.getItem(STORAGE_KEYS.teams), []);
  state.teams = Array.isArray(teams) ? teams : [];
}

function getFilteredStudents() {
  const query = elements.search.value.trim().toLowerCase();
  const group = elements.group.value;
  const status = elements.status.value;
  return state.students.filter((student) => {
    const context = contextForStudent(student.id);
    const audited = Boolean(context?.auditProject?.audit);
    const isTeam = context?.members?.length === 2;
    const searchable = `${student.name} ${student.group} ${context?.projectName || student.project} ${context?.repository || ""}`.toLowerCase();
    const matchesStatus = status === "all"
      || (status === "audited" && audited)
      || (status === "pending" && !audited)
      || (status === "team" && isTeam);
    return (!query || searchable.includes(query)) && (group === "all" || student.group === group) && matchesStatus;
  });
}

function renderStudentList() {
  const students = getFilteredStudents();
  elements.studentCount.textContent = students.length;
  elements.studentEmpty.hidden = students.length > 0;
  elements.studentList.innerHTML = students.map((student) => {
    const context = contextForStudent(student.id);
    const project = context?.auditProject;
    const score = project?.audit?.score;
    return `
      <button class="student-item ${student.id === state.selectedStudentId ? "is-selected" : ""}" type="button" data-student-id="${escapeHtml(student.id)}">
        <div class="student-item-top">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <small>${escapeHtml(student.group)} · N.º ${Number(student.listNumber || 0)}</small>
          </div>
          <span class="student-state ${score ? "ready" : ""}" title="${score ? "Repositorio auditado" : "Repositorio pendiente"}"></span>
        </div>
        <p>${escapeHtml(context?.projectName || student.project || "Proyecto por registrar")}</p>
        <small>${score ? `${score.percent}% · ${score.statusLabel}` : "Sin evidencia técnica"}${context?.members?.length === 2 ? " · Pareja" : ""}</small>
      </button>
    `;
  }).join("");
}

function renderList(element, items, fallback) {
  const source = items?.length ? items : [fallback];
  element.innerHTML = source.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function criterionDescription(criterion) {
  const evidence = criterion?.evidence?.[0];
  const missing = criterion?.missing?.[0];
  return evidence || missing || "Sin evidencia específica.";
}

function renderCriteria(context) {
  const criteria = sortCriteria(context.auditProject?.audit?.criteria || []);
  if (!criteria.length) {
    elements.criteriaGrid.innerHTML = `<p class="empty-state">No existe auditoría técnica. Primero vincula el repositorio.</p>`;
    return;
  }
  elements.criteriaGrid.innerHTML = criteria.map((criterion) => {
    const percent = criterionPercent(criterion) ?? 0;
    const level = criterionLevel(percent);
    return `
      <article class="criterion-card level-${escapeHtml(level.id)}">
        <div class="criterion-top">
          <strong>${escapeHtml(criterion.label)}</strong>
          <span>${percent}%</span>
        </div>
        <div class="criterion-track"><span style="width:${percent}%"></span></div>
        <p>${escapeHtml(criterionDescription(criterion))}</p>
      </article>
    `;
  }).join("");
}

function renderStats(context) {
  const indicators = context.auditProject?.audit?.indicators;
  const stats = indicators ? [
    ["Archivos", indicators.filesCount, "total del repositorio"],
    ["HTML", indicators.htmlFiles, `${indicators.nonEmptyPages || 0} con contenido`],
    ["JavaScript", indicators.jsFiles, `${indicators.functions || 0} funciones`],
    ["CSS", indicators.cssFiles, `${indicators.cssRules || 0} reglas`],
    ["DOM", indicators.domQueries, `${indicators.events || 0} eventos`],
    ["Validaciones", indicators.validationChecks, `${indicators.promptUses || 0} prompt()`],
  ] : [
    ["Archivos", "—", "repositorio pendiente"],
    ["HTML", "—", "sin evidencia"],
    ["JavaScript", "—", "sin evidencia"],
    ["CSS", "—", "sin evidencia"],
    ["DOM", "—", "sin evidencia"],
    ["Validaciones", "—", "sin evidencia"],
  ];
  elements.projectStats.innerHTML = stats.map(([label, value, detail]) => `
    <article class="project-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `).join("");
}

function renderFlow(plan) {
  elements.projectFlow.innerHTML = plan.flow.map((step, index) => `
    ${index ? '<span class="flow-arrow">→</span>' : ""}
    <span class="flow-step">${escapeHtml(step)}</span>
  `).join("");
  elements.completionFlow.innerHTML = plan.flow.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
}

function buildTeacherOpening(context, summary) {
  if (!summary.evaluable) {
    return `${context.student.name}, todavía no existe evidencia suficiente para valorar tu avance técnico. Hoy debemos confirmar si trabajas de manera individual o en pareja, vincular el repositorio y dejar una página principal que pueda abrirse. La primera meta será demostrar una entrada, un evento, una función y una salida visible.`;
  }
  const strongest = summary.strongest?.label || "la estructura inicial";
  const priority = summary.priority?.label || "el flujo principal";
  const gapText = summary.gap ? ` Estás a ${summary.gap} puntos del referente técnico actual.` : "";
  const teamText = context.members.length === 2
    ? ` El repositorio es compartido con ${context.members.find((member) => member.id !== context.student.id)?.name || "tu pareja"}, pero hoy debes demostrar tu responsabilidad individual.`
    : "";
  return `${context.student.name}, tu repositorio obtiene ${summary.grade.toFixed(2)}/5.00 (${Math.round(summary.percent)}%) en el diagnóstico técnico provisional. Tu fortaleza principal es ${strongest}; la prioridad actual es ${priority}.${gapText}${teamText} En esta conversación revisaremos una sola actividad, comprobaremos que funcione y acordaremos un resultado observable para el siguiente commit.`;
}

function renderFiles(context) {
  const files = context.auditProject?.htmlFiles || [];
  const entry = context.auditProject?.defaultEntry || "";
  elements.htmlFiles.innerHTML = files.length
    ? files.map((file) => `
        <div class="file-item ${file === entry ? "is-entry" : ""}">
          <code>${escapeHtml(file)}</code>
          <span>${file === entry ? "Principal" : "Actividad"}</span>
        </div>
      `).join("")
    : `<p class="empty-state">No hay páginas HTML disponibles hasta vincular y copiar el repositorio.</p>`;
}

function renderMembers(context) {
  elements.memberList.innerHTML = context.members.map((member, index) => {
    const defaultRole = context.members.length === 1
      ? "Responsable del flujo completo"
      : index === 0 ? "HTML, estructura y CSS" : "JavaScript, DOM y persistencia";
    const role = context.roles?.[member.id] || defaultRole;
    return `<span class="member-chip">${escapeHtml(member.name)} · ${escapeHtml(role)}</span>`;
  }).join("");
}

function renderActions(context) {
  const studentId = encodeURIComponent(context.student.id);
  const sourceId = encodeURIComponent(context.sourceStudentId);
  elements.openInterview.href = `session.html?student=${studentId}`;
  elements.openDetailedSession.href = `session.html?student=${studentId}`;
  elements.openRunner.href = `project-review.html?student=${sourceId}`;
  elements.openRunner.hidden = !context.auditProject;
  elements.openRepository.hidden = !context.repository;
  elements.openRepository.href = context.repository ? `https://github.com/${context.repository}` : "#";
  elements.copyAnalysis.disabled = false;
}

function renderSelected(context) {
  const benchmark = state.projectIndex.benchmark;
  const summary = buildAuditSummary({ student: context.student, project: context.auditProject, benchmark });
  state.summary = summary;
  const plan = context.plan;
  const audit = context.auditProject?.audit;
  const commit = context.auditProject?.commit;

  elements.studentName.textContent = context.student.name;
  elements.studentMeta.textContent = `${context.student.group} · N.º ${context.student.listNumber} · ${context.projectName || "Proyecto por registrar"}`;
  renderMembers(context);
  renderActions(context);

  elements.technicalGrade.textContent = summary.grade == null ? "—" : summary.grade.toFixed(2);
  elements.technicalStatus.textContent = summary.evaluable
    ? `${Math.round(summary.percent)}% · ${audit.score.statusLabel} · provisional`
    : "Sin auditoría técnica";
  elements.summaryBadges.innerHTML = [
    `<span class="badge">${context.members.length === 2 ? "Pareja" : "Individual"}</span>`,
    `<span class="badge">${context.repository ? "Repo vinculado" : "Repo pendiente"}</span>`,
    commit?.shortSha ? `<span class="badge">${escapeHtml(commit.shortSha)}</span>` : "",
  ].join("");

  elements.teacherOpening.textContent = buildTeacherOpening(context, summary);
  elements.auditDate.textContent = audit?.generatedAt ? `Diagnóstico: ${formatDate(audit.generatedAt)}` : "Sin diagnóstico";
  elements.modeValue.textContent = context.members.length === 2 ? "Pareja" : "Individual";
  elements.modeDetail.textContent = context.members.length === 2
    ? context.members.map((member) => member.name).join(" / ")
    : "Sustentación y autoría individual";
  elements.repositoryValue.textContent = context.repository || "Pendiente";
  elements.repositoryDetail.textContent = commit
    ? `SHA ${commit.shortSha} · ${formatDate(commit.date)}`
    : "Debe vincularse antes de calificar";
  elements.entryValue.textContent = context.auditProject?.defaultEntry || "Sin página";
  elements.entryDetail.textContent = context.auditProject?.htmlFiles?.length
    ? `${context.auditProject.htmlFiles.length} página(s) HTML encontradas`
    : "Crear una página principal";
  elements.priorityValue.textContent = summary.priority?.label || "Vincular repositorio";
  elements.priorityDetail.textContent = summary.priority?.missing?.[0] || plan.missing[0];

  elements.benchmarkName.textContent = benchmark?.name || "Sin referente";
  elements.benchmarkDetail.textContent = benchmark ? `${benchmark.project} · ${benchmark.percent}%` : "Aún no existe auditoría";
  elements.benchmarkGap.textContent = summary.gap == null ? "No calculable" : `${summary.gap} puntos`;

  renderStats(context);
  renderFlow(plan);
  renderCriteria(context);
  renderFiles(context);

  const current = summary.evaluable
    ? uniqueItems([...summary.evidence, ...(audit?.feedback?.strengths || [])], 12)
    : ["No existe evidencia técnica verificable todavía."];
  const missing = uniqueItems([
    ...plan.missing,
    ...summary.missing,
    ...(audit?.feedback?.nextActions || []),
  ], 14);
  const risks = uniqueItems([
    ...summary.risks,
    ...(audit?.feedback?.risks || []),
    !context.repository ? "No hay repositorio vinculado al estudiante." : "",
    context.members.length === 2 ? "La contribución individual debe comprobarse mediante explicación, rol y modificación en vivo." : "",
  ], 12);

  renderList(elements.currentConcepts, current, "No se detectan fortalezas hasta vincular el repositorio.");
  renderList(elements.missingConcepts, missing, "No hay faltantes estáticos; aún debe ejecutarse el flujo real.");
  renderList(elements.incompleteElements, risks, "No se detectan riesgos estáticos; falta la sustentación individual.");

  elements.expectedProject.textContent = plan.expectedProject;
  elements.teacherQuestions.innerHTML = plan.questions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  elements.liveTest.innerHTML = plan.liveTest.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  elements.nextAgreement.textContent = plan.agreement;
  elements.expectedCommit.textContent = plan.commit;
  elements.pendingPanel.hidden = summary.evaluable;
  elements.pageStatus.textContent = `Ficha actualizada: ${formatDate(new Date().toISOString())}`;
}

function selectStudent(studentId) {
  const context = contextForStudent(studentId);
  if (!context) return;
  state.selectedStudentId = studentId;
  state.context = context;
  renderStudentList();
  renderSelected(context);
  const url = new URL(window.location.href);
  url.searchParams.set("student", studentId);
  window.history.replaceState({}, "", url);
}

function buildCopyText() {
  const context = state.context;
  const summary = state.summary;
  if (!context || !summary) return "";
  const plan = context.plan;
  const criteria = context.auditProject?.audit?.criteria || [];
  const criteriaText = criteria.map((criterion) => `${criterion.label}: ${criterionPercent(criterion)}%`).join("; ");
  return [
    "SEMINARIO DE PROGRAMACIÓN — ANÁLISIS INDIVIDUAL",
    `Estudiante: ${context.student.name} (${context.student.group})`,
    `Proyecto: ${context.projectName}`,
    `Modalidad: ${context.members.length === 2 ? `Pareja con ${context.members.map((member) => member.name).join(" / ")}` : "Individual"}`,
    `Repositorio: ${context.repository || "pendiente"}`,
    `Diagnóstico: ${summary.evaluable ? `${summary.grade.toFixed(2)}/5.00 (${Math.round(summary.percent)}%)` : "No evaluable por falta de repositorio"}`,
    criteriaText ? `Criterios: ${criteriaText}` : "",
    `Comentario docente: ${elements.teacherOpening.textContent}`,
    `Proyecto esperado: ${plan.expectedProject}`,
    `Faltantes principales: ${uniqueItems([...plan.missing, ...summary.missing], 6).join(" | ")}`,
    `Prueba en vivo: ${plan.liveTest.join(" | ")}`,
    `Acuerdo: ${plan.agreement}`,
    `Commit esperado: ${plan.commit}`,
  ].filter(Boolean).join("\n");
}

async function copyAnalysis() {
  const text = buildCopyText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Análisis individual copiado.");
  } catch {
    showToast("No fue posible copiar automáticamente.");
  }
}

function bindEvents() {
  elements.refresh.addEventListener("click", () => window.location.reload());
  elements.print.addEventListener("click", () => window.print());
  elements.search.addEventListener("input", renderStudentList);
  elements.group.addEventListener("change", renderStudentList);
  elements.status.addEventListener("change", renderStudentList);
  elements.studentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-student-id]");
    if (button) selectStudent(button.dataset.studentId);
  });
  elements.copyAnalysis.addEventListener("click", copyAnalysis);
}

async function initialize() {
  const [roster, projectIndex] = await Promise.all([
    fetchJson("data/students.json", { students: [] }),
    fetchJson("student-projects/index.json", { projects: {}, benchmark: null }),
  ]);
  state.roster = Array.isArray(roster.students) ? roster.students : [];
  state.projectIndex = projectIndex;
  loadLocalData();
  bindEvents();
  renderStudentList();

  const requestedId = new URLSearchParams(window.location.search).get("student");
  const initial = studentById(requestedId) || state.students[0];
  if (initial) selectStudent(initial.id);
}

initialize().catch((error) => {
  console.error(error);
  showToast("No fue posible cargar el análisis individual.");
});
