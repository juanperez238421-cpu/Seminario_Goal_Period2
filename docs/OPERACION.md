# Guía de operación docente

## 1. Inicio de la clase

1. Abre la página maestra.
2. Revisa la fecha del último monitoreo.
3. Pulsa **Consultar GitHub ahora** para una verificación inmediata.
4. Abre **Asistencia**, selecciona el grupo y registra el estado de cada estudiante.

## 2. Entrevista individual

1. Abre la sección **Estudiantes**.
2. Selecciona la tarjeta del estudiante.
3. Confirma proyecto, usuario y repositorio.
4. Ejecuta el proyecto con el estudiante.
5. Pide que explique el flujo de datos y una función.
6. Solicita una modificación breve en vivo.
7. Marca únicamente las competencias demostradas.
8. Diligencia la rúbrica.
9. Registra la siguiente meta y la fecha objetivo.
10. Marca el SHA como revisado.
11. Guarda la ficha.

## 3. Cierre de la clase

1. Exporta la asistencia en CSV.
2. Abre **Respaldo**.
3. Descarga el respaldo JSON completo.
4. Guarda ambos archivos en una carpeta organizada por fecha.

## 4. Repositorios pendientes

La edición realizada en la página es local. Cuando confirmes un nuevo repositorio:

1. Abre **Editar vínculos**.
2. Registra usuario, repositorio y proyecto.
3. Guarda.
4. Abre **Respaldo** y pulsa **Exportar lista**.
5. Reemplaza `data/students.json` en GitHub con el archivo exportado.

Después de actualizar `data/students.json`, el monitor automático incluirá el nuevo repositorio en la siguiente ejecución.

## 5. Regla de calificación

La nota calculada permanece provisional hasta verificar:

- la aplicación ejecuta;
- el estudiante explica su código;
- realiza una modificación en vivo;
- la autoría es identificable.

La cantidad de commits no constituye por sí sola evidencia de competencia.
