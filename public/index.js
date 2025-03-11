 
document.getElementById("create").addEventListener("submit", async(event)=>{
    event.preventDefault();
    let response = await fetch("/agregarUsuario", {
        method: "POST",
        body: JSON.stringify({
            nombre: event.target.nombre.value,
            apellidop: event.target.apellidop.value,
            apellidom: event.target.apellidom.value,
            goles: event.target.goles.value,
            posicion: event.target.posicion.value,
            playera: event.target.playera.value,
            peso: event.target.peso.value,
            nacionalidad: event.target.nacionalidad.value
        }),
        headers: {
            "Content-Type": "application/json"
        }
})
let nuevoUsuario= document.getElementById("nuevoUsuario");
let responseJson = await response.json();
if(responseJson.message == "ok"){
    document.getElementById("nuevoUsuario").innerHTML = `Aspirante '${responseJson.nombre} ${responseJson.apellidopaterno}'
    con nacionalidad '${responseJson.nacionalidad}' fue registrado(a) correctamente`;
}else{
    alert("Error al crear el usuario");
    nuevoUsuario.innerHTML = "Usuario no creado : "+responseJson.message;
}
});
document.getElementById("read").addEventListener("submit", async (event) => {
event.preventDefault();

try {
    let response = await fetch("/obtenerUsuario", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    let responseJson = await response.json();

    let cadena = `
    <tr>
        <th>ID</th>
        <th>Nombre Completo</th>
        <th>Goles</th>
        <th>Nacionalidad</th>
    </tr>`;

    if (responseJson.message === "ok") {
        responseJson.usuarios.forEach(usuario => {
            console.log(usuario);
            cadena += `
            <tr>
                <td>${usuario.id}</td>
                <td>${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}</td>
                <td>${usuario.goles}</td>
                <td>${usuario.nacionalidad}</td>
            </tr>`;
        });

        document.getElementById("usuarios").innerHTML = cadena;
    } else {
        alert("Error al obtener los usuarios");
        document.getElementById("usuarios").innerHTML = "<tr><td colspan='4'>Hubo un error al obtener los usuarios</td></tr>";
    }
} catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al conectar con el servidor");
}
});
document.getElementById("readOne").addEventListener("submit", async(event)=>{
    event.preventDefault();
    let id = event.target.id.value;
    let response = await fetch("/obtenerUnUsuario", {
        method: "PUT",
        body: JSON.stringify({
            id: id,
            solicitud: event.target.solicitud.value
        }),
        headers: {
            "Content-Type": "application/json"
        }
})
let responseJson = await response.json();
if(responseJson.message == "ok")
        document.getElementById("usuario").innerHTML = 'El dato solicitado del aspirante con ID: '+id+', esta registrado como: "'+responseJson.usuario+'"';
else{
    alert("Error al mostrar el usuario");
    nuevoUsuario.innerHTML = responseJson.message;
}
})
document.getElementById("update").addEventListener("submit", async(event)=>{
    event.preventDefault();
let response = await fetch("/editarUsuario", {
        method: "PUT",
        body: JSON.stringify({
            solicitud: event.target.solicitud.value,
            id: event.target.id.value,
            cambio : event.target.cambio.value
        }),
        headers: {
            "Content-Type": "application/json"
        }
})
let responseJson = await response.json();
if(responseJson.message == "ok"){
    document.getElementById("UsuarioCambiado").innerHTML = "RESULTADOS: "+responseJson.respuesta;
}else{
    alert("Error al editar el usuario");
    document.getElementById("UsuarioCambiado").innerHTML = "Hubo un error al editar el registro. "+ responseJson.message;
}
});
document.getElementById("deleteOne").addEventListener("submit", async(event)=>{
    event.preventDefault();
let decision = confirm('¿Estas seguro que deseas borrar el registro?')
if(decision == true){
    let response = await fetch("/BorrarUnUsuario", {
        method: "DELETE",
        body: JSON.stringify({
            id: event.target.id.value
        }),
        headers: {
            "Content-Type": "application/json"
        }
})
let responseJson = await response.json();
if(responseJson.message == "ok"){
    if(responseJson.respuesta == 0){
        document.getElementById("UsuarioBorrado").innerHTML = "RESULTADOS: No se encontró el registro con dicho id.";
    }
    else{
    document.getElementById("UsuarioBorrado").innerHTML = "RESULTADOS: Se borraron la siguiente cantidad de registros: "+responseJson.respuesta;}
    }else{
    alert("Error al borrar el usuario");
    nuevoUsuario.innerHTML = "Hubo un error al borrar el usuario";
}}
});
document.getElementById("delete").addEventListener("submit", async(event)=>{
    event.preventDefault();
let decision = confirm('¿Estas seguro que deseas borrar todos los registros?')
if(decision == true){
    let response = await fetch("/BorrarUsuario", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
})
let responseJson = await response.json();
if(responseJson.message == "ok"){
    document.getElementById("UsuariosBorrados").innerHTML = "RESULTADOS: Se borraron la siguiente cantidad de registros: "+responseJson.respuesta;
}else{
    alert("Error borrar los usuarios");
    nuevoUsuario.innerHTML = "Hubo un error al borrar los usuarios";
}}
});