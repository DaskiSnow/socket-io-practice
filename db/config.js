const mysql = require('mysql')

const connectdb=()=>{
  var connection = mysql.createConnection({     
    host     : 'localhost',       
    user     : 'root',              
    password : '1688',       
    port: '3306',                   
    database: 'websocket' 
})
  return connection;
}

module.exports=connectdb;
