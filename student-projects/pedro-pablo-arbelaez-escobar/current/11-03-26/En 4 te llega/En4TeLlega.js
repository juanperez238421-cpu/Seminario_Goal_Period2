// Datos del cliente
let cliente = "Pedro";
let precio = 12000;
let unidades = 2;
let descuento = 10;

// Validaciones
if (precio <= 0 || unidades <= 0 || descuento < 0 || descuento > 50) {
    console.log("Error: datos inválidos");
} else {

    //Calcular subtotal
    let subtotal = precio * unidades;

    //Calcular descuento
    let valorDescuento = subtotal * (descuento / 100);

    //Calcular domicilio
    let domicilio;
    
    if (subtotal > 30000) {
        domicilio = 0;
    } else {
        domicilio = 5000;
    }

    //Calcular total final
    let total = subtotal - valorDescuento + domicilio;

    // Mostrar resultados
    console.log("Cliente:", cliente);
    console.log("Subtotal: $" + subtotal);
    console.log("Descuento (" + descuento + "%): -$" + valorDescuento);
    console.log("Domicilio: $" + domicilio);
    console.log("Total: $" + total);
}