const mysql = require("mysql2/promise");
const {
  db_host,
  db_user,
  db_password,
  db,
  db_bo,
  db_campagne,
  db_user_bo,
  db_user_campagne,
  db_user_date,
  db_date,
} = require("./jsons/config.json");

const pool = mysql.createPool({
  host: db_host,
  user: db_user,
  password: db_password,
  database: db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const poolBo = mysql.createPool({
  host: db_host,
  user: db_user_bo,
  password: db_password,
  database: db_bo,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const poolCampagne = mysql.createPool({
  host: db_host,
  user: db_user_campagne,
  password: db_password,
  database: db_campagne,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const poolDate = mysql.createPool({
  host: db_host,
  user: db_user_date,
  password: db_password,
  database: db_date,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
module.exports = { pool, poolBo, poolCampagne, poolDate };
