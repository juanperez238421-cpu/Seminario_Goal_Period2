//La data del cliente
 let savedUser = "Pedropae07"
 let savedPassword = "C0d3-18-2026"
     //La money del cliente
     let savingsBalance = "748000"
     let checkingBalance = "950000"
//Variables
 let selectedBalance = 0
 let accountName = "Bolsillo #01"
 let transactionFee = 0
 let newBalance = 0
//Auth
 let imputUser = prompt ("Ingrese su usuario")
 let imputPassword = prompt ("Ahora ingrese su contraseña")
if (imputUser !== savedUser || imputPassword) {
alert("Error, el usuario o la contraseña no son correctos.")
} else {
         //Welcome
         alert("Bienvenid@, " + imputUser)
             //Seleccion de cuenta a ingresar
             let accountType = parseFloat(prompt("Tipo de cuenta:\n1 = Ahorros\n2 = Corriente")) 
             if (accountType !== 1 && accountType !== 2) {
             alert ("Error: tipo de cuenta no valido.")
             } else {
                 //Mostrar saldo
                  if (accountType === 1){
                    selectedBalance = savingsBalance
                    accountName = "Ahorros"
                  } else {
                 selectedBalance = checkingBalance
                 accountName = "Corriente"
                  }
                      alert("Su saldo en " + accountName + "es: $" + selectedBalance)
                       
                      
                      
                 //Cashout
                 let 

             }
             }