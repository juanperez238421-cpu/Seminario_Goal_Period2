from __future__ import annotations

import json
import re
import shutil
import subprocess
import unicodedata
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
ROSTER_PATH = ROOT / "data" / "students.json"
PROJECT_INDEX_PATH = ROOT / "student-projects" / "index.json"
MODEL_PATH = ROOT / "data" / "completion-model.json"
GUIDES_ROOT = ROOT / "guides"
TEX_DIR = GUIDES_ROOT / "session-tex"
PDF_DIR = GUIDES_ROOT / "session-pdf"
INDEX_PATH = GUIDES_ROOT / "index.json"


def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return fallback


def slug(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    ascii_value = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", "_", ascii_value.lower()).strip("_")


def latex_escape(value) -> str:
    text = str(value or "")
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(replacements.get(char, char) for char in text)


def strip_html(content: str) -> str:
    body = re.search(r"<body\b[^>]*>(.*?)</body>", content, re.I | re.S)
    source = body.group(1) if body else content
    source = re.sub(r"<script\b.*?</script>", " ", source, flags=re.I | re.S)
    source = re.sub(r"<style\b.*?</style>", " ", source, flags=re.I | re.S)
    source = re.sub(r"<[^>]+>", " ", source)
    return re.sub(r"\s+", " ", source).strip()


def normalize_reference(from_file: str, reference: str) -> str | None:
    raw = reference.split("#")[0].split("?")[0].strip()
    if not raw or re.match(r"^(?:[a-z]+:|//|#|data:|mailto:|tel:|javascript:)", raw, re.I):
        return None
    parent = PurePosixPath(from_file).parent
    parts: list[str] = []
    for part in (parent / raw).parts:
        if part in ("", "."):
            continue
        if part == "..":
            if parts:
                parts.pop()
        else:
            parts.append(part)
    return "/".join(parts)


def concept_for(path: str, title: str) -> dict:
    text = f"{path} {title}".lower()
    if re.search(r"recibo|receipt|print", text):
        return {
            "label": "Recibo y persistencia",
            "expected": "recuperar datos guardados, renderizar detalle y total, y manejar ausencia de datos",
            "storage": True,
        }
    if re.search(r"delivery|domicilio|carrito|pizza|pixa|cand|concierto|ticket|pedido", text):
        return {
            "label": "Pedido o compra",
            "expected": "seleccionar cantidades, validar, calcular total y mostrar el pedido",
            "storage": True,
        }
    if re.search(r"atm|cajero|banco|cuenta|credencial|login", text):
        return {
            "label": "Acceso y operaciones",
            "expected": "validar acceso, mostrar saldo u opciones y ejecutar una operacion segura",
            "storage": True,
        }
    if re.search(r"grade|nota|promedio|calificacion", text):
        return {
            "label": "Calculo y reporte",
            "expected": "capturar valores, validar rangos, calcular y mostrar la interpretacion",
            "storage": False,
        }
    if re.search(r"formulario|form|primera|segunda|registro|gym", text):
        return {
            "label": "Formulario y registro",
            "expected": "capturar varios datos, validar y mostrar o conservar un resumen",
            "storage": True,
        }
    return {
        "label": "Actividad web",
        "expected": "completar una entrada, un procesamiento y una salida visible",
        "storage": False,
    }


def read_linked_content(project_root: Path, html_path: str, html: str, tag: str, attribute: str) -> tuple[str, int]:
    pattern = rf"<{tag}\b[^>]*\b{attribute}\s*=\s*[\"']([^\"']+)[\"'][^>]*>"
    contents: list[str] = []
    missing = 0
    for reference in re.findall(pattern, html, re.I):
        normalized = normalize_reference(html_path, reference)
        if not normalized:
            continue
        file_path = project_root.joinpath(*normalized.split("/"))
        try:
            contents.append(file_path.read_text(encoding="utf-8"))
        except (FileNotFoundError, UnicodeDecodeError):
            missing += 1
    return "\n".join(contents), missing


def analyze_activity(project_root: Path, html_path: str) -> dict:
    file_path = project_root.joinpath(*html_path.split("/"))
    try:
        html = file_path.read_text(encoding="utf-8")
    except (FileNotFoundError, UnicodeDecodeError):
        return {
            "path": html_path,
            "title": PurePosixPath(html_path).name,
            "concept": "Actividad no legible",
            "percent": 0,
            "status": "Bloqueada",
            "exists": ["El archivo aparece en el manifiesto."],
            "missing": ["Corregir la ruta o codificacion para poder abrir la actividad."],
            "expected": "lograr que la pagina abra desde la copia central",
            "priority": "Corregir la ruta o el archivo antes de continuar.",
        }

    title_match = re.search(r"<title\b[^>]*>(.*?)</title>", html, re.I | re.S)
    title = re.sub(r"\s+", " ", title_match.group(1)).strip() if title_match else PurePosixPath(html_path).name
    body_text = strip_html(html)
    controls = len(re.findall(r"<(?:input|select|textarea|button)\b", html, re.I))
    headings = len(re.findall(r"<h[1-6]\b", html, re.I))
    semantic = len(re.findall(r"<(?:main|header|nav|section|article|aside|footer)\b", html, re.I))
    constraints = len(re.findall(r"\b(?:required|min|max|minlength|maxlength|pattern)\b|type\s*=\s*[\"'](?:number|email|date)", html, re.I))
    inline_scripts = "\n".join(re.findall(r"<script\b(?![^>]*\bsrc\s*=)[^>]*>(.*?)</script>", html, re.I | re.S))
    linked_js, missing_js = read_linked_content(project_root, html_path, html, "script", "src")
    linked_css, missing_css = read_linked_content(project_root, html_path, html, "link", "href")
    inline_css = "\n".join(re.findall(r"<style\b[^>]*>(.*?)</style>", html, re.I | re.S))
    js = f"{inline_scripts}\n{linked_js}"
    css = f"{inline_css}\n{linked_css}"

    functions = len(re.findall(r"\bfunction\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>", js))
    conditions = len(re.findall(r"\bif\s*\(|\bswitch\s*\(", js))
    data_models = len(re.findall(r"\.map\s*\(|\.filter\s*\(|\.find(?:Index)?\s*\(|\.reduce\s*\(|\.push\s*\(|JSON\.(?:parse|stringify)", js))
    dom_queries = len(re.findall(r"(?:getElementById|querySelector(?:All)?|getElementsByClassName)\s*\(", js))
    dom_writes = len(re.findall(r"\.(?:innerHTML|textContent|innerText)\s*=|createElement\s*\(|append(?:Child)?\s*\(", js))
    events = len(re.findall(r"addEventListener\s*\(|\.on(?:click|change|input|submit)\s*=", js)) + len(re.findall(r"\son[a-z]+\s*=", html, re.I))
    storage = len(re.findall(r"\b(?:localStorage|sessionStorage)\b", js))
    json_ops = len(re.findall(r"JSON\.(?:parse|stringify)", js))
    validation = constraints + len(re.findall(r"Number\.isNaN|isNaN|parseInt|parseFloat|\.trim\s*\(|checkValidity|validity|===\s*[\"']{2}|<=\s*0|>=\s*0", js))
    feedback = len(re.findall(r"\b(?:alert|confirm)\s*\(|\.(?:innerHTML|textContent|innerText)\s*=", js))
    prompts = len(re.findall(r"\bprompt\s*\(", js))
    css_rules = len(re.findall(r"[^@{}][^{]*\{[^{}]*\}", css))
    css_layout = len(re.findall(r"display\s*:\s*(?:flex|grid)|grid-template", css, re.I))
    css_responsive = len(re.findall(r"@media\b", css, re.I))
    css_states = len(re.findall(r":(?:hover|focus|focus-visible|disabled|invalid|valid)\b", css))

    concept = concept_for(html_path, title)
    checks = {
        "html": len(body_text) >= 20 and (controls >= 2 or headings >= 1),
        "javascript": bool(js.strip()) and (functions >= 1 or conditions >= 1 or data_models >= 1),
        "dom": dom_queries >= 1 and events >= 1 and (dom_writes >= 1 or feedback >= 1),
        "validation": validation >= 2 and feedback >= 1,
        "css": css_rules >= 3 and css_layout >= 1 and (css_responsive >= 1 or css_states >= 1),
        "storage": (storage >= 2 and json_ops >= 1) if concept["storage"] else True,
        "integration": len(body_text) >= 20 and bool(js.strip()) and (dom_writes >= 1 or feedback >= 1) and (missing_js + missing_css == 0),
    }
    weights = {"html": 15, "javascript": 20, "dom": 15, "validation": 10, "css": 15, "storage": 10, "integration": 15}
    percent = round(sum(weights[key] for key, met in checks.items() if met) / sum(weights.values()) * 100)
    blocked = missing_js + missing_css > 0
    if blocked:
        status = "Bloqueada"
    elif percent >= 80 and all(checks[key] for key in ("html", "javascript", "dom", "validation", "integration")):
        status = "Finalizable"
    elif percent >= 65:
        status = "Funcional"
    elif percent >= 35:
        status = "Parcial"
    else:
        status = "Inicial"

    exists = []
    if checks["html"]:
        exists.append(f"Interfaz visible con {controls} controles y {headings} titulos.")
    if checks["javascript"]:
        exists.append(f"Logica con {functions} funciones y {conditions} condiciones.")
    if checks["dom"]:
        exists.append("Eventos conectados con una salida visible en el DOM.")
    if validation:
        exists.append(f"Se detectan {validation} comprobaciones de entrada.")
    if css_rules:
        exists.append(f"CSS conectado con {css_rules} reglas.")
    if storage:
        exists.append("Se detecta persistencia local.")
    if not exists:
        exists.append("Existe el archivo base de la actividad.")

    missing = []
    if not checks["html"]:
        missing.append("Construir una interfaz visible con campos, labels, botones y jerarquia.")
    if not checks["javascript"]:
        missing.append("Organizar el procesamiento en funciones, condiciones y datos.")
    if not checks["dom"]:
        missing.append("Conectar eventos y mostrar el resultado dentro de la pagina.")
    if not checks["validation"]:
        missing.append("Validar entradas y mostrar mensajes de error claros.")
    if not checks["css"]:
        missing.append("Agregar CSS con layout, estados y comportamiento responsive.")
    if concept["storage"] and not checks["storage"]:
        missing.append("Guardar y recuperar datos con localStorage y JSON.")
    if not checks["integration"]:
        missing.append("Cerrar el flujo completo de entrada, proceso y salida.")
    if prompts:
        missing.append(f"Reemplazar {prompts} uso(s) de prompt por controles visibles.")
    if blocked:
        missing.append("Corregir las rutas locales que no se pudieron resolver.")

    priority = missing[0] if missing else "Probar un caso valido y uno invalido y explicar el flujo completo."
    return {
        "path": html_path,
        "title": title,
        "concept": concept["label"],
        "percent": percent,
        "status": status,
        "exists": exists[:4],
        "missing": missing[:5],
        "expected": concept["expected"],
        "priority": priority,
        "semantic": semantic,
    }


def status_color(status: str) -> str:
    return {
        "Finalizable": "green!55!black",
        "Funcional": "blue!65!black",
        "Parcial": "orange!75!black",
        "Inicial": "red!65!black",
        "Bloqueada": "red!80!black",
    }.get(status, "black")


def base_preamble(title: str) -> str:
    return rf"""\documentclass[10pt]{{article}}
\usepackage[utf8]{{inputenc}}
\usepackage[T1]{{fontenc}}
\usepackage[spanish]{{babel}}
\usepackage{{lmodern}}
\usepackage[a4paper,margin=1.55cm]{{geometry}}
\usepackage{{xcolor}}
\usepackage{{tabularx}}
\usepackage{{array}}
\usepackage{{enumitem}}
\usepackage{{hyperref}}
\usepackage{{xurl}}
\setlength{{\parindent}}{{0pt}}
\setlength{{\parskip}}{{4pt}}
\setlist[itemize]{{leftmargin=*,nosep}}
\definecolor{{navy}}{{HTML}}{{123B63}}
\definecolor{{soft}}{{HTML}}{{F2F5F8}}
\hypersetup{{colorlinks=true,urlcolor=navy}}
\pagestyle{{empty}}
\newcommand{{\sectiontitle}}[1]{{\vspace{{4pt}}\textcolor{{navy}}{{\large\bfseries #1}}\par\vspace{{2pt}}\hrule\vspace{{5pt}}}}
\begin{{document}}
{{\color{{navy}}\LARGE\bfseries {latex_escape(title)}}}\\[-1pt]
{{\small Instituto Jorge Robledo -- Seminario de Programacion -- Periodo 2}}
\vspace{{5pt}}\hrule\vspace{{7pt}}
"""


def individual_document(student: dict, project: dict | None, model: dict) -> str:
    title = f"Ficha de entrevista - {student['name']}"
    doc = [base_preamble(title)]
    doc.append(r"\begin{tabularx}{\textwidth}{>{\bfseries}l X >{\bfseries}l X}")
    doc.append(f"Grupo & {latex_escape(student.get('group'))} & Numero & {student.get('listNumber', '')} \\")
    doc.append(f"Proyecto & {latex_escape((project or {}).get('project') or student.get('project'))} & Repositorio & {latex_escape((project or {}).get('repository') or student.get('repository') or 'Pendiente')} \\")
    doc.append(r"\end{tabularx}")

    if not project or project.get("status") != "ready" or not project.get("audit"):
        doc.append(r"\sectiontitle{Comentario inicial}")
        doc.append("Todavia no existe evidencia suficiente para comentar el estado real del proyecto. No corresponde asignar un cero tecnico: primero debe vincularse un repositorio publico y una pagina principal ejecutable.")
        doc.append(r"\sectiontitle{Acuerdo de hoy}")
        doc.append(r"\begin{enumerate}[leftmargin=*]")
        for item in (
            "Confirmar si el proyecto es individual o en pareja.",
            "Crear o vincular el repositorio y registrar integrantes y roles en README.",
            "Subir index.html, styles.css y script.js conectados.",
            "Implementar una entrada, un procesamiento y una salida visible.",
            "Crear un commit descriptivo y demostrar el cambio en vivo.",
        ):
            doc.append(f"\\item {latex_escape(item)}")
        doc.append(r"\end{enumerate}")
        doc.append(r"\sectiontitle{Habilidades que debe demostrar}")
        doc.append(r"\begin{itemize}")
        for skill in model.get("skills", []):
            doc.append(f"\\item \\textbf{{{latex_escape(skill['label'])}:}} {latex_escape(skill['finalEvidence'])}")
        doc.append(r"\end{itemize}")
        doc.append(r"\end{document}")
        return "\n".join(doc)

    audit = project["audit"]
    score = audit.get("score", {})
    criteria = audit.get("criteria", [])
    strongest = max(criteria, key=lambda item: item.get("score", 0), default={})
    weakest = min((item for item in criteria if item.get("id") != "gitDocs"), key=lambda item: item.get("score", 0), default={})
    project_root = ROOT.joinpath(*project["localRoot"].rstrip("/").split("/"))
    activities = [analyze_activity(project_root, html_path) for html_path in project.get("htmlFiles", [])]
    status_counts: dict[str, int] = {}
    for activity in activities:
        status_counts[activity["status"]] = status_counts.get(activity["status"], 0) + 1
    counts_text = ", ".join(f"{count} {status.lower()}" for status, count in status_counts.items()) or "sin actividades"

    doc.append(r"\sectiontitle{Estado que se comunica al estudiante}")
    doc.append(
        f"El repositorio obtiene \\textbf{{{score.get('grade', 0):.2f}/5.00 ({score.get('percent', 0)}\%)}} en el diagnostico tecnico provisional. "
        f"Presenta {latex_escape(counts_text)}. La fortaleza principal es \\textbf{{{latex_escape(strongest.get('label', 'la base actual'))}}} y la prioridad es \\textbf{{{latex_escape(weakest.get('label', 'cerrar el flujo'))}}}. "
        "El puntaje no sustituye la ejecucion, la explicacion ni la autoria individual."
    )

    doc.append(r"\sectiontitle{Estado de cada actividad}")
    doc.append(r"\small\begin{tabularx}{\textwidth}{>{\raggedright\arraybackslash}p{3.4cm} >{\raggedright\arraybackslash}p{2.5cm} c >{\raggedright\arraybackslash}X}")
    doc.append(r"\textbf{Actividad} & \textbf{Concepto} & \textbf{Estado} & \textbf{Siguiente cierre} \\\hline")
    for activity in activities:
        doc.append(
            f"{latex_escape(activity['title'])}\\newline{{\\scriptsize\\path{{{activity['path']}}}}} & "
            f"{latex_escape(activity['concept'])} & "
            f"\\textcolor{{{status_color(activity['status'])}}}{{\\textbf{{{latex_escape(activity['status'])} {activity['percent']}\%}}}} & "
            f"{latex_escape(activity['priority'])} \\"
        )
    doc.append(r"\end{tabularx}\normalsize")

    priority_activity = sorted(
        activities,
        key=lambda item: (
            0 if item["status"] == "Bloqueada" else 1 if item["status"] == "Inicial" else 2 if item["status"] == "Parcial" else 3,
            item["percent"],
        ),
    )[0] if activities else None

    doc.append(r"\sectiontitle{Acuerdo puntual de la sesion}")
    if priority_activity:
        doc.append(f"\\textbf{{Actividad:}} {latex_escape(priority_activity['title'])} -- \\path{{{priority_activity['path']}}}")
        doc.append(f"\\textbf{{Resultado esperado:}} {latex_escape(priority_activity['priority'])}")
        doc.append(f"\\textbf{{Criterio de cierre:}} {latex_escape(priority_activity['expected'])}.")
    else:
        doc.append("Definir una pagina principal, implementarla y dejarla ejecutable desde el repositorio.")

    doc.append(r"\sectiontitle{Preguntas y prueba en vivo}")
    doc.append(r"\begin{enumerate}[leftmargin=*]")
    for item in (
        "Ejecuta la actividad principal sin abrir primero el editor.",
        "Explica la entrada, la funcion que procesa y el elemento donde aparece la salida.",
        "Prueba un caso valido y uno invalido.",
        "Realiza una modificacion pequena relacionada con el faltante prioritario.",
        "Crea un commit descriptivo y explica que archivo cambio.",
    ):
        doc.append(f"\\item {latex_escape(item)}")
    doc.append(r"\end{enumerate}")

    doc.append(r"\sectiontitle{Habilidades que se verifican}")
    doc.append(r"\small\begin{tabularx}{\textwidth}{>{\bfseries}p{3cm} X p{2.2cm}}
Habilidad & Evidencia final esperada & Verificacion \\\hline")
    for skill in model.get("skills", []):
        doc.append(f"{latex_escape(skill['label'])} & {latex_escape(skill['finalEvidence'])} & $\\square$ Repo $\\square$ Vivo \\")
    doc.append(r"\end{tabularx}\normalsize")
    doc.append(r"\vfill\textbf{Observaciones:}\par\vspace{1.8cm}\hrule")
    doc.append(r"\end{document}")
    return "\n".join(doc)


def teacher_document(students: list[dict], projects: dict, benchmark: dict | None) -> str:
    doc = [base_preamble("Guion docente - entrevistas puntuales")]
    doc.append(r"\sectiontitle{Regla de la clase}")
    doc.append("El proyecto puede ser compartido por dos estudiantes. El estado tecnico del repositorio es comun; la explicacion, la responsabilidad, la modificacion en vivo y la autoria se verifican individualmente.")
    if benchmark:
        doc.append(r"\sectiontitle{Modelo de cierre}")
        doc.append(
            f"La base comparativa actual es \\textbf{{{latex_escape(benchmark.get('name'))}}}, "
            f"proyecto \\textbf{{{latex_escape(benchmark.get('project'))}}}, con {benchmark.get('percent', 0)}\%. "
            "No se copia su tema: se usan como referencia las habilidades integradas. Un proyecto solo se cierra si el concepto es pertinente y funciona de principio a fin."
        )
    doc.append(r"\sectiontitle{Orden sugerido}")
    ready = []
    pending = []
    for student in students:
        project = projects.get(student["id"]) or {}
        score = ((project.get("audit") or {}).get("score") or {})
        if project.get("status") == "ready":
            ready.append((score.get("percent", 0), student, project))
        else:
            pending.append(student)
    ready.sort(key=lambda item: item[0])
    doc.append(r"\begin{enumerate}[leftmargin=*]")
    for percent, student, project in ready:
        doc.append(f"\\item {latex_escape(student['name'])}: {latex_escape(project.get('project'))}, {percent}\% tecnico. Revisar la actividad mas debil.")
    for student in pending:
        doc.append(f"\\item {latex_escape(student['name'])}: repositorio pendiente; confirmar proyecto o pareja.")
    doc.append(r"\end{enumerate}")
    doc.append(r"\sectiontitle{Secuencia por estudiante}")
    doc.append(r"\begin{enumerate}[leftmargin=*]")
    for item in (
        "Leer el comentario inicial de la ficha.",
        "Abrir la actividad indicada y probar el flujo.",
        "Pedir explicacion de entrada, proceso y salida.",
        "Elegir un solo faltante como acuerdo del siguiente commit.",
        "Asignar responsabilidad individual cuando exista pareja.",
        "Solicitar una modificacion en vivo y un commit descriptivo.",
        "Guardar el acuerdo en session.html.",
    ):
        doc.append(f"\\item {latex_escape(item)}")
    doc.append(r"\end{enumerate}")
    doc.append(r"\end{document}")
    return "\n".join(doc)


def compile_tex(tex_path: Path, output_pdf: Path) -> None:
    build_dir = TEX_DIR / ".build" / tex_path.stem
    shutil.rmtree(build_dir, ignore_errors=True)
    build_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["latexmk", "-pdf", "-interaction=nonstopmode", "-halt-on-error", f"-outdir={build_dir}", str(tex_path)],
        check=True,
    )
    shutil.copy2(build_dir / f"{tex_path.stem}.pdf", output_pdf)


def rebuild_archive() -> None:
    archive_path = GUIDES_ROOT / "seminario_guias_2026_07_29.zip"
    archive_path.unlink(missing_ok=True)
    temp_root = GUIDES_ROOT / ".archive"
    shutil.rmtree(temp_root, ignore_errors=True)
    temp_guides = temp_root / "guides"
    shutil.copytree(GUIDES_ROOT, temp_guides, ignore=shutil.ignore_patterns(".archive", ".build", "*.zip"))
    shutil.make_archive(str(archive_path.with_suffix("")), "zip", root_dir=temp_root, base_dir="guides")
    shutil.rmtree(temp_root, ignore_errors=True)


def main() -> None:
    roster = read_json(ROSTER_PATH, {"students": []})
    project_index = read_json(PROJECT_INDEX_PATH, {"projects": {}, "benchmark": None})
    model = read_json(MODEL_PATH, {"skills": []})
    guide_index = read_json(INDEX_PATH, {"students": []})
    students = roster.get("students", [])
    projects = project_index.get("projects", {})

    shutil.rmtree(TEX_DIR, ignore_errors=True)
    shutil.rmtree(PDF_DIR, ignore_errors=True)
    TEX_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    teacher_name = "ficha_docente_entrevistas_puntuales"
    documents = {teacher_name: teacher_document(students, projects, project_index.get("benchmark"))}
    for student in students:
        documents[f"ficha_{slug(student['name'])}"] = individual_document(student, projects.get(student["id"]), model)

    for name, content in documents.items():
        tex_path = TEX_DIR / f"{name}.tex"
        pdf_path = PDF_DIR / f"{name}.pdf"
        tex_path.write_text(content, encoding="utf-8")
        compile_tex(tex_path, pdf_path)

    shutil.rmtree(TEX_DIR / ".build", ignore_errors=True)
    guide_index["sessionGeneratedAt"] = datetime.now(timezone.utc).isoformat()
    guide_index["sessionTeacherGuide"] = f"guides/session-pdf/{teacher_name}.pdf"
    indexed_students = {item.get("id"): item for item in guide_index.get("students", [])}
    for student in students:
        item = indexed_students.setdefault(student["id"], {
            "id": student["id"],
            "name": student["name"],
            "group": student["group"],
        })
        item["sessionPdf"] = f"guides/session-pdf/ficha_{slug(student['name'])}.pdf"
    guide_index["students"] = [indexed_students[student["id"]] for student in students]
    INDEX_PATH.write_text(json.dumps(guide_index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rebuild_archive()
    print(f"Generated {len(documents)} focused interview PDF guides")


if __name__ == "__main__":
    main()
