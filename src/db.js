const mysql = require("mysql2");
const { db_host, db_user, db_password, db } = require("./jsons/config.json");

const connection = mysql.createConnection({
  host: db_host,
  user: db_user,
  password: db_password,
  database: db,
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database: " + db);
});

module.exports = connection;
