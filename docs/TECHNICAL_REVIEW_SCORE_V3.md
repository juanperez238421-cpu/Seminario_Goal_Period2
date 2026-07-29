# Revisión técnica y pedagógica — modo entrevista v3

Fecha de revisión: 2026-07-29

## Puntaje de la versión anterior

**8,1/10**

| Dimensión | Puntaje | Diagnóstico |
|---|---:|---|
| Pertinencia pedagógica | 9,2 | La entrevista se centra en una actividad, una pregunta, una modificación y un commit. |
| Experiencia docente | 8,6 | La selección por estudiante y actividad es clara, pero faltaba una síntesis cuantitativa de la sesión. |
| Evidencia y calificación | 6,8 | Existía diagnóstico del repositorio y listas de verificación, pero no una nota orientadora que combinara ambos. |
| Arquitectura HTML/JavaScript | 7,6 | La solución es funcional, aunque parte del análisis se repite entre cliente y automatización. |
| GitHub y automatización | 8,4 | Monitoreo, copia por SHA, Pages, PDF y validación automatizada están integrados. |
| Trazabilidad | 8,0 | Se guardan acuerdos e historial, pero la evidencia cuantitativa de la entrevista no quedaba separada. |
| Mantenibilidad | 7,2 | `session.js` concentra demasiadas responsabilidades y requiere modularización progresiva. |

## Problemas prioritarios identificados

1. El porcentaje técnico del repositorio podía confundirse con una nota final.
2. Las seis verificaciones de la entrevista no producían una síntesis cuantitativa.
3. No existía una puerta de cierre explícita que impidiera marcar como finalizada una actividad bloqueada.
4. No se distinguía claramente entre diagnóstico del repositorio, diagnóstico de actividad y evidencia individual.
5. La conversación docente podía terminar con varios datos, pero sin una decisión compacta.

## Actualización aplicada

Se añadió un módulo independiente de valoración de entrevista:

```text
Diagnóstico del repositorio 30 %
+ diagnóstico de la actividad 40 %
+ evidencia individual 30 %
= nota orientadora provisional de la sesión
```

La evidencia individual pondera:

- ejecución: 20 %;
- pertinencia conceptual: 15 %;
- explicación: 20 %;
- responsabilidad individual: 10 %;
- modificación en vivo: 25 %;
- commit descriptivo: 10 %.

## Regla de cierre

Una actividad solo aparece como **verificable como finalizada** cuando:

- no está bloqueada;
- alcanza el criterio técnico de actividad finalizable;
- abre y ejecuta;
- el concepto es pertinente;
- el estudiante explica entrada, proceso y salida;
- demuestra su responsabilidad;
- realiza una modificación en vivo.

El commit descriptivo mejora la trazabilidad, pero no compensa una actividad que no funciona.

## Puntaje esperado después de la actualización

**9,1/10**, sujeto a la ejecución correcta del workflow y a una prueba real durante la clase.

| Dimensión | Puntaje esperado | Mejora |
|---|---:|---|
| Pertinencia pedagógica | 9,5 | El cierre se basa en demostración observable. |
| Experiencia docente | 9,2 | La entrevista presenta nota, componentes, confianza y requisitos pendientes. |
| Evidencia y calificación | 9,0 | Se separan repositorio, actividad y evidencia individual. |
| Arquitectura HTML/JavaScript | 8,2 | La lógica de puntuación se extrae a un módulo puro y probado. |
| GitHub y automatización | 8,8 | Pages y CI incluyen los nuevos módulos. |
| Trazabilidad | 9,0 | Cada guardado conserva una instantánea de la valoración de sesión. |
| Mantenibilidad | 8,0 | La puntuación es reutilizable y cuenta con pruebas unitarias. |

## Riesgos que continúan

- El análisis de código sigue siendo estático y puede no detectar todos los errores de ejecución.
- Las observaciones y calificaciones permanecen en `localStorage` hasta exportar un respaldo.
- Los repositorios sin vínculo no pueden obtener una valoración técnica.
- La versión debe probarse con un estudiante real para calibrar tiempos y ponderaciones.

## Criterio profesional

La nota orientadora no debe registrarse automáticamente como nota definitiva. Su función es ayudar al docente a explicar el estado actual, justificar el siguiente paso y decidir si la actividad puede cerrarse. La decisión final continúa dependiendo de la ejecución, sustentación y autoría observadas.
