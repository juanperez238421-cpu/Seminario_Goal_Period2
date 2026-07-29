function updateMasterRoutePanel() {
  const panel = document.querySelector(".route-panel");
  if (!panel) return;
  panel.innerHTML = `
    <div class="panel-heading">
      <div>
        <p class="section-kicker">Ruta unificada</p>
        <h3>Tres proyectos para todos</h3>
        <p>El contexto puede variar, pero los conceptos y criterios son comunes.</p>
      </div>
      <a class="button primary" href="individual-analysis.html">Abrir ruta común</a>
    </div>
    <div class="route-list" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="route-card core-route">
        <span class="route-number">Proyecto 1</span>
        <h4>Registro interactivo</h4>
        <p>Formulario, validación, objeto de datos y resumen visible.</p>
      </div>
      <div class="route-card core-route">
        <span class="route-number">Proyecto 2</span>
        <h4>Gestión de operaciones</h4>
        <p>Funciones, decisiones, eventos, objetos y resultados dinámicos.</p>
      </div>
      <div class="route-card css-route">
        <span class="route-number">Proyecto 3</span>
        <h4>Aplicación integrada</h4>
        <p>Persistencia, reporte final, README y presentación CSS.</p>
      </div>
    </div>
  `;
}

function updateTrackLabels() {
  const trackFilter = document.querySelector("#trackFilter");
  if (trackFilter) {
    const core = trackFilter.querySelector('option[value="core"]');
    const css = trackFilter.querySelector('option[value="css"]');
    if (core) core.textContent = "Ruta común";
    if (css) css.textContent = "Profundización CSS";
  }

  const trackInput = document.querySelector("#studentTrackInput");
  if (trackInput) {
    const core = trackInput.querySelector('option[value="core"]');
    const css = trackInput.querySelector('option[value="css"]');
    if (core) core.textContent = "Ruta común";
    if (css) css.textContent = "Profundización CSS";
  }
}

function initialize() {
  updateMasterRoutePanel();
  updateTrackLabels();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
