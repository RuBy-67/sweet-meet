const mysql = require("mysql2");
const {
  db_host,
  db_user,
  db_password,
  db,
  db_bo,
  db_campagne,
  db_user_bo,
  db_user_campagne,
} = require("./jsons/config.json");

const connection = mysql.createConnection({
  host: db_host,
  user: db_user,
  password: db_password,
  database: db,
});

const connectionBo = mysql.createConnection({
  host: db_host,
  user: db_user_bo,
  password: db_password,
  database: db_bo,
});

/*const connectionCampagne = mysql.createConnection({
  host: db_host,
  user: db_user_campagne,
  password: db_password,
  database: db_campagne,
});*/
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database: " + db);
});

/*connectionCampagne.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database: " + db_bo);
});*/
connectionBo.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database: " + db_bo);
});

module.exports = { connection, connectionBo /*connectionCampagne*/ };
