let userIngresado = prompt ("Ingrese su user")
let passwordIngersado = prompt ("Ingrese su password")
let password2Ingresdo = prompt("Confirme su contraseña")

if(passwordIngersado!==password2Ingresdo) {
    alert("Contraseña incorrectas")
} else if(passwordIngersado.length<6 || passwordIngersado.length>10){
    alert("La contraseña debe tener entre 6 y 10 caracteres")
} else {
    alert("Usuario creado correctamente")
}


