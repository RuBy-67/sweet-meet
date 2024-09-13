const SQL_QUERIES_DATE = {
  GET_ALL_DATE: "SELECT * FROM profiles",
  INSERT_INTO_PROFILE:
    "INSERT INTO profiles (user_id, dateOrientation, searchInput, prenomInput, ageInput, dateDesc) VALUES (?, ?, ?, ?, ?, ?)",
  INSERT_INTO_LIKE: "INSERT INTO likes (liked_Id, liker_Id) VALUES (?, ?)",
  GET_LIKER_ID: "SELECT * FROM like WHERE liker_id = ? AND liked_id = ?",
};
module.exports = SQL_QUERIES_DATE;
