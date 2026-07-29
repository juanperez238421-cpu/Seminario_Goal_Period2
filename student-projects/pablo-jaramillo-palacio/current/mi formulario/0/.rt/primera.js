function enviar() {
    const texto = document.getElementById('nombre').value;

    localStorage.setItem('TextoGuardado1', texto );

    window.location.href = 'segunda.html';
 }