from __future__ import annotations

import json
import re
import shutil
import subprocess
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROSTER_PATH = ROOT / "data" / "students.json"
PROJECT_INDEX_PATH = ROOT / "student-projects" / "index.json"
GUIDES_ROOT = ROOT / "guides"
TEX_DIR = GUIDES_ROOT / "tex"
PDF_DIR = GUIDES_ROOT / "pdf"

WEIGHTS = {
    "HTML y estructura": 15,
    "JavaScript y lógica": 20,
    "DOM, funciones y eventos": 15,
    "CSS y presentación": 15,
    "Navegación y persistencia": 10,
    "Validación y errores": 10,
    "Integración funcional": 10,
    "Git y documentación": 5,
}

PENDING_STEPS = {
    "jeronimo-mazo-lopez": [
        "Crear o identificar un repositorio público del proyecto.",
        "Subir index.html, styles.css, script.js y README.md.",
        "Construir un formulario con nombre, grupo, correo y actividad.",
        "Validar campos y mostrar un resumen con DOM.",
        "Guardar y recuperar un registro con localStorage.",
        "Realizar al menos tres commits descriptivos.",
    ],
    "samuel-chavarriaga-avendano": [
        "Confirmar si trabajará individualmente o en pareja y registrar el repositorio compartido.",
        "Crear dos páginas conectadas: formulario y resumen.",
        "Validar entradas antes de continuar.",
        "Guardar un objeto con JSON en localStorage y recuperarlo.",
        "Agregar botón editar o volver y CSS responsive.",
        "Dejar commits propios o una distribución de roles verificable.",
    ],
    "alejandro-rico-paramo": [
        "Crear o vincular el repositorio del gestor de tareas.",
        "Crear formulario para título, materia, fecha y prioridad.",
        "Modelar tareas como objetos dentro de un arreglo.",
        "Renderizar, completar, filtrar y eliminar tareas con DOM.",
        "Persistir el arreglo en localStorage usando JSON.",
        "Agregar CSS, README y commits descriptivos.",
    ],
    "tomas-gonzalez-giraldo": [
        "Crear o vincular el repositorio del inventario.",
        "Registrar producto, categoría, cantidad y movimiento.",
        "Validar números enteros y evitar existencias negativas.",
        "Renderizar una tabla de inventario y actualizarla con DOM.",
        "Guardar el inventario con JSON en localStorage.",
        "Agregar CSS, README y commits descriptivos.",
    ],
    "alejandro-rincon-torres": [
        "Crear o vincular el repositorio del panel de notas.",
        "Crear formulario de estudiante, materia y notas.",
        "Validar escala, campos vacíos y valores no numéricos.",
        "Calcular promedio y estado mediante funciones.",
        "Renderizar resultados en una tabla y conservarlos con localStorage.",
        "Agregar CSS, README y commits descriptivos.",
    ],
}

ROLE_HINTS = {
    "Sistema de pedidos Delivery": [
        "Integrante A: catálogo, formulario y CSS.",
        "Integrante B: datos, cálculo, DOM y persistencia.",
        "Ambos: validaciones, pruebas, README y sustentación.",
    ],
    "Carrito de restaurante": [
        "Integrante A: cierre de carrito, total y recibo.",
        "Integrante B: variables CSS, responsive, accesibilidad y componentes.",
        "Ambos: validación, persistencia, README y pruebas.",
    ],
    "Cajero automático didáctico": [
        "Integrante A: formulario de acceso, interfaz y CSS.",
        "Integrante B: autenticación, saldo, retiro y validación.",
        "Ambos: pruebas de intentos, fondos y autoría.",
    ],
    "Registro de actividades": [
        "Integrante A: formulario, resumen y CSS.",
        "Integrante B: objeto registro, validación y localStorage.",
        "Ambos: edición, README y commits identificables.",
    ],
}

PREAMBLE = r"""\documentclass[10pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[spanish,es-nodecimaldot]{babel}
\usepackage{lmodern}
\usepackage[margin=1.85cm,headheight=14pt]{geometry}
\usepackage{xcolor}
\usepackage{booktabs,tabularx,array,longtable}
\usepackage{enumitem}
\usepackage{fancyhdr}
\usepackage{hyperref}
\usepackage{listings}
\usepackage{microtype}
\definecolor{navy}{HTML}{173F67}
\definecolor{blue}{HTML}{276FA8}
\definecolor{soft}{HTML}{F3F6F9}
\definecolor{line}{HTML}{D5DFE8}
\hypersetup{colorlinks=true,linkcolor=navy,urlcolor=blue}
\pagestyle{fancy}
\fancyhf{}
\lhead{\small Seminario de Programación - Periodo 2}
\rhead{\small Instituto Jorge Robledo}
\cfoot{\small \thepage}
\setlength{\parindent}{0pt}
\setlength{\parskip}{5pt}
\setlist[itemize]{leftmargin=5mm,itemsep=2pt,topsep=3pt}
\setlist[enumerate]{leftmargin=6mm,itemsep=3pt,topsep=3pt}
\newcommand{\ruleline}{\par\noindent\color{line}\rule{\linewidth}{0.6pt}\color{black}\par}
\newcommand{\statusbox}[2]{\noindent\fcolorbox{line}{soft}{\parbox{0.94\linewidth}{\textbf{#1}\\#2}}}
\newcommand{\scorebox}[2]{\fcolorbox{line}{soft}{\parbox{0.43\linewidth}{\centering\textcolor{navy}{\Large\textbf{#1}}\\[-1mm]\small #2}}}
\lstset{basicstyle=\ttfamily\small,backgroundcolor=\color{soft},frame=single,rulecolor=\color{line},breaklines=true,columns=fullflexible,showstringspaces=false}
"""


def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def latex_escape(value) -> str:
    mapping = {
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
    return "".join(mapping.get(char, char) for char in str(value))


def slug(value: str) -> str:
    plain = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", plain).strip("_")


def title_block(title: str, subtitle: str) -> str:
    return rf"""\begin{{center}}
{{\color{{navy}}\Large\bfseries {latex_escape(title)}}}\\[2mm]
{{\small {latex_escape(subtitle)}}}
\end{{center}}
\ruleline
"""


def itemize(items: list[str]) -> str:
    if not items:
        return r"\emph{Sin evidencia disponible.}"
    return "\\begin{itemize}\n" + "\n".join(f"\\item {latex_escape(item)}" for item in items) + "\n\\end{itemize}\n"


def criterion_map(audit: dict) -> dict[str, dict]:
    return {criterion.get("label", ""): criterion for criterion in audit.get("criteria", [])}


def individual_guide(student: dict, project: dict | None, benchmark: dict | None) -> str:
    audit = (project or {}).get("audit") or {}
    score = audit.get("score") or {}
    repository = student.get("repository") or "Pendiente de vincular"
    commit = (project or {}).get("commit") or {}
    score_text = f"{score.get('grade', 0):.2f}/5.00" if score else "No evaluable"
    percent_text = f"{score.get('percent')}%" if score else "Sin porcentaje"
    level_text = score.get("statusLabel") if score else "Sin evidencia verificable"
    criteria = criterion_map(audit)
    benchmark_criteria = (benchmark or {}).get("criteria") or {}

    table = r"\statusbox{Estado de evaluación}{No existe repositorio vinculado. No se asigna una nota técnica automática porque no hay código, commit ni ejecución verificables.}"
    if criteria:
        rows = []
        for label, weight in WEIGHTS.items():
            current = float(criteria.get(label, {}).get("score", 0))
            reference = float(benchmark_criteria.get(label, current))
            gap = max(0.0, reference - current)
            rows.append(f"{latex_escape(label)} & {weight}\\% & {current:.1f} & {reference:.1f} & {gap:.1f} " + r"\\")
        table = r"""\begin{table}[h]
\centering\small
\begin{tabularx}{\linewidth}{>{\raggedright\arraybackslash}X c c c c}
\toprule
\textbf{Criterio} & \textbf{Peso} & \textbf{Actual} & \textbf{Ref.} & \textbf{Brecha}\\
\midrule
""" + "\n".join(rows) + r"""
\bottomrule
\end{tabularx}
\end{table}
"""

    strengths = (audit.get("feedback") or {}).get("strengths", [])[:6]
    risks = (audit.get("feedback") or {}).get("risks", [])[:7]
    actions = (audit.get("feedback") or {}).get("nextActions", [])[:6]
    if not actions:
        actions = PENDING_STEPS.get(student["id"], [
            "Vincular un repositorio público.",
            "Subir una página HTML principal ejecutable.",
            "Agregar JavaScript, DOM, validación y CSS.",
            "Documentar integrantes, roles e instrucciones en README.md.",
        ])
    roles = ROLE_HINTS.get(student.get("project", ""), [
        "Integrante A: interfaz HTML y CSS.",
        "Integrante B: JavaScript, DOM y persistencia.",
        "Ambos: validaciones, pruebas, README y sustentación.",
    ])

    gap_items = []
    if criteria and benchmark_criteria:
        for label in WEIGHTS:
            current = float(criteria.get(label, {}).get("score", 0))
            reference = float(benchmark_criteria.get(label, current))
            if reference - current > 0.05:
                gap_items.append(f"{label}: subir de {current:.1f} a un nivel cercano a {reference:.1f} con evidencia real en el repositorio.")
    else:
        gap_items = [
            "Repositorio y commit inicial verificables.",
            "Página HTML visible y organizada.",
            "JavaScript con funciones, eventos y resultados en el DOM.",
            "Validación, flujo completo, CSS, README y commits descriptivos.",
        ]

    benchmark_text = "No existe referencia auditada."
    if benchmark:
        benchmark_text = f"La referencia actual es {benchmark.get('project')} de {benchmark.get('name')}, con {benchmark.get('grade'):.2f}/5.00 ({benchmark.get('percent')}%)."

    return PREAMBLE + rf"""\begin{{document}}
{title_block('Guía individual de avance', student['name'] + ' - ' + student['group'])}
\begin{{center}}
\scorebox{{{latex_escape(score_text)}}}{{Resultado técnico provisional}}\hfill
\scorebox{{{latex_escape(percent_text)}}}{{Avance frente a la rúbrica}}
\end{{center}}
\statusbox{{Proyecto principal}}{{{latex_escape(student.get('project', 'Proyecto por registrar'))}}}
\statusbox{{Repositorio y versión}}{{{latex_escape(repository)} - commit {latex_escape(commit.get('shortSha', 'Sin SHA'))}}}
\statusbox{{Nivel actual}}{{{latex_escape(level_text)}}}

\section*{{1. Lectura del estado actual}}
{latex_escape(benchmark_text)} La valoración automática analiza evidencia observable y debe confirmarse mediante ejecución, explicación y modificación en vivo.
{table}
\section*{{2. Evidencias favorables}}
{itemize(strengths)}
\section*{{3. Riesgos o bloqueadores}}
{itemize(risks or ['No hay código verificable para analizar.'])}

\newpage
\section*{{4. Qué falta para alcanzar el nivel de referencia}}
{itemize(gap_items[:8])}
\section*{{5. Plan de trabajo para hoy}}
\begin{{enumerate}}
{''.join(f'\\item {latex_escape(action)}\n' for action in actions)}\end{{enumerate}}
\section*{{6. Distribución sugerida si trabaja en pareja}}
{itemize(roles)}
\statusbox{{Regla de trabajo grupal}}{{El repositorio y el puntaje técnico pueden ser comunes, pero cada integrante debe aparecer en el README, tener un rol concreto, explicar su aporte y realizar un commit identificable o una modificación en vivo.}}

\newpage
\section*{{7. Evidencias que deben quedar subidas}}
\begin{{enumerate}}
\item Código actualizado y ejecutable desde una página HTML principal.
\item README con propósito, integrantes, roles, instrucciones y estado actual.
\item Al menos tres commits descriptivos; evitar mensajes como ``final'', ``cambios'' o ``Add files via upload''.
\item Demostración del flujo principal y prueba de un caso de error.
\item Lista de lo terminado y de lo pendiente para la próxima clase.
\end{{enumerate}}
\section*{{8. Verificación con el docente}}
\begin{{enumerate}}
\item Abrir el commit actual y ejecutar la página principal.
\item Explicar entrada, procesamiento, estado y salida.
\item Identificar el bloqueador más importante.
\item Realizar una corrección pequeña en vivo.
\item Crear un commit descriptivo y volver a ejecutar.
\end{{enumerate}}
\section*{{9. Ejemplos de commits válidos}}
\begin{{lstlisting}}
feat: agrega formulario y resultados visibles
fix: valida cantidades y evita valores negativos
style: organiza la interfaz con grid responsive
docs: documenta integrantes, roles y ejecucion
\end{{lstlisting}}
\vfill
{{\small\textit{{Generado con el estado observado en la copia central. La valoración técnica no sustituye la sustentación individual.}}}}
\end{{document}}
"""


def teacher_guide(students: list[dict], project_index: dict, benchmark: dict | None) -> str:
    rows = []
    for student in students:
        project = project_index.get(student["id"]) or {}
        score = (project.get("audit") or {}).get("score") or {}
        state = f"{score.get('grade'):.2f}/5" if score else "No evaluable"
        priority = ((project.get("audit") or {}).get("feedback") or {}).get("nextActions", [])
        priority_text = priority[0] if priority else "Vincular repositorio y subir versión mínima."
        rows.append(
            f"{latex_escape(student['name'])} & {latex_escape(student.get('project', ''))} & "
            f"{latex_escape('Vinculado' if student.get('repository') else 'Pendiente')} & {latex_escape(state)} & "
            f"{latex_escape(priority_text)} " + r"\\"
        )
    reference_text = "Sin referencia auditada."
    if benchmark:
        reference_text = f"{benchmark.get('project')} de {benchmark.get('name')}: {benchmark.get('grade'):.2f}/5.00 y {benchmark.get('percent')}%."
    return PREAMBLE + rf"""\begin{{document}}
{title_block('Guía docente previa a la clase', 'Seminario de Programación - 29 de julio de 2026')}
\section*{{Objetivo de la sesión}}
Revisar el estado real de cada proyecto ya subido, confirmar equipos o parejas, ejecutar el último SHA, acordar una meta verificable y dejar un commit nuevo con evidencia individual.
\section*{{Estado antes de la clase}}
\scriptsize
\begin{{longtable}}{{p{{3.0cm}}p{{2.6cm}}p{{1.5cm}}p{{1.5cm}}p{{5.2cm}}}}
\toprule
\textbf{{Estudiante}} & \textbf{{Proyecto}} & \textbf{{Repo}} & \textbf{{Estado}} & \textbf{{Primera prioridad}}\\
\midrule
{'\n'.join(rows)}
\bottomrule
\end{{longtable}}
\normalsize
\section*{{Orden recomendado}}
\begin{{enumerate}}
\item Proyectos con error sintáctico o que no ejecutan.
\item Proyectos con repositorio pero baja integración visible.
\item Proyectos compartidos: confirmar integrantes, roles y autoría.
\item Proyecto de referencia: cerrar faltantes y profundizar CSS.
\item Estudiantes sin repositorio: vincular cuenta, pareja y versión mínima.
\end{{enumerate}}

\newpage
\section*{{Protocolo por estudiante o pareja (10-12 minutos)}}
\begin{{enumerate}}
\item Confirmar nombres, grupo, proyecto, repositorio y modalidad individual o grupal.
\item Ejecutar la página principal del último SHA copiado.
\item Verificar flujo principal, error visible y persistencia si aplica.
\item Pedir explicación: entrada, función, estado, DOM y salida.
\item Seleccionar una meta concreta para hoy.
\item Realizar una modificación en vivo y un commit descriptivo.
\item Registrar resultado, bloqueador, integrantes y siguiente paso.
\end{{enumerate}}
\section*{{Reglas para parejas}}
\begin{{itemize}}
\item Máximo dos estudiantes por proyecto durante este periodo.
\item Un repositorio compartido puede representar a ambos.
\item README obligatorio con integrantes y roles.
\item La nota técnica del repositorio puede ser común; explicación, autoría y modificación en vivo son individuales.
\item Cada integrante debe aportar commits propios o demostrar claramente su parte.
\end{{itemize}}
\section*{{Referencia técnica actual}}
{latex_escape(reference_text)} Se usa como comparación por la mayor evidencia técnica, no porque el proyecto esté terminado.
\section*{{Producto mínimo al terminar la clase}}
\begin{{itemize}}
\item Equipo o modalidad individual confirmada.
\item Repositorio vinculado y página principal ejecutada.
\item Meta concreta registrada.
\item Cambio verificable y commit nuevo.
\item Guía individual entregada o compartida.
\end{{itemize}}
\end{{document}}
"""


def reference_guide(benchmark: dict | None) -> str:
    reference_name = benchmark.get("name", "Estudiante de referencia") if benchmark else "Estudiante de referencia"
    return PREAMBLE + rf"""\begin{{document}}
{title_block('Proyecto de referencia desde cero', 'Carrito web completo con HTML, CSS, JavaScript, DOM y localStorage')}
\section*{{Propósito}}
Construir una aplicación que permita seleccionar productos, validar cantidades, calcular subtotales y total, guardar el pedido y mostrar un recibo. Este estándar se adapta a otras temáticas; no obliga a copiar el carrito.
\section*{{Estructura mínima}}
\begin{{lstlisting}}
mi-proyecto/
  index.html
  recibo.html
  css/styles.css
  js/products.js
  js/cart.js
  js/app.js
  js/receipt.js
  README.md
\end{{lstlisting}}
\section*{{Criterios}}
\begin{{tabularx}}{{\linewidth}}{{>{{\raggedright\arraybackslash}}X X}}
\toprule
\textbf{{Elemento}} & \textbf{{Evidencia esperada}}\\\midrule
HTML & header, main, section, formularios, labels y salida visible\\
JavaScript & objetos, arreglos, funciones, condiciones y cálculos\\
DOM y eventos & addEventListener, renderizado y mensajes\\
CSS & variables, Grid/Flexbox, responsive y estados\\
Persistencia & JSON.stringify/JSON.parse con localStorage\\
Validación & entradas válidas y errores visibles\\
Integración & entrada -> proceso -> estado -> salida\\
Git & README y commits pequeños\\
\bottomrule
\end{{tabularx}}

\newpage
\section*{{1. Modelo de datos}}
\begin{{lstlisting}}
export const products = [
  {{ id: "hamburguesa", name: "Hamburguesa", price: 15000 }},
  {{ id: "pizza", name: "Pizza personal", price: 18000 }},
  {{ id: "gaseosa", name: "Gaseosa", price: 5000 }}
];
\end{{lstlisting}}
\section*{{2. HTML principal}}
\begin{{lstlisting}}
<header><h1>Carrito de restaurante</h1></header>
<main>
  <section><h2>Productos</h2><div id="product-list"></div></section>
  <section>
    <h2>Pedido</h2>
    <div id="cart-list"></div>
    <p>Total: <strong id="cart-total">$0</strong></p>
    <p id="form-message" role="status"></p>
    <button id="checkout-button" type="button">Finalizar</button>
  </section>
</main>
\end{{lstlisting}}
\section*{{3. Funciones}}
\begin{{lstlisting}}
const cart = [];
function addToCart(productId, quantity) {{
  const amount = Number(quantity);
  if (!Number.isInteger(amount) || amount <= 0) {{
    throw new Error("La cantidad debe ser un entero positivo");
  }}
  const product = products.find(item => item.id === productId);
  if (!product) throw new Error("Producto no encontrado");
  const existing = cart.find(item => item.id === productId);
  if (existing) existing.quantity += amount;
  else cart.push({{ ...product, quantity: amount }});
}}
function calculateTotal() {{
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}}
\end{{lstlisting}}

\newpage
\section*{{4. DOM y eventos}}
\begin{{lstlisting}}
function renderCart() {{
  cartList.innerHTML = "";
  for (const item of cart) {{
    const row = document.createElement("article");
    row.textContent = `${{item.name}} - ${{item.quantity * item.price}}`;
    cartList.append(row);
  }}
  totalOutput.textContent = `$${{calculateTotal()}}`;
}}
productList.addEventListener("click", event => {{
  const button = event.target.closest("[data-add-product]");
  if (!button) return;
  try {{ addToCart(button.dataset.addProduct, 1); renderCart(); }}
  catch (error) {{ message.textContent = error.message; }}
}});
\end{{lstlisting}}
\section*{{5. Persistencia y recibo}}
\begin{{lstlisting}}
localStorage.setItem("restaurant-cart", JSON.stringify(cart));
window.location.href = "recibo.html";

const saved = JSON.parse(localStorage.getItem("restaurant-cart") || "[]");
\end{{lstlisting}}
\section*{{6. CSS}}
\begin{{lstlisting}}
:root {{ --ink:#172033; --surface:#fff; --canvas:#f3f6f9;
  --primary:#1f5f96; --line:#d6e0e8; --radius:12px; }}
.product-grid {{ display:grid;
  grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:1rem; }}
button:focus-visible {{ outline:3px solid #78aeda; }}
button:disabled {{ opacity:.55; cursor:not-allowed; }}
@media (max-width:650px) {{ main {{ padding:.75rem; }} }}
\end{{lstlisting}}

\newpage
\section*{{7. README y commits}}
\begin{{lstlisting}}
# Nombre del proyecto
## Integrantes y roles
## Objetivo
## Como ejecutar
## Flujo principal
## Validaciones
## Estado actual y pendientes
\end{{lstlisting}}
\begin{{lstlisting}}
feat: renderiza catalogo de productos
feat: agrega productos y calcula total
fix: valida cantidades enteras positivas
feat: guarda datos y genera recibo
style: crea componentes y responsive
docs: documenta integrantes y ejecucion
\end{{lstlisting}}
\section*{{8. Pruebas}}
\begin{{enumerate}}
\item Abrir sin errores 404.
\item Probar entrada válida y errores.
\item Confirmar cálculos y actualización del DOM.
\item Recargar y verificar persistencia.
\item Revisar móvil, teclado, foco visible y mensajes.
\item Confirmar integrantes, roles y autoría.
\end{{enumerate}}
\section*{{Meta del referente}}
{latex_escape(reference_name)} debe cerrar persistencia y recibo, añadir validaciones explícitas, responsive, variables CSS y documentación. Ser referente significa avanzar hacia un flujo completo y explicable, no conservar el mismo puntaje.
\end{{document}}
"""


def compile_tex(tex_path: Path, output_pdf: Path) -> None:
    build_dir = TEX_DIR / ".build" / tex_path.stem
    shutil.rmtree(build_dir, ignore_errors=True)
    build_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["latexmk", "-pdf", "-interaction=nonstopmode", "-halt-on-error", f"-outdir={build_dir}", str(tex_path)],
        check=True,
    )
    shutil.copy2(build_dir / f"{tex_path.stem}.pdf", output_pdf)


def main() -> None:
    roster = read_json(ROSTER_PATH, {"students": []})
    project_index = read_json(PROJECT_INDEX_PATH, {"projects": {}, "benchmark": None})
    students = roster.get("students", [])
    projects = project_index.get("projects", {})
    benchmark = project_index.get("benchmark")

    TEX_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    generated = []
    teacher_name = "guia_docente_preclase_2026_07_29"
    reference_name = "guia_proyecto_referencia_desde_cero"
    documents = {
        teacher_name: teacher_guide(students, projects, benchmark),
        reference_name: reference_guide(benchmark),
    }
    for student in students:
        documents[f"guia_{slug(student['name'])}"] = individual_guide(student, projects.get(student["id"]), benchmark)

    for name, content in documents.items():
        tex_path = TEX_DIR / f"{name}.tex"
        pdf_path = PDF_DIR / f"{name}.pdf"
        tex_path.write_text(content, encoding="utf-8")
        compile_tex(tex_path, pdf_path)
        generated.append(pdf_path)

    shutil.rmtree(TEX_DIR / ".build", ignore_errors=True)
    archive = GUIDES_ROOT / "seminario_guias_2026_07_29"
    shutil.make_archive(str(archive), "zip", root_dir=GUIDES_ROOT, base_dir=".")

    index = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "teacherGuide": f"guides/pdf/{teacher_name}.pdf",
        "referenceGuide": f"guides/pdf/{reference_name}.pdf",
        "sourceArchive": "guides/seminario_guias_2026_07_29.zip",
        "students": [],
    }
    for student in students:
        project = projects.get(student["id"]) or {}
        score = ((project.get("audit") or {}).get("score") or {})
        index["students"].append({
            "id": student["id"],
            "name": student["name"],
            "group": student["group"],
            "project": student.get("project", ""),
            "repository": student.get("repository", ""),
            "grade": score.get("grade"),
            "percent": score.get("percent"),
            "pdf": f"guides/pdf/guia_{slug(student['name'])}.pdf",
        })
    (GUIDES_ROOT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(generated)} PDF guides")


if __name__ == "__main__":
    main()
