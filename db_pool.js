const mysql = require('mysql');
const keys = require('./config/keys')

//Using pool instead of single connections 
var mysql_pool  = mysql.createPool({
    connectionLimit : 100,
    host: keys.database.ip,
	user: keys.database.user,
	password: keys.database.password,
	database: keys.database.db
});

var getConnection = function (cb) {
    mysql_pool.getConnection(function (err, connection) {
        //if(err) throw err;
        //pass the error to the cb instead of throwing it
        if(err) {
          return cb(err);
        }
        cb(null, connection);
    });
};
module.exports = getConnection;