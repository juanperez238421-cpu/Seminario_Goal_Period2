//Datos de variables
let pinCorrecto = 2580
let intentos = 1
//codigo para medir los intentos
while (intentos <= 3) {
    let pin = parseInt(prompt("Intento " + intentos + ": Ingresa tu PIN"));
    if (pin === pinCorrecto) {
        alert("Attempt " + intentos + ": Acceso concedido. Bienvenido!");
        break;
   
    } else {
        
        alert("Attempt " + intentos + ": PIN incorrecto.");
        if (intentos === 3) {
            alert("Tu tarjeta ha sido bloqeada. Para desbloquearla contacta a tu banco.");
        }
    }

    intentos++;
}