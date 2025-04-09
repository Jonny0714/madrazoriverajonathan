create database registro_basketball;
use registro_basketball;
create table posición(
id INTEGER NOT NULL,
descripcion CHAR(20),
primary key (id)
);
create table usuario (
id integer auto_increment,
nombre char(30),
apellidoPaterno char(30),
apellidoMaterno char(30),
edad INTEGER NOT NULL,
posición INTEGER NOT NULL,
altura INTEGER NOT NULL,
peso FLOAT NOT NULL,
nacionalidad CHAR(40),
primary key (id),
foreign key (posición)
references posición(id)
);
INSERT INTO posición values
(1,'base'),
(2,'escolta'),
(3,'alero'),
(4,'ala-pivot'),
(5,'pivot');