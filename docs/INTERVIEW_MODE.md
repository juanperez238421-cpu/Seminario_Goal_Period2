# Modo entrevista puntual

La página `session.html` está diseñada para sentarse con un estudiante, revisar el estado real de sus actividades y acordar un único resultado verificable para el siguiente commit.

## Principio de evaluación

El proyecto de referencia aporta el conjunto de habilidades que define una aplicación integrada:

1. HTML e interfaz visible.
2. JavaScript organizado en funciones.
3. Eventos, DOM y salida visible.
4. CSS con distribución, estados y responsive.
5. Validación y mensajes de error.
6. Persistencia cuando el concepto la necesita.
7. Flujo completo de entrada, proceso y salida.
8. README, commits y autoría.

El referente no obliga a copiar la temática del carrito. Un proyecto se considera finalizado solo cuando:

- el concepto elegido es pertinente;
- la actividad principal funciona realmente;
- no existen bloqueos de sintaxis o rutas esenciales;
- la interfaz permite completar el flujo sin depender de la consola;
- el estudiante explica el recorrido de los datos;
- realiza una modificación en vivo;
- deja evidencia de autoría y un commit descriptivo.

## Estado de cada actividad

La página analiza cada archivo HTML guardado en la copia central del repositorio y revisa:

- contenido visible y controles;
- scripts y estilos conectados;
- funciones, condiciones y estructuras de datos;
- consultas y escrituras al DOM;
- eventos;
- validaciones;
- mensajes para el usuario;
- `localStorage` y JSON;
- CSS, Flexbox o Grid, responsive y estados;
- referencias locales faltantes;
- errores sintácticos detectables.

Cada actividad se clasifica como:

- **Finalizable:** cumple las habilidades esenciales y obtiene al menos 80 % en el diagnóstico de actividad.
- **Funcional:** demuestra el concepto principal, pero aún tiene faltantes de cierre.
- **Parcial:** contiene elementos útiles, pero no completa el flujo.
- **Inicial:** conserva principalmente estructura o lógica aislada.
- **Bloqueada:** presenta rutas faltantes o errores que impiden una revisión confiable.

El porcentaje por actividad es diagnóstico y no constituye por sí solo una nota definitiva.

## Secuencia recomendada con cada estudiante

1. Seleccionar al estudiante.
2. Leer el comentario inicial generado.
3. Revisar integrantes, repositorio, SHA y puntaje técnico.
4. Abrir la actividad prioritaria.
5. Probar un caso válido y uno inválido.
6. Pedir que explique entrada, procesamiento y salida.
7. Solicitar una modificación en vivo.
8. Elegir un único faltante como acuerdo.
9. Definir responsabilidad individual cuando exista pareja.
10. Solicitar un commit descriptivo.
11. Guardar el acuerdo en la página.
12. Comparar el nuevo SHA en la siguiente revisión.

## Proyectos compartidos

Se permiten equipos de máximo dos integrantes durante el periodo.

La evidencia común incluye:

- repositorio;
- funcionamiento;
- estructura;
- interfaz;
- diagnóstico técnico.

La evidencia individual incluye:

- explicación;
- responsabilidad asignada;
- modificación en vivo;
- commits o contribución identificable;
- sustentación.

## Datos privados

Los acuerdos y observaciones de las entrevistas se guardan en `localStorage` del navegador docente bajo la clave:

```text
seminario-goal-p2-interviews-v2
```

Los datos no se publican automáticamente en GitHub. Deben conservarse junto con el respaldo general de la página maestra.
