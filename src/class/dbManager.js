const { connection } = require("../db");

class DatabaseManager {
  constructor() {
    this.connection = connection;
  }

  async getMateriau(userId) {
    const result = await this.connection
      .promise()
      .query("SELECT * FROM materiau_user WHERE idUser = ?", [userId]);

    return result[0];
  }

  async getBadge(userId) {
    const result = await this.connection
      .promise()
      .query(
        "SELECT badge.emojiId FROM badge_user INNER JOIN badge ON badge_user.idBadge = badge.id WHERE badge_user.idUser = ?",
        [userId]
      );

    return result[0];
  }

  async getMarriage(userId) {
    const result = await this.connection
      .promise()
      .query("SELECT * FROM mariage WHERE userId = ? OR userId2 = ?", [
        userId,
        userId,
      ]);

    return result[0];
  }

  async getStats(userId) {
    const result = await this.connection
      .promise()
      .query("SELECT * FROM user WHERE discordId = ?", [userId]);

    return result[0][0];
  }
  async getTopUsers(field, limit) {
    const result = await this.connection
      .promise()
      .query(`SELECT * FROM user ORDER BY ${field} DESC LIMIT ?`, [limit]);

    return result[0];
  }

  async getTopUsersByRate(limit) {
    const result = await this.connection
      .promise()
      .query(
        "SELECT *, winCounter / (winCounter + loseCounter) as rate FROM user WHERE winCounter + loseCounter > 0 ORDER BY rate DESC LIMIT ?",
        [limit]
      );

    return result[0];
  }

  async setMarriage(userId1, userId2) {
    await this.connection
      .promise()
      .query(
        "INSERT INTO mariage (userId, userId2, date) VALUES (?, ?,NOW())",
        [userId1, userId2]
      );
  }

  async updatePower(userId, amount) {
    await this.connection
      .promise()
      .query("UPDATE user SET power = power + ? WHERE discordId = ?", [
        amount,
        userId,
      ]);
  }
}

module.exports = DatabaseManager;
