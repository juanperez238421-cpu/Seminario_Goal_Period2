import fs from "node:fs/promises";
import path from "node:path";

export const AUDIT_RUBRIC = [
  { id: "html", label: "HTML y estructura", weight: 15 },
  { id: "javascript", label: "JavaScript y lógica", weight: 20 },
  { id: "domEvents", label: "DOM, funciones y eventos", weight: 15 },
  { id: "css", label: "CSS y presentación", weight: 15 },
  { id: "storage", label: "Navegación y persistencia", weight: 10 },
  { id: "validation", label: "Validación y errores", weight: 10 },
  { id: "integration", label: "Integración funcional", weight: 10 },
  { id: "gitDocs", label: "Git y documentación", weight: 5 },
];

const GENERIC_COMMIT_MESSAGES = [
  "initial commit",
  "primer commit",
  "add files via upload",
  "update files",
  "finally",
  "final",
  "changes",
  "cambios",
];

const TEXT_EXTENSIONS = new Set([
  ".html", ".htm", ".css", ".js", ".mjs", ".json", ".md", ".txt",
]);

const MAX_TEXT_BYTES = 2 * 1024 * 1024;

function clamp(value, min = 0, max = 5) {
  return Math.min(max, Math.max(min, value));
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function countMatches(text, pattern) {
  if (!text) return 0;
  return [...text.matchAll(pattern)].length;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function stripQueryHash(value = "") {
  return String(value).split("#")[0].split("?")[0];
}

function isExternalReference(value = "") {
  return /^(?:[a-z]+:|\/\/|#|data:|mailto:|tel:|javascript:)/i.test(String(value).trim());
}

function normalizeReference(fromFile, reference) {
  const clean = stripQueryHash(reference).trim();
  if (!clean || isExternalReference(clean)) return null;
  const baseDirectory = path.posix.dirname(fromFile);
  return path.posix.normalize(path.posix.join(baseDirectory, decodeURIComponent(clean))).replace(/^\.\//, "");
}

function statusFromPercent(percent) {
  if (percent >= 85) return { id: "advanced", label: "Avanzado" };
  if (percent >= 70) return { id: "competent", label: "Competente" };
  if (percent >= 50) return { id: "developing", label: "En desarrollo" };
  if (percent >= 30) return { id: "basic", label: "Básico" };
  return { id: "starting", label: "Inicial" };
}

async function readTextFiles(directory, filePaths) {
  const result = new Map();
  for (const relativePath of filePaths) {
    const extension = path.extname(relativePath).toLowerCase();
    if (!TEXT_EXTENSIONS.has(extension)) continue;
    const absolutePath = path.join(directory, ...relativePath.split("/"));
    try {
      const stat = await fs.stat(absolutePath);
      if (stat.size > MAX_TEXT_BYTES) continue;
      result.set(relativePath, await fs.readFile(absolutePath, "utf8"));
    } catch {
      // A disappearing or unreadable file is reflected by the integration checks.
    }
  }
  return result;
}

function inspectHtml(htmlEntries, allFilesSet) {
  const aggregate = htmlEntries.map(([, content]) => content).join("\n");
  const pages = htmlEntries.map(([filePath, content]) => {
    const bodyMatch = content.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    const bodyText = (bodyMatch?.[1] || "").replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const title = content.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
    const references = [];
    for (const match of content.matchAll(/<(?:script|link|img|a)\b[^>]*(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
      const normalized = normalizeReference(filePath, match[1]);
      if (normalized) references.push({ raw: match[1], normalized });
    }
    return {
      filePath,
      bodyTextLength: bodyText.length,
      title,
      references,
      hasLang: /<html\b[^>]*\blang\s*=/i.test(content),
      hasViewport: /<meta\b[^>]*name\s*=\s*["']viewport["']/i.test(content),
    };
  });

  const references = pages.flatMap((page) => page.references.map((reference) => ({ ...reference, from: page.filePath })));
  const brokenReferences = references.filter((reference) => !allFilesSet.has(reference.normalized));
  const validReferences = references.length - brokenReferences.length;
  const nonEmptyPages = pages.filter((page) => page.bodyTextLength >= 20).length;
  const meaningfulTitles = pages.filter((page) => page.title && !/^(document|untitled|page)$/i.test(page.title)).length;
  const labels = countMatches(aggregate, /<label\b/gi);
  const controls = countMatches(aggregate, /<(?:input|select|textarea)\b/gi);
  const buttons = countMatches(aggregate, /<button\b/gi);
  const images = countMatches(aggregate, /<img\b/gi);
  const imagesWithAlt = countMatches(aggregate, /<img\b[^>]*\balt\s*=/gi);

  return {
    pages,
    aggregate,
    htmlFiles: htmlEntries.length,
    nonEmptyPages,
    emptyPages: pages.length - nonEmptyPages,
    meaningfulTitles,
    langPages: pages.filter((page) => page.hasLang).length,
    viewportPages: pages.filter((page) => page.hasViewport).length,
    semanticTags: countMatches(aggregate, /<(?:main|header|nav|section|article|aside|footer)\b/gi),
    headings: countMatches(aggregate, /<h[1-6]\b/gi),
    forms: countMatches(aggregate, /<form\b/gi),
    controls,
    labels,
    buttons,
    details: countMatches(aggregate, /<details\b/gi),
    tables: countMatches(aggregate, /<table\b/gi),
    images,
    imagesWithAlt,
    inlineHandlers: countMatches(aggregate, /\son[a-z]+\s*=/gi),
    requiredAttributes: countMatches(aggregate, /\brequired\b/gi),
    constraintAttributes: countMatches(aggregate, /\b(?:min|max|minlength|maxlength|pattern|type\s*=\s*["'](?:number|email|url|date))[\s=]/gi),
    linkedScripts: countMatches(aggregate, /<script\b[^>]*\bsrc\s*=/gi),
    linkedStyles: countMatches(aggregate, /<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi) + countMatches(aggregate, /<link\b[^>]*href\s*=\s*["'][^"']+\.css(?:[?#][^"']*)?["'][^>]*>/gi),
    references: references.length,
    validReferences,
    brokenReferences,
  };
}

function inspectJavaScript(jsEntries) {
  const aggregate = jsEntries.map(([, content]) => content).join("\n");
  const syntaxErrors = [];
  for (const [filePath, content] of jsEntries) {
    if (/^\s*(?:import|export)\b/m.test(content)) continue;
    try {
      // Parsing only; the function is never invoked.
      new Function(content);
    } catch (error) {
      syntaxErrors.push({ file: filePath, message: String(error.message || error).slice(0, 160) });
    }
  }

  return {
    aggregate,
    jsFiles: jsEntries.length,
    lines: aggregate ? aggregate.split(/\r?\n/).length : 0,
    functions: countMatches(aggregate, /\bfunction\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g),
    conditions: countMatches(aggregate, /\bif\s*\(|\bswitch\s*\(|\?[^:]+:/g),
    loops: countMatches(aggregate, /\b(?:for|while)\s*\(/g),
    arrays: countMatches(aggregate, /\b(?:Array\.|new\s+Array|\.map\s*\(|\.filter\s*\(|\.find(?:Index)?\s*\(|\.reduce\s*\(|\.push\s*\()/g),
    objects: countMatches(aggregate, /\bObject\.|JSON\.(?:parse|stringify)|\{\s*[A-Za-z_$][\w$]*\s*:/g),
    calculations: countMatches(aggregate, /(?:\+=|-=|\*=|\/=|\+\+|--|Math\.|\btotal\b|\bsubtotal\b|\bprice\b|\bprecio\b)/gi),
    domQueries: countMatches(aggregate, /\b(?:document\.)?(?:getElementById|getElementsByClassName|getElementsByTagName|querySelector(?:All)?)\s*\(/g),
    domWrites: countMatches(aggregate, /\.(?:innerHTML|textContent|innerText|value)\s*=|\bcreateElement\s*\(|\bappend(?:Child)?\s*\(|\bclassList\./g),
    events: countMatches(aggregate, /\baddEventListener\s*\(|\.on(?:click|change|input|submit|load)\s*=|\bfunction\s+[A-Za-z_$][\w$]*\s*\([^)]*\)/g),
    storage: countMatches(aggregate, /\b(?:localStorage|sessionStorage)\b/g),
    jsonStorage: countMatches(aggregate, /JSON\.(?:parse|stringify)/g),
    navigation: countMatches(aggregate, /\b(?:window\.)?location(?:\.href)?\s*=|\blocation\.assign\s*\(|\blocation\.replace\s*\(/g),
    validation: countMatches(aggregate, /\b(?:Number\.isFinite|isNaN|Number\.isNaN|parseInt|parseFloat|\.trim\s*\(|\.length\b|\brequired\b|\bvalidity\b|\bcheckValidity\b)|(?:===|!==|<=|>=)\s*(?:""|0|null|undefined)/g),
    errorHandling: countMatches(aggregate, /\btry\s*\{|\bcatch\s*\(|\bthrow\s+new\s+Error|console\.(?:error|warn)/g),
    userFeedback: countMatches(aggregate, /\b(?:alert|confirm)\s*\(|\.(?:innerHTML|textContent|innerText)\s*=|\bshowToast\s*\(/g),
    prompts: countMatches(aggregate, /\bprompt\s*\(/g),
    alerts: countMatches(aggregate, /\balert\s*\(/g),
    syntaxErrors,
  };
}

function inspectCss(cssEntries) {
  const aggregate = cssEntries.map(([, content]) => content).join("\n");
  return {
    aggregate,
    cssFiles: cssEntries.length,
    lines: aggregate ? aggregate.split(/\r?\n/).length : 0,
    rules: countMatches(aggregate, /[^@{}][^{]*\{[^{}]*\}/g),
    declarations: countMatches(aggregate, /(?:^|;)\s*[-a-z]+\s*:/gim),
    variables: countMatches(aggregate, /--[\w-]+\s*:|var\(--[\w-]+\)/g),
    responsive: countMatches(aggregate, /@media\b/gi),
    layout: countMatches(aggregate, /display\s*:\s*(?:flex|grid)|grid-template|flex(?:-direction|-wrap)?\s*:/gi),
    states: countMatches(aggregate, /:(?:hover|focus|focus-visible|active|disabled|checked|invalid|valid)\b/g),
    typography: countMatches(aggregate, /font-(?:family|size|weight)|line-height|letter-spacing/gi),
    spacing: countMatches(aggregate, /\b(?:margin|padding|gap)\s*:/gi),
    colors: countMatches(aggregate, /#[0-9a-f]{3,8}\b|rgba?\s*\(|hsla?\s*\(/gi),
    animations: countMatches(aggregate, /@keyframes\b|transition\s*:|animation\s*:/gi),
  };
}

function criterion(id, score, evidence, missing, risk = []) {
  const definition = AUDIT_RUBRIC.find((item) => item.id === id);
  const normalizedScore = round(clamp(score), 1);
  return {
    id,
    label: definition.label,
    weight: definition.weight,
    score: normalizedScore,
    percent: Math.round((normalizedScore / 5) * 100),
    evidence: unique(evidence).slice(0, 6),
    missing: unique(missing).slice(0, 5),
    risk: unique(risk).slice(0, 4),
  };
}

function buildCriteria({ html, js, css, files, commitMessage }) {
  const criteria = [];

  let htmlScore = 0;
  const htmlEvidence = [];
  const htmlMissing = [];
  const htmlRisk = [];
  if (html.htmlFiles) { htmlScore += 0.8; htmlEvidence.push(`${html.htmlFiles} página(s) HTML detectadas`); }
  if (html.nonEmptyPages) { htmlScore += Math.min(1.0, html.nonEmptyPages / Math.max(1, html.htmlFiles)); htmlEvidence.push(`${html.nonEmptyPages} página(s) con contenido visible`); }
  if (html.semanticTags >= 3) { htmlScore += 1.0; htmlEvidence.push(`${html.semanticTags} elementos semánticos`); }
  else if (html.headings >= 1) { htmlScore += 0.35; htmlMissing.push("Agregar main, section, header, nav o footer para organizar la interfaz"); }
  else htmlMissing.push("Construir una jerarquía HTML visible");
  if (html.controls + html.buttons >= 3) { htmlScore += 0.75; htmlEvidence.push(`${html.controls + html.buttons} controles interactivos`); }
  else htmlMissing.push("Agregar suficientes controles para completar un flujo real");
  if (html.controls > 0 && html.labels >= Math.ceil(html.controls * 0.6)) { htmlScore += 0.45; htmlEvidence.push("Controles asociados con etiquetas"); }
  else if (html.controls > 0) { htmlMissing.push("Asociar label a los campos de entrada"); htmlRisk.push("Campos sin etiqueta reducen accesibilidad"); }
  const metadataRatio = html.htmlFiles ? (html.langPages + html.viewportPages + html.meaningfulTitles) / (html.htmlFiles * 3) : 0;
  htmlScore += Math.min(0.8, metadataRatio * 0.8);
  if (metadataRatio < 0.6) htmlMissing.push("Completar lang, viewport y títulos descriptivos en las páginas");
  if (html.images && html.imagesWithAlt < html.images) htmlRisk.push("Existen imágenes sin texto alternativo");
  if (html.emptyPages) htmlRisk.push(`${html.emptyPages} página(s) HTML prácticamente vacías`);
  criteria.push(criterion("html", htmlScore, htmlEvidence, htmlMissing, htmlRisk));

  let jsScore = 0;
  const jsEvidence = [];
  const jsMissing = [];
  const jsRisk = [];
  if (js.jsFiles) { jsScore += 0.7; jsEvidence.push(`${js.jsFiles} archivo(s) JavaScript`); }
  if (js.functions >= 2) { jsScore += Math.min(1.0, 0.45 + js.functions * 0.08); jsEvidence.push(`${js.functions} funciones o callbacks`); }
  else jsMissing.push("Separar la lógica en funciones reutilizables");
  if (js.conditions >= 2) { jsScore += 0.75; jsEvidence.push(`${js.conditions} decisiones condicionales`); }
  else jsMissing.push("Incluir condiciones que controlen el flujo de la aplicación");
  if (js.loops >= 1) { jsScore += 0.45; jsEvidence.push("Uso de ciclos"); }
  if (js.arrays + js.objects >= 2) { jsScore += 0.75; jsEvidence.push("Manejo de arreglos, objetos o JSON"); }
  else jsMissing.push("Modelar los datos con arreglos u objetos");
  if (js.calculations >= 2) { jsScore += 0.45; jsEvidence.push("Procesamiento y cálculos detectados"); }
  if (!js.syntaxErrors.length && js.jsFiles) { jsScore += 0.7; jsEvidence.push("Sin errores sintácticos detectados"); }
  if (js.syntaxErrors.length) { jsRisk.push(`${js.syntaxErrors.length} archivo(s) con error sintáctico`); jsScore -= Math.min(1.4, js.syntaxErrors.length * 0.45); }
  if (js.prompts >= 2) { jsRisk.push(`Dependencia de prompt() en ${js.prompts} puntos`); jsMissing.push("Migrar entradas de prompt() a formularios y eventos del DOM"); jsScore -= Math.min(1.0, js.prompts * 0.12); }
  criteria.push(criterion("javascript", jsScore, jsEvidence, jsMissing, jsRisk));

  let domScore = 0;
  const domEvidence = [];
  const domMissing = [];
  const domRisk = [];
  if (js.domQueries >= 2) { domScore += 1.35; domEvidence.push(`${js.domQueries} consultas al DOM`); }
  else if (js.domQueries === 1) { domScore += 0.65; }
  else domMissing.push("Conectar la lógica con elementos reales del DOM");
  if (js.domWrites >= 2) { domScore += 1.2; domEvidence.push(`${js.domWrites} actualizaciones visibles del DOM`); }
  else domMissing.push("Mostrar resultados dentro de la página");
  if (js.events >= 2 || html.inlineHandlers >= 2) { domScore += 1.15; domEvidence.push("Interacciones y eventos detectados"); }
  else domMissing.push("Agregar eventos para botones, formularios y campos");
  if (js.functions >= 3) { domScore += 0.75; domEvidence.push("Funciones asociables a interacciones"); }
  if (html.buttons + html.controls >= 5) { domScore += 0.55; }
  if (html.inlineHandlers > 0 && js.events === 0) domRisk.push("Los eventos están acoplados al HTML mediante atributos inline");
  criteria.push(criterion("domEvents", domScore, domEvidence, domMissing, domRisk));

  let cssScore = 0;
  const cssEvidence = [];
  const cssMissing = [];
  const cssRisk = [];
  if (css.cssFiles) { cssScore += 0.9; cssEvidence.push(`${css.cssFiles} hoja(s) CSS`); }
  else { cssMissing.push("Crear y conectar una hoja CSS"); cssRisk.push("El proyecto no presenta una capa visual propia"); }
  if (css.rules >= 8 && css.declarations >= 20) { cssScore += 1.15; cssEvidence.push(`${css.rules} reglas y ${css.declarations} declaraciones`); }
  else if (css.rules > 0) { cssScore += 0.5; cssMissing.push("Ampliar la jerarquía visual y la consistencia de componentes"); }
  if (css.layout >= 2) { cssScore += 0.8; cssEvidence.push("Uso de Flexbox o Grid"); }
  else cssMissing.push("Usar Flexbox o Grid para la distribución");
  if (css.responsive >= 1) { cssScore += 0.8; cssEvidence.push("Diseño responsive mediante media queries"); }
  else cssMissing.push("Agregar comportamiento responsive");
  if (css.variables >= 3) { cssScore += 0.55; cssEvidence.push("Variables CSS reutilizables"); }
  else cssMissing.push("Definir variables CSS para colores y espaciado");
  if (css.states >= 2) { cssScore += 0.45; cssEvidence.push("Estados visuales interactivos"); }
  else cssMissing.push("Diseñar estados hover, focus, disabled y error");
  if (css.animations >= 1) cssScore += 0.25;
  criteria.push(criterion("css", cssScore, cssEvidence, cssMissing, cssRisk));

  let storageScore = 0;
  const storageEvidence = [];
  const storageMissing = [];
  const storageRisk = [];
  if (js.storage >= 2) { storageScore += 2.0; storageEvidence.push("Persistencia con localStorage o sessionStorage"); }
  else if (js.storage === 1) { storageScore += 1.0; storageMissing.push("Completar lectura y escritura de datos persistentes"); }
  else storageMissing.push("Agregar persistencia cuando el flujo requiera conservar datos");
  if (js.navigation >= 1) { storageScore += 1.35; storageEvidence.push("Navegación programática entre páginas"); }
  if (html.htmlFiles >= 2) { storageScore += 0.65; storageEvidence.push("Proyecto multipágina"); }
  if (js.jsonStorage >= 2) { storageScore += 0.8; storageEvidence.push("Serialización de datos con JSON"); }
  else if (js.storage) storageMissing.push("Usar JSON.stringify y JSON.parse para objetos o arreglos");
  if (html.htmlFiles === 1 && !js.storage) storageRisk.push("El estado se pierde al recargar la página");
  criteria.push(criterion("storage", storageScore, storageEvidence, storageMissing, storageRisk));

  let validationScore = 0;
  const validationEvidence = [];
  const validationMissing = [];
  const validationRisk = [];
  if (html.requiredAttributes + html.constraintAttributes >= 2) { validationScore += 0.9; validationEvidence.push("Restricciones declaradas en HTML"); }
  if (js.validation >= 3) { validationScore += 1.65; validationEvidence.push(`${js.validation} comprobaciones de entrada`); }
  else if (js.validation > 0) { validationScore += 0.7; validationMissing.push("Cubrir entradas vacías, tipos, rangos y valores inválidos"); }
  else validationMissing.push("Implementar validaciones explícitas de entrada");
  if (js.errorHandling >= 1) { validationScore += 0.75; validationEvidence.push("Manejo de errores detectado"); }
  else validationMissing.push("Agregar manejo de errores y estados de fallo");
  if (js.userFeedback >= 2) { validationScore += 0.75; validationEvidence.push("Retroalimentación para el usuario"); }
  else validationMissing.push("Mostrar mensajes claros de éxito y error");
  if (!js.syntaxErrors.length && js.jsFiles) validationScore += 0.8;
  if (js.syntaxErrors.length) validationRisk.push("Los errores sintácticos bloquean la ejecución antes de validar datos");
  if (js.prompts && js.validation < js.prompts) validationRisk.push("Las entradas por prompt() no están completamente validadas");
  criteria.push(criterion("validation", validationScore, validationEvidence, validationMissing, validationRisk));

  let integrationScore = 0;
  const integrationEvidence = [];
  const integrationMissing = [];
  const integrationRisk = [];
  if (html.htmlFiles && html.nonEmptyPages) { integrationScore += 0.9; integrationEvidence.push("Existe una página de entrada visible"); }
  if (html.linkedScripts && js.jsFiles) { integrationScore += 0.8; integrationEvidence.push("HTML conectado con JavaScript"); }
  else if (js.jsFiles) integrationMissing.push("Conectar correctamente los archivos JavaScript desde HTML");
  if (html.linkedStyles && css.cssFiles) { integrationScore += 0.55; integrationEvidence.push("HTML conectado con CSS"); }
  else if (css.cssFiles) integrationMissing.push("Verificar la conexión de las hojas CSS");
  const referenceRatio = html.references ? html.validReferences / html.references : 1;
  integrationScore += referenceRatio * 1.15;
  if (html.brokenReferences.length) {
    integrationRisk.push(`${html.brokenReferences.length} referencia(s) local(es) no resueltas`);
    integrationMissing.push("Corregir rutas, nombres y mayúsculas de scripts, estilos, imágenes o páginas");
  } else if (html.references) integrationEvidence.push("Referencias locales resueltas por análisis estático");
  if (js.functions >= 2 && (js.domWrites + js.navigation + js.storage) >= 2) { integrationScore += 1.05; integrationEvidence.push("Flujo de procesamiento conectado con una salida"); }
  else integrationMissing.push("Completar un flujo de entrada, proceso y salida");
  if (html.htmlFiles >= 2 && js.navigation) integrationScore += 0.55;
  if (html.emptyPages) integrationRisk.push("Hay páginas que abren sin interfaz útil");
  criteria.push(criterion("integration", integrationScore, integrationEvidence, integrationMissing, integrationRisk));

  let gitScore = 0;
  const gitEvidence = [];
  const gitMissing = [];
  const gitRisk = [];
  const readme = files.find((file) => /^readme(?:\.[^.]+)?$/i.test(path.posix.basename(file.path)));
  if (readme) { gitScore += 1.8; gitEvidence.push("README presente"); }
  else gitMissing.push("Crear README con propósito, autores, ejecución y estado");
  if (readme?.content?.trim().length >= 250) { gitScore += 1.2; gitEvidence.push("README con contenido sustancial"); }
  else if (readme) gitMissing.push("Ampliar el README con instrucciones y decisiones técnicas");
  const normalizedMessage = String(commitMessage || "").trim().toLowerCase();
  const descriptiveCommit = normalizedMessage.length >= 12 && !GENERIC_COMMIT_MESSAGES.includes(normalizedMessage);
  if (descriptiveCommit) { gitScore += 1.35; gitEvidence.push("Mensaje de commit descriptivo"); }
  else { gitMissing.push("Usar commits pequeños con mensajes feat:, fix:, style: o docs:"); gitRisk.push(`Mensaje de commit genérico: ${commitMessage || "sin mensaje"}`); }
  const directories = unique(files.map((file) => file.path.includes("/") ? file.path.split("/")[0] : "")).filter(Boolean);
  if (directories.length >= 2) { gitScore += 0.65; gitEvidence.push("Archivos organizados en carpetas"); }
  criteria.push(criterion("gitDocs", gitScore, gitEvidence, gitMissing, gitRisk));

  return criteria;
}

function buildAutomatedFeedback(criteria) {
  const ordered = [...criteria].sort((a, b) => b.score - a.score);
  const strongest = ordered.slice(0, 3).filter((item) => item.score > 0);
  const weakest = [...criteria].sort((a, b) => a.score - b.score).slice(0, 3);
  const strengths = unique(strongest.flatMap((item) => item.evidence.map((evidence) => `${item.label}: ${evidence}`))).slice(0, 6);
  const missing = unique(weakest.flatMap((item) => item.missing.map((value) => `${item.label}: ${value}`))).slice(0, 8);
  const risks = unique(criteria.flatMap((item) => item.risk.map((value) => `${item.label}: ${value}`))).slice(0, 8);
  const nextActions = unique([
    ...weakest.flatMap((item) => item.missing.slice(0, 2)),
    ...criteria.filter((item) => item.id === "integration").flatMap((item) => item.missing),
  ]).slice(0, 5);
  return { strengths, missing, risks, nextActions };
}

export async function auditProject({ directory, scan, student, latestCommit }) {
  const texts = await readTextFiles(directory, scan.files);
  const files = scan.files.map((filePath) => ({ path: filePath, content: texts.get(filePath) || "" }));
  const htmlEntries = [...texts.entries()].filter(([filePath]) => /\.html?$/i.test(filePath));
  const jsEntries = [...texts.entries()].filter(([filePath]) => /\.(?:js|mjs)$/i.test(filePath));
  const cssEntries = [...texts.entries()].filter(([filePath]) => /\.css$/i.test(filePath));
  const allFilesSet = new Set(scan.files.map((filePath) => filePath.split(path.sep).join("/")));

  const html = inspectHtml(htmlEntries, allFilesSet);
  const js = inspectJavaScript(jsEntries);
  const css = inspectCss(cssEntries);
  const criteria = buildCriteria({ html, js, css, files, commitMessage: latestCommit?.message });
  const weighted = criteria.reduce((sum, item) => sum + item.score * (item.weight / 100), 0);
  const grade = round(weighted, 2);
  const percent = Math.round((grade / 5) * 100);
  const status = statusFromPercent(percent);
  const feedback = buildAutomatedFeedback(criteria);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    studentId: student.id,
    repository: student.repository,
    commitSha: latestCommit?.sha || null,
    methodology: "Análisis estático automatizado basado en evidencias observables del repositorio. No sustituye la ejecución ni la sustentación oral.",
    rubric: AUDIT_RUBRIC,
    score: {
      grade,
      percent,
      status: status.id,
      statusLabel: status.label,
      provisional: true,
    },
    criteria,
    indicators: {
      filesCount: scan.filesCount,
      totalBytes: scan.totalBytes,
      htmlFiles: html.htmlFiles,
      cssFiles: css.cssFiles,
      jsFiles: js.jsFiles,
      nonEmptyPages: html.nonEmptyPages,
      emptyPages: html.emptyPages,
      functions: js.functions,
      conditions: js.conditions,
      loops: js.loops,
      domQueries: js.domQueries,
      domWrites: js.domWrites,
      events: js.events + html.inlineHandlers,
      storageUses: js.storage,
      validationChecks: js.validation + html.requiredAttributes + html.constraintAttributes,
      promptUses: js.prompts,
      syntaxErrors: js.syntaxErrors,
      brokenReferences: html.brokenReferences.slice(0, 20),
      cssRules: css.rules,
      mediaQueries: css.responsive,
      cssVariables: css.variables,
    },
    feedback,
  };
}

export function applyBenchmark(projectIndex) {
  const readyProjects = Object.values(projectIndex.projects || {}).filter((project) => project.status === "ready" && project.audit?.score);
  if (!readyProjects.length) {
    projectIndex.benchmark = null;
    return projectIndex;
  }

  const leader = [...readyProjects].sort((a, b) => {
    const difference = (b.audit.score.percent || 0) - (a.audit.score.percent || 0);
    if (difference) return difference;
    return (b.audit.indicators?.filesCount || 0) - (a.audit.indicators?.filesCount || 0);
  })[0];

  const benchmarkCriteria = Object.fromEntries(
    leader.audit.criteria.map((criterion) => [criterion.id, criterion.score])
  );

  projectIndex.benchmark = {
    studentId: leader.studentId,
    name: leader.name,
    group: leader.group,
    project: leader.project,
    repository: leader.repository,
    commit: leader.commit,
    grade: leader.audit.score.grade,
    percent: leader.audit.score.percent,
    criteria: benchmarkCriteria,
    generatedAt: new Date().toISOString(),
    note: "El referente es el proyecto con mayor puntaje técnico automatizado en la última copia disponible.",
  };

  for (const project of readyProjects) {
    const absolutePercent = project.audit.score.percent || 0;
    const benchmarkPercent = leader.audit.score.percent || 1;
    const relativePercent = Math.min(100, Math.round((absolutePercent / benchmarkPercent) * 100));
    const leaderCriteria = new Map(leader.audit.criteria.map((criterion) => [criterion.id, criterion]));
    const gaps = project.audit.criteria.map((criterion) => {
      const leaderCriterion = leaderCriteria.get(criterion.id);
      return {
        id: criterion.id,
        label: criterion.label,
        current: criterion.score,
        benchmark: leaderCriterion?.score || 0,
        gap: round(Math.max(0, (leaderCriterion?.score || 0) - criterion.score), 1),
      };
    }).sort((a, b) => b.gap - a.gap);

    project.audit.benchmark = {
      leaderStudentId: leader.studentId,
      leaderName: leader.name,
      leaderProject: leader.project,
      leaderPercent: benchmarkPercent,
      relativePercent,
      distancePoints: Math.max(0, benchmarkPercent - absolutePercent),
      gaps,
    };
  }

  return projectIndex;
}
