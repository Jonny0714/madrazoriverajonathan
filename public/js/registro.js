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
    
    document.getElementById("loginForm").addEventListener("submit", async(event)=>{
        event.preventDefault();
        let response = await fetch("/login", {
            method: "PUT",
            body: JSON.stringify({
                usuario: event.target.usuario.value,
                password: event.target.password.value
            }),
            headers: {
                "Content-Type": "application/json"
            }
    })
    let nuevoUsuario= document.getElementById("nuevoUsuario");
    let responseJson = await response.json();
    if(responseJson.message == "ok"){
        alert("Inicio de sesión exitoso");
        document.getElementById("nuevoUsuario").innerHTML = `Aspirante con id ${responseJson.respuesta} inicio sesión correctamente`;
        sessionStorage.setItem("usuario", responseJson.token);
        window.location.href = "/";
    }else{
        alert("Error al iniciar Sesión");
        nuevoUsuario.innerHTML = "La servidor tuvo problemas para el inicio de sesión: "+responseJson.message;
    }
    })