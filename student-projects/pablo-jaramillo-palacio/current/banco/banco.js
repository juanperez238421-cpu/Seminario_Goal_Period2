// DATOS GUARDADOS
var savedUser = "pablito_bancolombia";
var savedPassword = "BancolombiaPJP";
var savingsBalance = 850000;
var checkingBalance = 1200000;

// LOGIN
var user = prompt("Usuario:");
var pass = prompt("Contraseña:");

if (user !== savedUser || pass !== savedPassword) {
  alert("Usuario o contraseña incorrectos");
} else {

  alert("Bienvenido/a " + user);

  // TIPO DE CUENTA
  var type = parseInt(prompt("1 = Ahorros\n2 = Corriente"));

  var balance;

  if (type === 1) {
    balance = savingsBalance;
    alert("Saldo Ahorros: $" + balance);
  } else if (type === 2) {
    balance = checkingBalance;
    alert("Saldo Corriente: $" + balance);
  } else {
    alert("Tipo de cuenta inválido");
  }

  // RETIRO
  var retiro = parseFloat(prompt("¿Cuánto desea retirar?"));

  if (retiro <= 0 || retiro > balance) {
    alert("Monto inválido");
  } else {

    var costo = 0;

    if (retiro > 200000) {
      costo = 2500;
    }

    var nuevoSaldo = balance - retiro - costo;

    alert(
      "---- RESUMEN ----\n" +
      "Saldo: $" + balance + "\n" +
      "Retiro: -$" + retiro + "\n" +
      "Costo: -$" + costo + "\n" +
      "Nuevo saldo: $" + nuevoSaldo
    );

  }
}