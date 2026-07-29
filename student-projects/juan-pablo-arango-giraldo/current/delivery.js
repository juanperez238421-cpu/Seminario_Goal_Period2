//crear variable
var soldpizza = 0
var pizzaprice = 40000
var soldhamburger = 0
var pricehamburger = 34000
var soldgaseosa = 0
var pricegaseosa = 7000
var soldpapas = 0
var pricepapas = 16000
var cantidadmaxproducts = 20
//crear funcion
 

while( cantidadmaxproducts > 0 ){
    let YorN = prompt("Do you want to buy a food? (yes/no)").toLowerCase();
    if( YorN === "yes" ){
     var menu = (prompt("What do you want Hamburger, Pizza, Gaseosa or Papas ")).toLowerCase();
     if( menu === "hamburger" ){
                    soldhamburger += 1;   // Sumamos a lo vendido
                    cantidadmaxproducts -= 1
     } if( menu === "pizza" ){
        soldpizza += 1
        cantidadmaxproducts -= 1
     }if( menu === "gaseosa" ){
        soldgaseosa += 1
        cantidadmaxproducts -= 1
     }if( menu === "papas" ){
        soldpapas += 1
        cantidadmaxproducts -= 1
     }

    }else if (YorN === "no") {
                // Calculamos el total justo antes de mostrarlo
                let pizzatotal = parseInt(soldpizza * pizzaprice);
                let hamburgertotal = parseInt(soldhamburger * pricehamburger);
                let gaseosatotal = parseInt(soldgaseosa * pricegaseosa);
                let papastotal = parseInt(soldpapas * pricepapas);
                let total = pizzatotal + hamburgertotal + gaseosatotal + papastotal
                let numproducts = soldpizza + soldgaseosa + soldhamburger + soldpapas
                localStorage.setItem('numproducts', numproducts);
                localStorage.setItem('total', total);
                
                
                window.location.href = 'print.html';
                break; // Salimos del bucle si dicen que no

    }
}

