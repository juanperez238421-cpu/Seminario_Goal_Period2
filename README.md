# Seminario Goal — Periodo 2

Página maestra docente para **Seminario de Programación, grado 11**, Instituto Jorge Robledo.

## Enlaces

- Página maestra: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/`
- Ruta común de proyectos: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/individual-analysis.html`
- Entrevista puntual: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/session.html`
- Ejecución de copias locales: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/project-review.html`
- Portafolio y parejas: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/portfolio.html`

## Enfoque pedagógico simplificado

Todos los estudiantes trabajan una misma temática:

> **Aplicaciones web de gestión**

Los contextos pueden variar —registro, carrito, Delivery, cajero, inventario, tareas o notas—, pero la ruta, los conceptos y los criterios son comunes.

La aplicación ya no exige interpretar ocho criterios técnicos durante cada conversación. Para la entrevista se utilizan tres proyectos y cinco criterios simples.

## Tres proyectos para todos

### Proyecto 1 · Registro interactivo

Debe incluir:

- formulario con varios campos;
- `label` e `input`;
- evento `submit` o `click`;
- objeto de datos;
- validación;
- resumen visible mediante DOM.

Variantes válidas: registro estudiantil, registro de actividades, formulario de usuario o inscripción.

### Proyecto 2 · Gestión de operaciones

Debe incluir:

- entrada de datos;
- funciones;
- condicionales;
- arreglos u objetos;
- eventos;
- resultado dinámico;
- casos válidos e inválidos.

Variantes válidas: carrito, Delivery, cajero automático, gestor de tareas, inventario o calculadora de notas.

### Proyecto 3 · Aplicación integrada

Debe incluir:

- flujo completo de entrada, proceso y salida;
- `localStorage`;
- `JSON.stringify()` y `JSON.parse()`;
- recuperación de información;
- recibo, resumen, historial o reporte;
- CSS responsive;
- README y commits descriptivos.

La definición completa está en `data/common-project-path.json` y en `docs/RUTA_COMUN_PROYECTOS.md`.

## Cinco criterios comunes

Cada proyecto se revisa con cinco criterios de 20 %:

| Criterio | Evidencia mínima |
|---|---|
| Interfaz | La página abre y presenta controles comprensibles. |
| Funcionamiento | Los eventos ejecutan la lógica y muestran resultados. |
| Datos y validación | Controla entradas y usa objetos, arreglos o persistencia. |
| Presentación CSS | Tiene estilos propios, distribución y adaptación básica. |
| Explicación y Git | El estudiante explica, modifica y deja un commit descriptivo. |

Estados de proyecto:

| Avance | Estado |
|---:|---|
| 0 % | Sin iniciar |
| 20–40 % | En construcción |
| 60–80 % | Funcional parcial |
| 100 % | Completo |

El porcentaje de la ruta común es el promedio de los tres proyectos. No reemplaza la nota técnica histórica ni la valoración docente.

## Ruta del estudiante avanzado

El estudiante con mayor desarrollo técnico sigue completando los tres proyectos. Su profundización consiste en aplicar CSS a todos:

- variables CSS;
- Flexbox o Grid;
- responsive;
- estados `hover`, `focus`, `disabled` y error;
- componentes reutilizables;
- jerarquía visual consistente.

## Proyectos en pareja

`individual-analysis.html` permite vincular dos estudiantes y elegir cuáles proyectos comparten.

Se sincronizan para la pareja:

- interfaz;
- funcionamiento;
- datos y validación;
- CSS;
- variante y repositorio del proyecto compartido.

Permanece individual:

- explicación;
- autoría;
- modificación en vivo;
- evidencia Git.

El criterio **Explicación y Git** nunca se copia automáticamente entre integrantes.

## Procedimiento para sentarse con cada estudiante

```text
Seleccionar estudiante
→ confirmar proyecto individual o pareja
→ abrir el repositorio
→ identificar Proyecto 1, 2 o 3
→ ejecutar un caso válido
→ ejecutar un caso inválido
→ marcar únicamente la evidencia comprobada
→ seleccionar un solo proyecto actual
→ asignar el primer criterio pendiente
→ pedir una modificación en vivo
→ exigir un commit descriptivo
```

La página genera automáticamente:

- comentario breve para iniciar;
- porcentaje de la ruta común;
- estado de cada proyecto;
- siguiente proyecto;
- primer criterio pendiente;
- commit recomendado;
- ruta especial de CSS para el estudiante de referencia.

## Copias centrales de los repositorios

El workflow `.github/workflows/monitor.yml` consulta cada repositorio público vinculado y guarda su estado actual en:

```text
student-projects/<student-id>/current/
```

Cada copia incluye un `manifest.json` con:

- repositorio original;
- SHA exacto;
- autor, mensaje y fecha del commit;
- archivos HTML;
- página de entrada;
- auditoría técnica provisional.

El índice general está en:

```text
student-projects/index.json
```

## Estado actual de las copias

Con repositorio copiado y auditable:

- Juan Pablo Arango Giraldo — `jp0705git/SeminarioProgramacion2`.
- Jerónimo Rodríguez Peña — `jrod917/Carrito`.
- Pedro Pablo Arbeláez Escobar — `Pedropae07/practice_seminario`.
- Pablo Jaramillo Palacio — `pablitojarita2008-oss/pablitoSeminario`.

Pendientes de vincular:

- Jerónimo Mazo López.
- Samuel Chavarriaga Avendaño.
- Alejandro Rico Páramo.
- Tomás González Giraldo.
- Alejandro Rincón Torres.

Los estudiantes pendientes no reciben automáticamente una nota de cero. Primero deben vincular un repositorio o una pareja y dejar una página ejecutable.

## Ejecución frente al estudiante

`project-review.html` permite:

- abrir la copia del SHA monitoreado;
- seleccionar cualquier página HTML;
- ejecutar el proyecto dentro de un `iframe` aislado;
- abrirlo en pantalla completa;
- probar navegación y persistencia;
- registrar funcionamiento, explicación y bloqueadores.

Los proyectos con Python, Java, Node.js con servidor, bases de datos o servicios privados deben ejecutarse en el computador del estudiante.

## Persistencia privada

La información docente permanece en el navegador mediante `localStorage`.

Claves principales:

```text
seminario-goal-p2-students-v1
seminario-goal-p2-teams-v1
seminario-goal-p2-common-path-v1
```

Las notas, parejas, observaciones y avances manuales no se publican automáticamente en GitHub.

## Automatización

Aproximadamente a las `07:00` y `19:00` de Colombia:

```text
leer data/students.json
→ consultar último commit
→ copiar exactamente ese SHA
→ eliminar metadatos .git
→ generar manifiestos y auditorías
→ actualizar student-projects/index.json
→ desplegar GitHub Pages
```

También puede iniciarse manualmente desde **Actions → Monitor and mirror student repositories**.

## Ejecutar localmente

```bash
python -m http.server 8000
```

Abrir:

```text
http://localhost:8000
http://localhost:8000/individual-analysis.html
http://localhost:8000/session.html
http://localhost:8000/project-review.html
```

## Pruebas

Requiere Node.js 20 o superior:

```bash
npm run check
npm test
```

## GitHub Pages

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Luego ejecutar **Deploy GitHub Pages** o realizar un nuevo commit en `main`.
