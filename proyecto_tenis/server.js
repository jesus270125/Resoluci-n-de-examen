const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer'); // <--- NUEVA LIBRERÍA

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- CONEXIÓN A LA BASE DE DATOS ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456789',
    database: 'sistema_tenis'
});

db.connect((err) => {
    if (err) console.error('Error BD:', err);
    else console.log('¡Conectado exitosamente a la Base de Datos!');
});

// --- FUNCIÓN PARA GENERAR CONTRASEÑA ALEATORIA ---
function generarPassword() {
    // Genera una contraseña de 8 caracteres (letras y números)
    return Math.random().toString(36).slice(-8);
}

// --- CONFIGURACIÓN DEL CORREO (NODEMAILER) ---
// Para el examen, usaremos una cuenta de prueba "Ethereal" que genera nodemailer automáticamente
// o simplemente simularemos el envío mostrando la contraseña en consola.
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'tu_correo_prueba@ethereal.email',
        pass: 'tu_password_prueba'
    }
});

// --- RF01: REGISTRO DE USUARIOS (MODIFICADO) ---
app.post('/registro', (req, res) => {
    // NOTA: Ya no recibimos 'contrasena' del frontend
    const { nombre, apellido, edad, direccion, correo, celular, domicilio } = req.body;

    if (edad < 18) {
        return res.status(400).json({ message: "Debe ser mayor de edad para registrarse" });
    }

    // 1. GENERAMOS LA CONTRASEÑA AUTOMÁTICA
    const nuevaContrasena = generarPassword();

    const sql = 'INSERT INTO usuarios (nombre, apellido, edad, direccion, correo, celular, domicilio, contrasena) VALUES (?,?,?,?,?,?,?,?)';
    
    // Guardamos la contraseña GENERADA en la base de datos
    db.query(sql, [nombre, apellido, edad, direccion, correo, celular, domicilio, nuevaContrasena], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "El correo ya está registrado" });
            }
            return res.status(500).json({ error: err.message });
        }

        // --- SIMULACIÓN DE ENVÍO DE CORREO ---
        // En un sistema real aquí se envía el email.
        // Para tu examen/desarrollo, IMPRIMIMOS LA CONTRASEÑA EN LA CONSOLA NEGRA
        console.log("==================================================");
        console.log(`📧 SIMULANDO ENVÍO DE CORREO A: ${correo}`);
        console.log(`🔐 LA CONTRASEÑA GENERADA ES: ${nuevaContrasena}`);
        console.log("==================================================");

        // Respondemos al frontend que todo salió bien
        res.status(201).json({ 
            message: "Registro exitoso. Se ha enviado la contraseña a su correo." 
        });
    });
});

// --- RF02: INICIO DE SESIÓN (IGUAL QUE ANTES) ---
app.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;
    const sqlBuscar = 'SELECT * FROM usuarios WHERE correo = ?';
    
    db.query(sqlBuscar, [correo], (err, resultados) => {
        if (err) return res.status(500).json({ error: err.message });
        if (resultados.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });

        const usuario = resultados[0];

        if (usuario.estado === 'bloqueado') {
            return res.status(403).json({ message: "Su cuenta está bloqueada" });
        }

        if (usuario.contrasena === contrasena) {
            db.query('UPDATE usuarios SET intentos = 0 WHERE id = ?', [usuario.id]);
            return res.json({ message: "Acceso permitido", usuarioId: usuario.id });
        } else {
            let nuevosIntentos = usuario.intentos + 1;
            let nuevoEstado = 'activo';
            if (nuevosIntentos >= 3) nuevoEstado = 'bloqueado';

            db.query('UPDATE usuarios SET intentos = ?, estado = ? WHERE id = ?', 
                [nuevosIntentos, nuevoEstado, usuario.id]);

            if (nuevoEstado === 'bloqueado') {
                return res.status(403).json({ message: "Su cuenta está bloqueada" });
            } else {
                return res.status(401).json({ message: "Credenciales incorrectas" });
            }
        }
    });
});

// --- RF03, RF04, RF05: TURNOS (IGUAL QUE ANTES) ---
app.post('/solicitar-turno', (req, res) => {
    const { cancha, fecha, hora, usuarioId } = req.body;
    
    // Validación fecha > 2 días
    const fechaTurno = new Date(fecha);
    const fechaHoy = new Date();
    const diferencia = (fechaTurno.getTime() - fechaHoy.getTime()) / (1000 * 3600 * 24);

    if (diferencia < 2) {
        return res.status(400).json({ message: "Debe solicitar turnos con mínimo 2 días de anticipación" });
    }

    const sqlCheck = 'SELECT * FROM turnos WHERE cancha = ? AND fecha = ? AND hora = ?';
    db.query(sqlCheck, [cancha, fecha, hora], (err, turnos) => {
        if (err) return res.status(500).json({ error: err.message });
        if (turnos.length > 0) return res.status(409).json({ message: "Cancha ocupada" });

        const sqlInsert = 'INSERT INTO turnos (cancha, fecha, hora, usuario_id) VALUES (?,?,?,?)';
        db.query(sqlInsert, [cancha, fecha, hora, usuarioId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Turno registrado" });
        });
    });
});

app.listen(3000, () => {
    console.log('Servidor corriendo en puerto 3000');
});