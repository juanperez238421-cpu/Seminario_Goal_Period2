//Establecer valores para las variables
let seats = 10
let price = 85000
let sold = 0
//Codigo para los boletos
while(seats > 0) {
    let buy = prompt("Quieres comprar un boleto? Si / No")
    if(buy === "Si") {
        sold++
        seats--
        alert("Boleto vendido! Boletos restantes: " + seats)
    } else {
        break
    }
}
let revenue = sold * price
alert( 
    "Ventas cerradas. \n" +
    "Boletos vendidos: " + sold + "\n" +
    "Dinero total generado: $" + revenue
)