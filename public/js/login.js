const sesion = sessionStorage.getItem("usuario");
async function actualizarBotones() {
    try {
        const response = await fetch('/verificar-sesion',
            {
                method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usuario: sesion
            })
            }
        );
        const data = await response.json();
        const contenedorBotones = document.getElementById('sesiones');
        
        if (data.sesionActiva) {
            contenedorBotones.innerHTML = `
                <br><br>
                <button onclick="cerrarSesion()" class="btn btn-danger w-100 py-3 fw-bold">
                    <i class="bi bi-box-arrow-right"></i> CERRAR SESIÓN
                </button>`;
        } else {
            contenedorBotones.innerHTML = `
                <a href="/registro" target="cuerpo" class="text-decoration-none">
                    <button class="btn btn-success w-100 py-3 fw-bold">
                        <i class="bi bi-person-plus"></i> REGISTRARSE
                    </button>
                </a>
                <br><br>                   
                <a href="/isesion" target="cuerpo" class="text-decoration-none">
                    <button class="btn btn-info w-100 py-3 fw-bold text-white">
                        <i class="bi bi-box-arrow-in-right"></i> INICIAR SESIÓN
                    </button>
                </a>`;
        }
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
    }
}

async function cerrarSesion() {
    try {
        const sesion = sessionStorage.getItem("usuario");
        if(!sesion){
            alert("No hay sesión activa");
            return;
        }
        sessionStorage.removeItem("usuario");
        window.location.href = "/";
    }
    catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

document.addEventListener('DOMContentLoaded', actualizarBotones);