const auth= async() => {
    const sesion = sessionStorage.getItem("usuario");
    
        const consulta = await fetch("/verificar-sesion", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usuario: sesion
            })
        });
        
        const consultaJson = await consulta.json();
        console.log(consultaJson);
        if(consultaJson.sesionActiva===true|| consultaJson.sesionActiva === undefined){
            window.location.href = "/";
        }}
    auth();
document.getElementById("create").addEventListener("submit", async(event)=>{
    event.preventDefault();
    let response = await fetch("/agregarUsuario", {
        method: "POST",
        body: JSON.stringify({
            nombre: event.target.nombre.value,
            usuario: event.target.usuario.value,
            apellidop: event.target.apellidop.value,
            apellidom: event.target.apellidom.value,
            edad: event.target.edad.value,
            posicion: event.target.posicion.value,
            nacionalidad: event.target.nacionalidad.value,
            password: event.target.password.value,
            password2: event.target.password.value
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
    sessionStorage.setItem("usuario", responseJson.token);
    window.location.href = "/";
}else{
    alert("Error al crear el usuario");
    nuevoUsuario.innerHTML = "Usuario no creado : "+responseJson.message;
}
})
