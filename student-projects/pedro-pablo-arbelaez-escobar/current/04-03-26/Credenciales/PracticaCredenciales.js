// Crear usuario
let usuario = prompt("Crea tu nombre de usuario:");

// Crear contraseña
let contraseña = prompt("Crea una contraseña (entre 6 y 10 caracteres):");

// Verificar longitud
if (contraseña.length >= 6 && contraseña.length <= 10) {

    let confirmar = prompt("Confirma tu contraseña:");

    // Verificar que coincidan
    if (contraseña === confirmar) {
        alert("Usuario creado correctamente");

    }}