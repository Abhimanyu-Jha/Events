CREATE DATABASE events;

USE events;

CREATE TABLE event_data (
  event_key int(11) NOT NULL AUTO_INCREMENT,
  title VARCHAR(100) DEFAULT NULL,
  date datetime DEFAULT NULL,
  description longtext,
  img VARCHAR(45) DEFAULT NULL,
  created datetime DEFAULT NULL,
  venue VARCHAR(45) DEFAULT NULL,
  club VARCHAR(45) DEFAULT NULL,

  PRIMARY KEY (event_key)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4;

CREATE TABLE subscriptions (
  serial_number int(45) NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(100) NOT NULL,
  username VARCHAR(45) DEFAULT NULL,
  club VARCHAR(45) DEFAULT NULL,
  superuser int(1) NOT NULL,

  PRIMARY KEY (serial_number)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
