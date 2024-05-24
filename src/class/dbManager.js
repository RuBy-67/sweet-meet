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
}

module.exports = DatabaseManager;
