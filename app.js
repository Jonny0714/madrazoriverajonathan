const express = require("express")
const sesion = require("express-session")
const dotenv = require("dotenv")
const mysql = require("mysql2")
const bodyParser = require('body-parser')
const path = require("path")
const jsonwebtoken = require("jsonwebtoken")
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')

var app = express()
dotenv.config()

app.use(sesion({
    secret: process.env.SESSION_SECRET || 'mySecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}))

var con = mysql.createConnection({
    host: process.env.HOST_DB,
    user: process.env.USER_SECRET_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE_DB,
    port: process.env.PORT_DB
})

con.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Successfully connected to database');
});

con.on('error', function(err) {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        con = mysql.createConnection(con.config);
    } else {
        throw err;
    }
});

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())


app.get("/", (req, res) => res.sendFile(path.join(__dirname, "paginas/index.html")))
app.get("/edicion",(req, res) => res.sendFile(path.join(__dirname, "paginas/edicion.html")))
app.get("/registro",(req, res) => res.sendFile(path.join(__dirname, "paginas/registro.html")))
app.get("/isesion",(req, res) => res.sendFile(path.join(__dirname, "paginas/login.html")))

//******************************************************************************************************************* */
function contieneEtiquetaHTML(texto) {
    return /<[^>]+>/.test(texto);
}
function validarTexto(texto) {
    return /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]{1,30}$/.test(texto);
}
function validarContraseña(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password);
}
function validarUsuario(usuario) {
    return /^[a-zA-Z0-9]{1,30}$/.test(usuario);
}

function detectarComandosPeligrosos(texto) {
    if (typeof texto !== 'string') return false;
    
    const comandosPeligrosos = [
        /\bdrop\b/i,
        /\bdelete\b/i,
        /\bupdate\b/i,
        /\bselect\b/i,
        /--/,
        /;/,
        /\bor\b/i,
        /\bunion\b/i,
        /\binsert\b/i,
        /\balter\b/i,
        /\bexec\b/i,
        /xp_/i
    ];

    return comandosPeligrosos.some(patron => patron.test(texto.toLowerCase()));
}

//******************************************************************************************************************* */
app.post('/agregarUsuario', async (req, res) => {
    try {
        let { nombre, apellidop, apellidom, edad, posicion, nacionalidad, usuario, password, password2 } = req.body;

        if ([nombre, apellidop, apellidom, nacionalidad, usuario, password].some(detectarComandosPeligrosos)) {
            return res.status(400).send({ message: "Detectado intento de inyección SQL" });
        }

        if (![nombre, apellidop, apellidom, edad, posicion, nacionalidad, usuario, password, password2].every(Boolean)) {
            return res.status(400).send({ message: "Faltan parámetros o hay datos manipulados en el registro" });
        }

        edad = parseInt(edad);
        posicion = parseInt(posicion);

        if (contieneEtiquetaHTML(nombre) || contieneEtiquetaHTML(apellidom) || contieneEtiquetaHTML(apellidop) || contieneEtiquetaHTML(nacionalidad)
            || isNaN(edad) || isNaN(posicion) || contieneEtiquetaHTML(usuario) || contieneEtiquetaHTML(password) || contieneEtiquetaHTML(password2)) {
            return res.status(400).send({ message: "No intentes adulterar la solicitud" });
        }

        if (edad < 10 || edad > 100 || posicion < 1 || posicion > 5) {
            return res.status(400).send({ message: "Datos numericos sin sentido" });
        }

        if (!validarTexto(nombre) || !validarTexto(apellidom) || !validarTexto(apellidop) || !validarTexto(nacionalidad)) {
            return res.status(400).send({ message: "Solo puedes ingresar texto de entre 1 y 30 caracteres" });
        }
        if (!validarContraseña(password)) {
            return res.status(400).send({ message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número" });
        }
        if (password !== password2) {
            return res.status(400).send({ message: "Las contraseñas no coinciden" });
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const checkUser = () => {
            return new Promise((resolve, reject) => {
                con.query('SELECT * FROM usuario WHERE usuario = ?', [usuario], (err, respuesta) => {
                    if (err) reject(err);
                    resolve(respuesta);
                });
            });
        };

        const userExists = await checkUser();
        if (userExists.length > 0) {
            return res.status(400).send({ message: "El usuario ya existe" });
        }

        const insertUser = () => {
            return new Promise((resolve, reject) => {
                con.query('INSERT INTO usuario (usuario, nombre, apellidopaterno, apellidomaterno, edad, posición, nacionalidad, contraseña) VALUES (?,?,?,?,?,?,?,?)',
                    [usuario, nombre, apellidop, apellidom, edad, posicion, nacionalidad, hashedPassword],
                    (err, respuesta) => {
                        if (err) reject(err);
                        resolve(respuesta);
                    });
            });
        };

        await insertUser();
        const token = 'Bearer ' + jsonwebtoken.sign({ user: usuario}, process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION });

        return res.status(202).send({ 
            message: 'ok', 
            nombre: ` ${nombre}`, 
            apellidopaterno: `${apellidop}`, 
            nacionalidad: `${nacionalidad}`,
            redireccion: "/",
            token: token
        });

    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: "Error en los campos" });
    }
});
//******************************************************************************************************************* */
app.get('/obtenerUsuario', async (req, res) => {
    try {
        const obtenerUsuarios = () => {
            return new Promise((resolve, reject) => {
                con.query('SELECT id, usuario, nombre, apellidopaterno, apellidomaterno, edad, posición, nacionalidad FROM usuario',
                    (err, respuesta) => {
                        if (err) reject(err);
                        resolve(respuesta);
                    });
            });
        };

        const obtenerPosicion = (idPosicion) => {
            return new Promise((resolve, reject) => {
                con.query('SELECT descripcion FROM posición WHERE id = ?', [idPosicion],
                    (err, respuesta) => {
                        if (err) reject(err);
                        resolve(respuesta[0]?.descripcion || 'Desconocida');
                    });
            });
        };

        const usuarios = await obtenerUsuarios();

        const posiciones = await Promise.all(
            usuarios.map(usuario => obtenerPosicion(usuario.posición))
        );

        const usuariosConPosicion = usuarios.map((usuario, index) => ({
            ...usuario,
            posicionNombre: posiciones[index]
        }));

        return res.status(200).send({
            message: 'ok',
            usuarios: usuariosConPosicion
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send({ message: "Error al obtener usuarios" });
    }
});
//******************************************************************************************************************* */
app.put('/obtenerUnUsuario', (req, res) => {
    let id = req.body.id;
    let solicitud = req.body.solicitud;

    if (!id || !solicitud) {
        return res.status(400).send({ message: "Faltan parámetros" });
    }
    if([id,solicitud].some(detectarComandosPeligrosos)){
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    if (isNaN(id) || !validarTexto(solicitud) || contieneEtiquetaHTML(solicitud)) {
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    const columnasPermitidas = ["nombre", "apellidoPaterno", "apellidoMaterno", "edad", "posición", "altura", "peso", "nacionalidad"];
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
//******************************************************************************************************************* */
app.put('/editarUsuario', (req, res) => {
    let { id, solicitud, cambio } = req.body;
    if([id,solicitud,cambio].some(detectarComandosPeligrosos)){
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    if (!id || !solicitud || !cambio) {
        return res.status(400).send({ message: "Faltan parámetros" });
    }
    if (isNaN(id) || !validarTexto(solicitud) || contieneEtiquetaHTML(solicitud) || contieneEtiquetaHTML(cambio)) {
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    const columnasPermitidas = ["nombre", "apellidoPaterno", "apellidoMaterno", "edad", "posición", "nacionalidad"];
    if (!columnasPermitidas.includes(solicitud)) {
        return res.status(400).send({ message: "Parámetro no permitido" });
    }

    if (["edad", "peso", "altura"].includes(solicitud)) {
        cambio = parseInt(cambio);
        if (isNaN(cambio)) {
            return res.status(400).send({ message: "El valor debe ser un número" });
        }
    } else if (!validarTexto(cambio) || contieneEtiquetaHTML(cambio)) {
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
//******************************************************************************************************************* */
app.delete('/BorrarUnUsuario', (req, res) => {
    let id = req.body.id
    
    if([id].some(detectarComandosPeligrosos)){
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    if (!id || isNaN(id)) {
        return res.status(400).send({ message: "Faltan parámetros o el id no es un número" });
    }
    con.query('DELETE usuario FROM usuario WHERE id =(?)', [id], (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({ message: "Error al conectar" });
        }
        console.log(respuesta)
        return res.status(202).send({ message: 'ok', respuesta: respuesta.affectedRows });
    });

})
//******************************************************************************************************************* */
app.delete('/BorrarUsuarios', (req, res) => {
    con.query('DELETE usuario FROM usuario;', (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({ message: "Error al conectar" });
        }
        console.log(respuesta)
        return res.status(202).send({ message: 'ok', respuesta: respuesta.affectedRows });
    });

})
//******************************************************************************************************************* */
app.put('/login', async (req, res) => {
    try {
        let { usuario, password } = req.body;
        
        if([usuario,password].some(detectarComandosPeligrosos)){
            return res.status(400).send({ message: "No intentes adulterar la solicitud" });
        }
        if (!usuario || !password) {
            return res.status(400).send({ message: "Faltan parámetros" });
        }
        if (!validarUsuario(usuario) || contieneEtiquetaHTML(usuario) || contieneEtiquetaHTML(password)) {
            return res.status(400).send({ message: "No intentes adulterar la solicitud" });
        }

        // Obtener usuario y contraseña hasheada
        const [user] = await con.promise().query(
            'SELECT id, contraseña FROM usuario WHERE usuario = ?', 
            [usuario]
        );

        if (user.length === 0) {
            return res.status(404).send({ message: "Usuario no encontrado" });
        }

        // Comparar contraseñas
        const match = await bcrypt.compare(password, user[0].contraseña);
        if (!match) {
            return res.status(401).send({ message: "Contraseña incorrecta" });
        }

        const token = 'Bearer ' + jsonwebtoken.sign({ user: usuario }, process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION });

        return res.status(200).send({ 
            message: 'ok', 
            respuesta: user[0].id, 
            redireccion: "/", 
            token: token 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Error al iniciar sesión" });
    }
});
//******************************************************************************************************************* */
app.put('/verificar-sesion', async (req, res) => {
    try {       
        
        const token = req.body.usuario;
        
    if([token].some(detectarComandosPeligrosos)){
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
        console.log('Token recibido:', token);
        if (!token || !token.startsWith('Bearer ')) {
            return res.json({ sesionActiva: false });
        }
        
        const tokenParts = token.split(' ');
        const tokenValue = tokenParts[1];
        try {
            const decodificada = jsonwebtoken.verify(tokenValue, process.env.JWT_SECRET);
            const [rows] = await con.promise().query(
                'SELECT id FROM usuario WHERE usuario = ?', 
                [decodificada.user]
            );

            if (rows.length === 0) {
                return res.json({ sesionActiva: false });
            }

            return res.json({ sesionActiva: true });
        } catch (tokenError) {
            console.error('Error al verificar token:', tokenError);
            return res.json({ sesionActiva: false });
        }
    } catch (error) {
        console.error('Error en verificación de sesión:', error);
        return res.json({ sesionActiva: false });
    }
});

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000')
})