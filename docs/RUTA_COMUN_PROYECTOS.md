# Ruta común de proyectos — Seminario de Programación

## Propósito

La página `individual-analysis.html` se simplificó para que todos los estudiantes trabajen una misma temática general:

> **Aplicaciones web de gestión**

El contexto puede variar —registro, carrito, cajero, inventario, tareas o notas—, pero las capacidades esperadas y los criterios de revisión son iguales.

## Tres proyectos comunes

### Proyecto 1 · Registro interactivo

Todos deben construir un formulario que:

- capture varios datos;
- use `label` e `input`;
- valide la entrada;
- cree un objeto;
- muestre un resumen mediante DOM.

Variantes permitidas: registro estudiantil, registro de actividades, formulario de usuario o inscripción a un servicio.

### Proyecto 2 · Gestión de operaciones

Todos deben construir una aplicación que:

- reciba datos;
- ejecute reglas y decisiones;
- use funciones, condicionales, arreglos u objetos;
- responda a eventos;
- muestre resultados dinámicos;
- controle casos válidos e inválidos.

Variantes permitidas: carrito, Delivery, cajero automático, gestor de tareas, inventario o calculadora de notas.

### Proyecto 3 · Aplicación integrada

Todos deben cerrar un flujo completo que:

- conecte entrada, proceso y salida;
- guarde información con `localStorage` y JSON;
- recupere los datos;
- produzca un recibo, resumen, historial o reporte;
- tenga README y commits descriptivos;
- presente CSS responsive.

## Cinco criterios simples

Cada proyecto se revisa con cinco criterios de 20 %:

1. **Interfaz:** la página abre y presenta controles comprensibles.
2. **Funcionamiento:** los eventos ejecutan la lógica y muestran resultados.
3. **Datos y validación:** controla entradas y usa objetos, arreglos o persistencia.
4. **Presentación CSS:** tiene estilos propios, distribución y adaptación básica.
5. **Explicación y Git:** el estudiante explica, modifica y deja un commit descriptivo.

Un proyecto llega a 100 % únicamente cuando los cinco criterios están comprobados.

## Estado simple

| Avance | Estado |
|---:|---|
| 0 % | Sin iniciar |
| 20–40 % | En construcción |
| 60–80 % | Funcional parcial |
| 100 % | Completo |

El porcentaje de la **ruta común** es el promedio de los tres proyectos. No debe confundirse con el diagnóstico técnico previo del repositorio.

## Parejas

La página permite vincular dos estudiantes y seleccionar cuáles proyectos comparten.

Se comparte:

- repositorio;
- interfaz;
- funcionamiento;
- datos y validación;
- CSS.

No se comparte automáticamente:

- explicación;
- autoría;
- modificación en vivo;
- commit individual.

Por esa razón, el criterio **Explicación y Git** se registra por estudiante incluso cuando los otros cuatro criterios se sincronizan en la pareja.

## Estudiante de referencia

El estudiante con mayor desarrollo técnico no queda exento de los tres proyectos. Su ruta de profundización consiste en aplicar CSS de forma consistente a todos:

- variables CSS;
- Flexbox o Grid;
- responsive;
- estados `hover`, `focus`, `disabled` y error;
- componentes reutilizables.

## Procedimiento de entrevista

1. Seleccionar al estudiante.
2. Confirmar si trabaja individualmente o en pareja.
3. Abrir el repositorio actual.
4. Identificar a cuál de los tres proyectos corresponde.
5. Ejecutar un caso válido y uno inválido.
6. Marcar únicamente los criterios comprobados.
7. Elegir un solo proyecto actual.
8. Asignar el primer criterio pendiente como meta.
9. Pedir una modificación en vivo.
10. Exigir un commit descriptivo.

La página genera automáticamente el siguiente proyecto, criterio pendiente y mensaje de commit sugerido.

## Persistencia

La ruta individual y las parejas se guardan en `localStorage`:

```text
seminario-goal-p2-common-path-v1
seminario-goal-p2-teams-v1
```

Las copias de repositorios y auditorías continúan proviniendo de `student-projects/index.json`.
