create database registro_fifa
use registro_fifa;
create table posición(
id INTEGER NOT NULL,
descripcion CHAR(20),
primary key (id)
);
create table usuario (
id integer auto_increment,
usuario char(30),
nombre char(30),
apellidoPaterno char(30),
apellidoMaterno char(30),
edad INTEGER NOT NULL,
posición INTEGER NOT NULL,
nacionalidad CHAR(40),
contraseña char(100),
primary key (id),
foreign key (posición)
references posición(id)
);

INSERT INTO posición values
(1,'portero'),
(2,'defensa'),
(3,'lateral'),
(4,'medioCampista'),
(5,'extremo'),
(6,'delantero');