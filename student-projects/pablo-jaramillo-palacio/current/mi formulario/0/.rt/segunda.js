const LugarParaImprimir = document.getElementById('LugarParaImprimir');

const texto = localStorage.getItem('TextoGuardado1');

LugarParaImprimir.innerHTML = `Su nombre es ${texto}`