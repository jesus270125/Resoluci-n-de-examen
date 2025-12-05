create database sistema_tenis;
use sistema_tenis;

-- Tabla de Usuarios con los campos que pide el examen
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    edad INT,
    direccion VARCHAR(100),
    correo VARCHAR(100) UNIQUE,
    celular VARCHAR(20),
    domicilio VARCHAR(100),
    contrasena VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'activo',
    intentos INT DEFAULT 0
);

-- Tabla de Turnos vinculada al usuario
CREATE TABLE turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cancha VARCHAR(50),
    fecha DATE,
    hora TIME,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);