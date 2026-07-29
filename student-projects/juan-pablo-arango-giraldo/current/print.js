//se crea variable
const imprimirA = document.getElementById('imprimirA');


const numproducts = localStorage.getItem('numproducts');
const total = localStorage.getItem('total');

imprimirA.innerHTML=`Has comprado ${numproducts} productos. Total a pagar: $${total}`