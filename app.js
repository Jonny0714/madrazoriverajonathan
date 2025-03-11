
const express = require("express")

const mysql= require("mysql2")
var bodyParser=require('body-parser')
var app=express()

var con=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"n0m3l0",
    database:"registro_futbol",
    port:3306
})
con.connect();

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(express.static('public'))

function contieneEtiquetaHTML(texto) {
    return /<[^>]+>/.test(texto); }
function validarTexto(texto) {
    return /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]{1,30}$/.test(texto);
}

app.post('/agregarUsuario',(req,res)=>{
    try{
        let { nombre, apellidop, apellidom, goles, posicion, peso, playera, nacionalidad } = req.body;
        if (![nombre, apellidop, apellidom, goles, posicion, peso, playera, nacionalidad].every(Boolean)) {
            return res.status(400).send({ message: "Faltan parámetros o hay datos manipulados en el registro" });
        }
        goles = parseInt(goles);
        posicion = parseInt(posicion);
        peso = parseInt(peso);
        playera = parseInt(playera);

        if(contieneEtiquetaHTML(nombre)||contieneEtiquetaHTML(apellidom)||contieneEtiquetaHTML(apellidop)||contieneEtiquetaHTML(nacionalidad)
            ||isNaN(goles)|| isNaN(posicion)||isNaN(peso)||isNaN(playera)){
            return res.status(400).send({message:"Datos Incorrectos"});}
        
        if(!validarTexto(nombre)||!validarTexto(apellidom)||!validarTexto(apellidop)||!validarTexto(nacionalidad)){
            return res.status(400).send({message:"Solo puedes ingresar texto de entre 1 y 30 caracteres"});}

        con.query('INSERT INTO usuario (nombre,apellidopaterno,apellidomaterno,goles,posición,playera,peso,nacionalidad) VALUES (?,?,?,?,?,?,?,?)', 
            [nombre,apellidop,apellidom,goles,posicion,playera,peso,nacionalidad], (err, respuesta, fields) => {
            if (err) {
                console.log("Error al conectar", err);
                return res.status(500).send({message:"Error al conectar"});
            }
            return res.status(202).send({message:'ok',nombre:` ${nombre}`,apellidopaterno: `${apellidop}`,nacionalidad: `${nacionalidad}`});
        }); 
    }catch(error){
        console.log(error)
        return res.status(500).send({message:"Error en los campos"});
    }
})

app.get('/obtenerUsuario',(req,res)=>{
    con.query('SELECT * from usuario', (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al conectar"});
        }
        console.log(respuesta)
        return res.status(202).send({message: 'ok',usuarios : respuesta});
    });

})

app.put('/obtenerUnUsuario', (req, res) => {
    let id = req.body.id;
    let solicitud = req.body.solicitud;

    if (!id || !solicitud) {
        return res.status(400).send({ message: "Faltan parámetros" });
    }
    if (isNaN(id)||!validarTexto(solicitud)||contieneEtiquetaHTML(solicitud)) {
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    const columnasPermitidas = ["nombre", "apellidoPaterno", "apellidoMaterno", "goles", "posición", "playera", "peso", "nacionalidad"];
    if (!columnasPermitidas.includes(solicitud)) {
        return res.status(400).send({ message: "Parámetro no permitido" });
    }

    let query = `SELECT ${solicitud} FROM usuario WHERE id = ?`;

    con.query(query, [id], (err, respuesta) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({ message: "Error al conectar" });
        }

        if (respuesta.length === 0) {
            return res.status(404).send({ message: "Usuario no encontrado" });
        }
        if (solicitud === "posición") {
            let idPosicion = respuesta[0].posición; 

            con.query(`SELECT descripcion FROM posición WHERE id = ?`, [idPosicion], (err, respuestaPosicion) => {
                if (err) {
                    console.log("Error al conectar", err);
                    return res.status(500).send({ message: "Error al conectar" });
                }

                if (respuestaPosicion.length === 0) {
                    return res.status(404).send({ message: "Posición no encontrada" });
                }

                return res.status(200).send({ message: 'ok', usuario: respuestaPosicion[0].descripcion });
            });

        } else {
            return res.status(200).send({ message: 'ok', usuario: respuesta[0][solicitud] });
        }
    });
});

app.put('/editarUsuario', (req, res) => {
    let { id, solicitud, cambio } = req.body;

    if (!id || !solicitud || !cambio) {
        return res.status(400).send({ message: "Faltan parámetros" });
    }
    if (isNaN(id)||!validarTexto(solicitud)||contieneEtiquetaHTML(solicitud)||contieneEtiquetaHTML(cambio)) {
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    const columnasPermitidas = ["nombre", "apellidoPaterno", "apellidoMaterno", "goles", "posición", "playera", "peso", "nacionalidad"];
    if (!columnasPermitidas.includes(solicitud)) {
        return res.status(400).send({ message: "Parámetro no permitido" });
    }

    if (["goles", "peso", "playera"].includes(solicitud)) {
        cambio = parseInt(cambio);
        if (isNaN(cambio)) {
            return res.status(400).send({ message: "El valor debe ser un número" });
        }
    }else if (!validarTexto(cambio) || contieneEtiquetaHTML(cambio)) {
        return res.status(400).send({ message: "El valor debe ser texto sin etiquetas HTML" });
    }
    const ejecutarUpdate = (nuevoValor) => {
        let query = `UPDATE usuario SET ${solicitud} = ? WHERE id = ?`;
        con.query(query, [nuevoValor, id], (error, response) => {
            if (error) {
                console.log("Error al conectar", error);
                return res.status(500).send({ message: "Error al actualizar el usuario" });
            }

            if (response.affectedRows === 0) {
                return res.status(404).send({ message: "No se encontró el usuario" });
            }

            return res.status(202).send({ message: 'ok', respuesta: `Usuario actualizado correctamente` });
        });
    };
    if (solicitud === "posición") {
        let posicion = cambio.toLowerCase();
        con.query(`SELECT id FROM posición WHERE descripcion = ?`, [posicion], (err, respuestaPosicion) => {
            if (err) {
                console.log("Error al conectar", err);
                return res.status(500).send({ message: "Error al conectar" });
            }
            if (respuestaPosicion.length === 0) {
                return res.status(404).send({ message: "Posición no encontrada" });
            }

            let idPosicion = respuestaPosicion[0].id;
            ejecutarUpdate(idPosicion);
        });

    } else {
        ejecutarUpdate(cambio); 
    }
});

app.delete('/BorrarUnUsuario',(req,res)=>{
    let id=req.body.id
    if (!id||isNaN(id)) {
        return res.status(400).send({ message: "Faltan parámetros o el id no es un número" });
    }
    con.query('DELETE usuario FROM usuario WHERE id =(?)',[id], (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al conectar"});
        }
        console.log(respuesta)
        return res.status(202).send({message: 'ok',respuesta : respuesta.affectedRows});
    });

})

app.delete('/BorrarUsuario',(req,res)=>{
    con.query('DELETE usuario FROM usuario;', (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al conectar"});
        }
        console.log(respuesta)
        return res.status(202).send({message: 'ok',respuesta : respuesta.affectedRows});
    });

})

app.listen(3000,()=>{
    console.log('Servidor escuchando en el puerto 3000')
})