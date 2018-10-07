# Events
A Progressive Web App for handling IIIT Delhi club events

#To create the Event Data Table
'event_data', 'CREATE TABLE `event_data` (  `event_key` int(11) NOT NULL AUTO_INCREMENT,  `title` varchar(100) DEFAULT NULL,  `date` datetime DEFAULT NULL,  `description` longtext,  `img` varchar(45) DEFAULT NULL,  `created` datetime DEFAULT NULL,  `venue` varchar(45) DEFAULT NULL,  `club` varchar(45) DEFAULT NULL,  PRIMARY KEY (`event_key`)) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'

#To create the users Table
'users', 'CREATE TABLE `users` (  `serial_number` int(45) NOT NULL AUTO_INCREMENT,  `user_id` varchar(100) NOT NULL,  `superuser` int(1) NOT NULL,  `club` varchar(45) DEFAULT NULL,  `username` varchar(45) DEFAULT NULL,  PRIMARY KEY (`serial_number`)) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'

#To create the subscriptions Table
'subscriptions', 'CREATE TABLE `subscriptions` (  `serial` int(11) NOT NULL AUTO_INCREMENT,  `comments` varchar(45) DEFAULT NULL,  `subscription_obj` longtext,  PRIMARY KEY (`serial`)) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'


