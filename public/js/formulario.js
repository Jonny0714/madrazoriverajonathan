//Maldonado Alcala Leonardo 6IV8 
/******************************************************************************************************************************************************/
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
        if(consultaJson.sesionActiva===false|| consultaJson.sesionActiva === undefined){
            window.location.href = "/";
        }}
    auth();
    document.getElementById("read").addEventListener("submit", async (event) => {
        console.log("Evento submit capturado");
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
                <th>Usuario</th>
                <th>Nombre Completo</th>
                <th>Edad</th>
                <th>Altura</th>
                <th>Peso</th>
                <th>Nacionalidad</th>
                <th>Posición</th>
            </tr>`;

            if (responseJson.message === "ok") {
                console.log("Respuesta del servidor:", responseJson);
                responseJson.usuarios.forEach(usuario => {
                    cadena += `
                    <tr>
                        <td>${usuario.id}</td>
                        <td>${usuario.usuario}</td>
                        <td>${usuario.nombre} ${usuario.apellidopaterno} ${usuario.apellidomaterno}</td>
                        <td>${usuario.edad}</td>
                        <td>${usuario.altura}</td>
                        <td>${usuario.peso}</td>
                        <td>${usuario.nacionalidad}</td>
                        <td>${usuario.posicionNombre}</td>
                    </tr>`;
                });
                

                document.getElementById("usuarios").innerHTML = cadena;
            } else {
                alert("Error al obtener los usuarios");
                document.getElementById("usuarios").innerHTML = "<tr><td colspan='4'>Hubo un error al obtener los usuarios</td></tr>";
            }
        } catch (error) {
            console.error(error);
            alert(error);
        }
    });

    document.getElementById("readOne").addEventListener("submit", async(event) => {
        event.preventDefault();
        try {
            const id = event.target.id.value;
            const response = await fetch("/obtenerUnUsuario", {
                method: "PUT",
                body: JSON.stringify({
                    id: id,
                    solicitud: event.target.solicitud.value
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const responseJson = await response.json();
            
            if(responseJson.message === "ok") {
                document.getElementById("usuario").innerHTML = 
                    `El dato solicitado del aspirante con ID: ${id}, esta registrado como: "${responseJson.usuario}"`;
            } else {
                throw new Error(responseJson.message);
            }
        } catch (error) {
            alert("Error al mostrar el usuario: " + error.message);
            document.getElementById("usuario").innerHTML = error.message;
        }
    });

    document.getElementById("update").addEventListener("submit", async(event) => {
        event.preventDefault();
        try {
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
            });
            let responseJson = await response.json();
            if(responseJson.message === "ok") {
                document.getElementById("UsuarioCambiado").innerHTML = "RESULTADOS: "+responseJson.respuesta;
            } else {
                throw new Error(responseJson.message);
            }
        } catch (error) {
            alert("Error al editar el usuario: " + error.message);
            document.getElementById("UsuarioCambiado").innerHTML = "Hubo un error al editar el registro. "+ error.message;
        }
    });

    document.getElementById("deleteOne").addEventListener("submit", async(event) => {
        event.preventDefault();
        if(!confirm('¿Estas seguro que deseas borrar el registro?')) return;
        try {
            let response = await fetch("/BorrarUnUsuario", {
                method: "DELETE",
                body: JSON.stringify({
                    id: event.target.id.value
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            let responseJson = await response.json();
            if(responseJson.message === "ok") {
                if(responseJson.respuesta == 0) {
                    document.getElementById("UsuarioBorrado").innerHTML = "RESULTADOS: No se encontró el registro con dicho id.";
                } else {
                    document.getElementById("UsuarioBorrado").innerHTML = "RESULTADOS: Se borraron la siguiente cantidad de registros: "+responseJson.respuesta;
                }
            } else {
                throw new Error(responseJson.message);
            }
        } catch (error) {
            alert("Error al borrar el usuario: " + error.message);
            document.getElementById("UsuarioBorrado").innerHTML = "Hubo un error al borrar el usuario";
        }
    });

    document.getElementById("delete").addEventListener("submit", async(event) => {
        event.preventDefault();
        if(!confirm('¿Estas seguro que deseas borrar todos los registros?')) return;
        
        try {
            const response = await fetch("/BorrarUsuarios", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const responseJson = await response.json();
            
            if(responseJson.message === "ok") {
                document.getElementById("UsuariosBorrados").innerHTML = 
                    `RESULTADOS: Se borraron la siguiente cantidad de registros: ${responseJson.respuesta}`;
            } else {
                throw new Error(responseJson.message);
            }
        } catch (error) {
            alert("Error al borrar los usuarios: " + error.message);
            document.getElementById("UsuariosBorrados").innerHTML = "Hubo un error al borrar los usuarios";
        }
    });

/******************************************************************************************************************************************************/