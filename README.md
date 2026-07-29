# Seminario Goal — Periodo 2

Página maestra docente para **Seminario de Programación, grado 11**, Instituto Jorge Robledo.

## Enlaces

- Repositorio: `juanperez238421-cpu/Seminario_Goal_Period2`
- Página maestra: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/`
- Revisión en vivo de proyectos: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/project-review.html`
- Automatizaciones: pestaña **Actions** del repositorio.

## Funciones principales

- Registro completo de estudiantes de 11-A, 11-B y 11-C.
- Proyecto, ruta de trabajo, meta, estado y fecha objetivo por estudiante.
- Rúbrica ponderada de 0,0 a 5,0.
- Evidencias de ejecución, explicación, modificación en vivo y autoría.
- Once competencias verificables.
- Asistencia por fecha, grupo y estado.
- Exportación de asistencia en CSV.
- Persistencia privada con `localStorage`.
- Exportación e importación de respaldo JSON.
- Monitoreo manual de commits desde la interfaz.
- Monitoreo central cada 12 horas con GitHub Actions.
- Historial de commits nuevos y errores de consulta.
- Ejecución aislada de proyectos web públicos desde el último commit monitoreado.
- Detección automática de todas las páginas HTML de cada repositorio.
- Registro de sesiones de revisión y transferencia de evidencias a la ficha maestra.
- Despliegue automático en GitHub Pages.

## Revisión en vivo de proyectos

`project-review.html` está diseñado para sentarse con cada estudiante y revisar el estado real de su trabajo.

El flujo es:

```text
Seleccionar estudiante
→ consultar último commit
→ detectar páginas HTML
→ escoger página de entrada
→ ejecutar copia exacta del SHA
→ probar el flujo con el estudiante
→ registrar resultado y bloqueadores
→ transferir evidencias a la ficha maestra
```

La vista previa utiliza una copia estática del repositorio público alojada por CDN y se ejecuta dentro de un `iframe` aislado. El código del estudiante no puede modificar la página maestra ni el repositorio.

La página permite:

- ejecutar el último commit exacto registrado;
- escoger entre varias prácticas HTML de un mismo repositorio;
- usar una URL publicada en GitHub Pages cuando exista;
- abrir el repositorio, el commit o el proyecto en pantalla completa;
- registrar si funciona, funciona parcialmente, falla o está bloqueado;
- conservar el archivo de entrada utilizado;
- registrar explicación, modificación en vivo, bloqueador y observaciones;
- mantener historial por estudiante;
- enviar las evidencias de ejecución a la evaluación principal.

### Alcance técnico

La ejecución automática funciona para proyectos públicos basados en HTML, CSS y JavaScript. Proyectos que dependan de Python, Java, Node.js con servidor, bases de datos o servicios privados deben ejecutarse en el computador del estudiante.

## Rutas de aprendizaje

### Consolidación funcional

Para estudiantes que necesitan completar una aplicación integrada:

1. HTML estructurado.
2. JavaScript conectado.
3. Eventos y DOM.
4. Validación.
5. Navegación o `localStorage`.
6. Flujo completo.
7. README y commits descriptivos.

### Especialización CSS

Para el proyecto de referencia con mayor integración:

1. Variables y arquitectura CSS.
2. Jerarquía visual.
3. Grid y Flexbox.
4. Responsive.
5. Estados interactivos.
6. Accesibilidad y contraste.
7. Componentes reutilizables.

## Rúbrica

| Criterio | Peso |
|---|---:|
| HTML y estructura semántica | 15 % |
| JavaScript y lógica | 20 % |
| DOM, funciones y eventos | 15 % |
| CSS y presentación | 15 % |
| Navegación y localStorage | 10 % |
| Validación y manejo de errores | 10 % |
| Integración del flujo completo | 10 % |
| Commits y documentación | 5 % |

La nota calculada debe considerarse **provisional** hasta verificar que el estudiante:

- ejecuta la aplicación;
- explica su código;
- realiza una modificación en vivo;
- presenta autoría verificable.

## Privacidad

Las calificaciones, observaciones, sesiones de revisión y asistencia no se publican en el repositorio. Permanecen en el navegador del docente mediante `localStorage`. Utiliza **Exportar respaldo JSON** al terminar cada jornada.

El archivo `data/students.json` contiene únicamente el listado académico, proyectos, repositorios y metas generales que requiere la automatización.

## Monitoreo cada 12 horas

El workflow `.github/workflows/monitor.yml` ejecuta:

```text
Leer data/students.json
→ consultar el último commit público
→ comparar SHA
→ actualizar data/monitor/latest.json
→ agregar eventos a data/monitor/history.json
→ generar data/monitor/summary.md
→ hacer commit automático si existen cambios
```

Los horarios del cron son `00:00` y `12:00 UTC`, equivalentes aproximadamente a `19:00` y `07:00` en Colombia.

## Ejecutar localmente

```bash
python -m http.server 8000
```

Abrir:

```text
http://localhost:8000
```

Laboratorio de revisión:

```text
http://localhost:8000/project-review.html
```

## Pruebas

Requiere Node.js 20 o superior:

```bash
npm test
```

## Activar GitHub Pages

En el repositorio:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Luego ejecutar el workflow **Deploy GitHub Pages** o hacer un nuevo commit en `main`.
