/*=====================================================================================================================
INICIO
=====================================================================================================================*/


//Variables necesarias ===========================================================
const listaPrecios = [
    //Comida
    {nombre:"hamburguesa",precio:28000},
    {nombre:"pizzaP",precio:17000},
    {nombre:"pizzaM",precio:29000},
    {nombre:"pizzaG",precio:51000},
    {nombre:"pollo",precio:24000},

    //Bebidas
    {nombre:"gaseosaP",precio:4000},
    {nombre:"gaseosaM",precio:7500},
    {nombre:"gaseosaG",precio:10000},
]

const btnFinalizar = document.getElementById('btnFinalizar') //Definir el boton finalizar
btnFinalizar.disabled = true; // Deshabilitar el botón finalizar
let carrito = []; // Crear la lista del carrito
let total = 0;




/*=====================================================================================================================
FUNCIONES
=====================================================================================================================*/



//  FINALIZAR =======================================================

function finalizar() {
   //localStorage.setItem('carrito', JSON.stringify(carrito));
   //window.location.href = "indexRecibo.html";
    console.log(carrito);
}


// AÑADIR =======================================================



function añadir(objeto,precio,cantidad) {
    //Buscar el objeto
    const i = carrito.find(c => c.objeto === objeto);

    //Crear o cambiar
    if (i) {
        const index = carrito.findIndex(c => c.objeto === objeto);
        carrito[index] = {objeto:objeto, precio:precio, cantidad:cantidad}
    } else {
        carrito.push({objeto:objeto, precio:precio, cantidad:cantidad})
    }
    btnFinalizar.disabled = false;
}



// COMIDAS ===========================================================



//hamburguesa
function btnHamburguesa() {
    const f = listaPrecios.find(c => c.nombre === "hamburguesa");
    if (document.getElementById('edtHamburguesa').value) {
        añadir("hamburguesa" , f.precio , document.getElementById('edtHamburguesa').value);
    } else {
        alert("Seleccione la cantidad")
    }
    
}

//pizza pequeña
function btnPizzaP() {
    const f = listaPrecios.find(c => c.nombre === "pizzaP");
    if (document.getElementById('edtPizzaP').value) {
        añadir("pizzaP" , f.precio , document.getElementById('edtPizzaP').value);
    } else {
        alert("Seleccione la cantidad")
    }
    
}

//piiza mediana
function btnPizzaM() {
    const f = listaPrecios.find(c => c.nombre === "pizzaM");
    if (document.getElementById('edtPizzaM').value) {
        añadir("pizzaM" , f.precio , document.getElementById('edtPizzaM').value);
    } else {
        alert("Seleccione la cantidad")
    }
    
}

//pizza grande
function btnPizzaG() {
    const f = listaPrecios.find(c => c.nombre === "pizzaG");
    if (document.getElementById('edtPizzaG').value) {
        añadir("pizzaG" , f.precio , document.getElementById('edtPizzaG').value);
    } else {
        alert("Seleccione la cantidad")
    }
    
}

//pollo
function btnPollo() {
    const f = listaPrecios.find(c => c.nombre === "pollo");
    if (document.getElementById('edtPollo').value) {
        añadir("pollo" , f.precio , document.getElementById('edtPollo').value);
    } else {
        alert("Seleccione la cantidad");
    }
    
}



// COMIDAS ===========================================================



//gaseosa pequeña
function btnGaseosaP() {
    const f = listaPrecios.find(c => c.nombre === "gaseosaP");
    if (document.getElementById('edtGaseosaP').value) {
        añadir("gaseosaP" , f.precio , document.getElementById('edtGaseosaP').value);
    } else {
        alert("Seleccione la cantidad");
    }
    
}

//Gaseosa mediana
function btnGaseosaM() {
    const f = listaPrecios.find(c => c.nombre === "gaseosaM");
    if (document.getElementById('edtGaseosaM').value) {
        añadir("gaseosaM" , f.precio , document.getElementById('edtGaseosaM').value);
    } else {
        alert("Seleccione la cantidad");
    }
    
}

//gaseosa grande
function btnGaseosaG() {
    const f = listaPrecios.find(c => c.nombre === "gaseosaG");
    if (document.getElementById('edtGaseosaG').value) {
        añadir("gaseosaG" , f.precio , document.getElementById('edtGaseosaG').value);
    } else {
        alert("Seleccione la cantidad");
    }
    
}




