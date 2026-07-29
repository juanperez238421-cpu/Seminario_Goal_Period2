//crear variable
const ticketPrice = 85000;
var tickets = 10;
var soldTickets = 0
let YorN = ""
//crear funcion


while( tickets > 0 ){
    let YorN = prompt("Do you want to buy a ticket? (yes/no)").toLowerCase();
    if( YorN === "yes" ){
        //let quantity = Number(prompt(`there are ${tickets} how many you want?`))
        //if (quantity <= tickets) {
                    tickets -= 1;      // Restamos al inventario
                    soldTickets += 1;   // Sumamos a lo vendido
                    //alert(`¡Compra exitosa! Has comprado ${quantity} tickets.`);
                //} else {
                //    alert("No hay suficientes tickets disponibles.");
                //}

    }else if (YorN === "no") {
                // Calculamos el total justo antes de mostrarlo
                let currentRevenue = soldTickets * ticketPrice;
                alert(`Has comprado ${soldTickets} tickets. Total a pagar: $${currentRevenue}`);
                break; // Salimos del bucle si dicen que no
    }
}


         