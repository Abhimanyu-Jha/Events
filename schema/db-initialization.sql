CREATE USER 'foo'@'%' IDENTIFIED WITH mysql_native_password BY 'bar';
-- UPDATE user SET authentication_string=password('password') WHERE user='root';
-- UPDATE user SET host='%' WHERE user='root';
-- UPDATE user SET plugin='mysql_native_password' WHERE user='root';
FLUSH PRIVILEGES;

CREATE DATABASE events;

GRANT ALL ON events.* TO 'foo'@'%';

FLUSH PRIVILEGES;

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
  comments varchar(100) DEFAULT NULL,
  subscription_obj longtext NOT NULL,

  PRIMARY KEY (serial_number)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  serial_number int(45) NOT NULL AUTO_INCREMENT,
  user_id varchar(100) NOT NULL,
  username varchar(45) DEFAULT NULL,
  club varchar(45) DEFAULT NULL,
  superuser int(1) NOT NULL,
  PRIMARY KEY (serial_number)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

INSERT INTO users VALUES (1, '102548026439027076325', 'Abhimanyu', 'admin', 1);
