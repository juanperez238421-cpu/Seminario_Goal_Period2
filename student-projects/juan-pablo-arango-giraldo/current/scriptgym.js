//preguntar numero de repeticiones hechas
var rep = parseInt(prompt("How many reps you get?"))
var counter = 1;
//sumar reps
while( counter <= rep ){
alert(`Continue you´re almost there, you are on rep number ${counter}`);
counter++;
}
alert("Ya alcanzó la meta.");