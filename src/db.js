const mysql = require("mysql2");
const {
  db_host,
  db_user,
  db_password,
  db,
  db_bo,
} = require("./jsons/config.json");

const connection = mysql.createConnection({
  host: db_host,
  user: db_user,
  password: db_password,
  database: db,
});

const connectionBo = mysql.createConnection({
  host: db_host,
  user: db_user,
  password: db_password,
  database: db_bo,
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database: " + db);
});

connectionBo.connect((err) => {
  if (err) throw err;
  console.log("Connected to the BO database: " + db_bo);
});

module.exports = { connection, connectionBo };
