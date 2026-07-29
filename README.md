# Seminario Goal — Periodo 2

Página maestra docente para **Seminario de Programación, grado 11**, Instituto Jorge Robledo.

## Enlaces

- Repositorio: `juanperez238421-cpu/Seminario_Goal_Period2`
- Página maestra: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/`
- Análisis individual completo: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/individual-analysis.html`
- Entrevista puntual: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/session.html`
- Revisión de copias locales: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/project-review.html`
- Portafolio y parejas: `https://juanperez238421-cpu.github.io/Seminario_Goal_Period2/portfolio.html`
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
- Monitoreo central de commits cada 12 horas.
- Copia automática de cada repositorio vinculado dentro de este repositorio maestro.
- Índice de todos los archivos HTML disponibles por estudiante.
- Ejecución aislada del estado exacto copiado desde el SHA monitoreado.
- Historial de revisiones y transferencia de evidencias a la ficha maestra.
- Análisis individual con estado actual, conceptos demostrados, faltantes, riesgos, proyecto esperado y siguiente commit.
- Soporte para proyectos individuales o parejas de máximo dos integrantes.
- Despliegue automático en GitHub Pages.

## Análisis individual completo

`individual-analysis.html` concentra la información necesaria para sentarse con cada estudiante antes de abrir el editor.

Para cada estudiante muestra:

- modalidad individual o pareja;
- integrantes y roles;
- proyecto y repositorio;
- último SHA copiado;
- diagnóstico técnico provisional;
- distancia frente al proyecto de referencia;
- indicadores reales de HTML, JavaScript, CSS, DOM, eventos y validaciones;
- estado por criterio;
- conceptos ya demostrados;
- conceptos que faltan;
- elementos incompletos y riesgos;
- páginas HTML encontradas;
- resultado final esperado;
- preguntas para comprobar comprensión;
- secuencia de prueba frente al docente;
- un único acuerdo para el siguiente commit;
- mensaje de commit recomendado.

El flujo docente recomendado es:

```text
Abrir análisis individual
→ seleccionar estudiante
→ leer comentario inicial
→ revisar fortalezas y faltantes
→ abrir entrevista puntual
→ ejecutar actividad principal
→ pedir explicación y modificación en vivo
→ registrar un único acuerdo
→ comparar el siguiente SHA
```

Los estudiantes sin repositorio no reciben automáticamente una nota de cero. La página muestra una ruta inicial para confirmar equipo, crear estructura, demostrar una interacción y publicar el primer commit.

## Copias centrales de los proyectos

El workflow `.github/workflows/monitor.yml` consulta cada repositorio público vinculado y guarda su estado actual dentro de:

```text
student-projects/<student-id>/current/
```

Cada estudiante con repositorio confirmado o provisional tiene además:

```text
student-projects/<student-id>/manifest.json
```

El índice general está en:

```text
student-projects/index.json
```

El manifiesto registra:

- estudiante y grupo;
- repositorio original;
- SHA exacto copiado;
- mensaje, autor y fecha del commit;
- fecha de la copia;
- cantidad de archivos;
- tamaño total;
- lista completa de páginas HTML;
- página de entrada recomendada;
- auditoría técnica provisional.

Solo se conserva la copia actual. Cuando aparece un nuevo commit, la automatización reemplaza `current/` y deja el nuevo SHA en el manifiesto y en el historial central.

## Estado actual de las copias

Actualmente están copiados y listos para ejecutar:

- Juan Pablo Arango Giraldo — `jp0705git/SeminarioProgramacion2`.
- Jerónimo Rodríguez Peña — `jrod917/Carrito`.
- Pedro Pablo Arbeláez Escobar — `Pedropae07/practice_seminario`.
- Pablo Jaramillo Palacio — `pablitojarita2008-oss/pablitoSeminario`.

Permanecen pendientes hasta registrar su usuario y repositorio:

- Jerónimo Mazo López.
- Samuel Chavarriaga Avendaño.
- Alejandro Rico Páramo.
- Tomás González Giraldo.
- Alejandro Rincón Torres.

## Revisión frente al estudiante

`project-review.html` permite revisar el proyecto sin depender de que el estudiante haya configurado GitHub Pages.

El flujo es:

```text
Seleccionar estudiante
→ leer student-projects/index.json
→ cargar la copia central del SHA
→ escoger cualquiera de las páginas HTML
→ ejecutar el proyecto en vista aislada
→ probar el flujo con el estudiante
→ registrar resultado, bloqueador y explicación
→ enviar evidencia a la ficha maestra
```

La página permite:

- abrir la copia del proyecto almacenada en este repositorio;
- revisar varias prácticas HTML del mismo estudiante;
- abrir el repositorio y el commit originales;
- abrir el proyecto en pantalla completa;
- usar opcionalmente una URL publicada;
- registrar si funciona, funciona parcialmente, falla o está bloqueado;
- conservar el archivo de entrada utilizado;
- registrar explicación, modificación en vivo y observaciones;
- mantener historial por estudiante;
- enviar evidencias a la evaluación principal.

### Seguridad y alcance

La vista integrada usa un `iframe` aislado. La copia del estudiante no puede modificar el repositorio maestro.

La ejecución automática cubre proyectos públicos de HTML, CSS y JavaScript. Python, Java, Node.js con servidor, bases de datos y servicios privados deben ejecutarse en el computador del estudiante.

Para probar persistencia, navegación compleja o APIs del navegador que el aislamiento limite, usa **Abrir proyecto en pantalla completa**.

## Rutas de aprendizaje

### Consolidación funcional

1. HTML estructurado.
2. JavaScript conectado.
3. Eventos y DOM.
4. Validación.
5. Navegación o `localStorage`.
6. Flujo completo.
7. README y commits descriptivos.

### Especialización CSS

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

La nota se considera provisional hasta verificar ejecución, explicación, modificación en vivo y autoría.

## Privacidad

Las calificaciones, observaciones, sesiones de revisión, parejas y asistencia permanecen en el navegador del docente mediante `localStorage`. Exporta el respaldo JSON al terminar cada jornada.

Los proyectos copiados conservan únicamente el contenido público que ya existe en los repositorios estudiantiles vinculados.

## Automatización cada 12 horas

```text
Leer data/students.json
→ consultar último commit
→ descargar exactamente ese SHA
→ eliminar metadatos .git y enlaces simbólicos
→ validar límite de 50 MB y 5.000 archivos
→ copiar el proyecto a student-projects/<id>/current/
→ generar manifest.json e index.json
→ actualizar data/monitor/
→ hacer commit automático
→ desplegar nuevamente GitHub Pages
```

El cron se ejecuta aproximadamente a las `07:00` y `19:00` de Colombia. También puede iniciarse manualmente desde **Actions → Monitor and mirror student repositories**.

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
npm test
npm run check
```

## Activar GitHub Pages

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Después ejecuta **Deploy GitHub Pages** o realiza un nuevo commit en `main`.
