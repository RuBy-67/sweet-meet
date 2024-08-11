const SQL_QUERIES_DATE = {
  GET_ALL_DATE: "SELECT * FROM profiles",
  INSERT_INTO_PROFILE:
    "INSERT INTO profiles (user_id, dateOrientation, dateDesc, dateMP, prenom, age) VALUES (?, ?, ?, ?, ?, ?)",
  INSERT_INTO_LIKE: "INSERT INTO like (id1, id2) VALUES (?, ?)",
  GET_LIKER_ID: "SELECT * FROM like WHERE liker_id = ? AND liked_id = ?",
};
module.exports = SQL_QUERIES_DATE;
