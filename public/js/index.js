
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
