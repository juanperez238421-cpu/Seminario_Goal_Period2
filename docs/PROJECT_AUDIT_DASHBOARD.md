# Dashboard de auditoría y revisión integral

La página `project-review.html` permite revisar el estado real de cada proyecto web estudiantil a partir de la copia exacta del último SHA monitoreado.

## Corrección de la vista previa

La versión anterior podía mostrar el código HTML como texto porque el proveedor de archivos estáticos entregaba el documento con un tipo de contenido no renderizable. La vista actual usa una URL de renderizado para la copia central y presenta el resultado HTML, CSS y JavaScript dentro de un `iframe` aislado.

El botón **Abrir proyecto real** carga la página de entrada recomendada. El selector permite abrir cualquiera de las páginas HTML copiadas. El enlace **Abrir proyecto en pantalla completa** sirve para probar navegación, `localStorage`, formularios o permisos que requieran una pestaña independiente.

## Auditoría técnica automática

Cada ejecución del workflow analiza el repositorio con una rúbrica común:

| Criterio | Peso |
|---|---:|
| HTML y estructura | 15 % |
| JavaScript y lógica | 20 % |
| DOM, funciones y eventos | 15 % |
| CSS y presentación | 15 % |
| Navegación y persistencia | 10 % |
| Validación y manejo de errores | 10 % |
| Integración funcional | 10 % |
| Git y documentación | 5 % |

La auditoría registra evidencia observable, faltantes, riesgos, indicadores y acciones prioritarias. También detecta páginas vacías, dependencias de `prompt()`, errores sintácticos, ausencia de CSS, falta de README y rutas locales rotas.

## Referencia del curso

El sistema selecciona como referencia el proyecto con mayor puntaje técnico automatizado entre las copias disponibles. Los demás proyectos se comparan con la misma rúbrica y muestran:

- porcentaje absoluto de avance técnico;
- porcentaje relativo frente al referente;
- distancia en puntos porcentuales;
- brecha por competencia;
- fortalezas, faltantes y riesgos;
- ruta priorizada para la siguiente sesión.

La referencia se recalcula después de cada monitoreo. No es una calificación definitiva ni una clasificación permanente.

## Visualizaciones

La página incluye:

- medidor semicircular Canvas con el avance técnico;
- gráfico Canvas por competencia con marcador del referente;
- barras de progreso en cada tarjeta de estudiante;
- indicadores de archivos, funciones, DOM, eventos, validaciones, persistencia y CSS;
- panel de recomendaciones automatizadas;
- botón para copiar el informe técnico;
- transferencia del puntaje técnico y evidencias a la ficha maestra local.

## Operación docente

1. Ejecutar **Actions → Monitor mirror and score student repositories → Run workflow**.
2. Esperar a que termine en verde.
3. Abrir `project-review.html` y pulsar **Actualizar datos**.
4. Seleccionar al estudiante.
5. Revisar el porcentaje, las métricas y los faltantes.
6. Pulsar **Abrir proyecto real**.
7. Probar el flujo frente al estudiante.
8. Registrar ejecución, explicación, modificación en vivo y bloqueadores.
9. Guardar la revisión.
10. Enviar la evidencia a la ficha maestra.

## Interpretación del puntaje

El puntaje técnico es diagnóstico y provisional. Un repositorio puede tener archivos bien conectados y aun así presentar un flujo incompleto. La nota final requiere verificar:

- que la aplicación ejecuta;
- que el estudiante comprende y explica su código;
- que realiza una modificación en vivo;
- que la autoría es verificable;
- que el flujo funcional cumple la meta acordada.

No se modifica el código de los estudiantes para aumentar artificialmente el puntaje. Los errores, páginas vacías y flujos incompletos se conservan como evidencia del estado real del proyecto.
