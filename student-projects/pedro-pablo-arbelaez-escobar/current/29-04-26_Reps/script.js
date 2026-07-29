//Cuantas repeticiones deseas a hacer?
let name = prompt("ingresa tu nick:")
let reps = parseInt(prompt("cuantas reps quieres hacer?"))
//Contar las repeticiones
for (let i = 1; i <= reps; i++){
alert("Rep " + i + " Dale, todavia te queda energia, haz más!")
}
//Felicitar al usuario
alert("Bien hecho " + name + "! Lograste " + reps + " repeticiones!")