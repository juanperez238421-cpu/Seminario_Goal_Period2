//Crear Variable
function imprimir(){
//Traer Lo copiado 
const escritoA = document.getElementById('escrito').value;
//guardar lo copiado en la nube
localStorage.setItem('escritoB', escritoA);
//redirigir la informacion a la otra pagina
window.location.href = 'print.html';
}