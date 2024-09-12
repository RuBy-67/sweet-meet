const param = require("../jsons/param.json");
const { EmbedBuilder } = require("discord.js");
const DatabaseManager = require("./dbManager");
const sqlQueriesDate = require("./sqlQueriesDate");
const emo = require(`../jsons/emoji.json`);

class Dating extends DatabaseManager {
  async getAllDateProfil() {
    const rows = await this.queryDate(sqlQueriesDate.GET_ALL_DATE);
    return rows;
  }

  async getProfileByUserId(user_id) {
    console.log("Requête pour l'utilisateur ID:", user_id);
    const profile = await this.queryDate('SELECT * FROM profiles WHERE user_id = ?', [user_id]);
    console.log("Résultat de la requête du profil:", profile);
    return (profile && profile.length > 0) ? profile : null;
  }

  async insertIntoProfile(
    user_id,
    dateOrientation,
    dateDesc,
    searchInput,
    prenomInput,
    ageInput,
  ) {
    await this.queryDate(sqlQueriesDate.INSERT_INTO_PROFILE, [
      user_id,
      dateOrientation,
      dateDesc,
      searchInput,
      prenomInput,
      ageInput,
    ]);
  }

  async insertIntoLike(likerId, likedId) {
    try {
      const likeExists = await this.checkIfLikeExists(likerId, likedId);
      if (likeExists) {
        throw new Error('Le like existe déjà.');
      }
      const query = 'INSERT INTO likes (liker_Id, liked_Id) VALUES (?, ?)';
      await this.queryDate(query, [likerId, likedId]);
      return true;
    } catch (error) {
      if (error.message.includes('Duplicate entry')) {
        console.log('Le like existe déjà.');
      } else {
        console.error('Erreur lors de l\'insertion du like :', error);
      }
      return false;
    }
  }

  async checkIfLikeExists(likerId, likedId) {
    const query = 'SELECT * FROM likes WHERE liker_Id = ? AND liked_Id = ?';
    const result = await this.queryDate(query, [likerId, likedId]);
    return result.length > 0;
  }

  async getLikerId(likedId, likerId) {
    try {
      const query = 'SELECT * FROM likes WHERE liked_Id = ? AND liker_Id = ?';
      const result = await this.queryDate(query, [likedId, likerId]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Erreur lors de la vérification du liker ID :', error);
      throw error;
    }
  }

  async deleteProfileByUserId(userId) {
    const query = 'DELETE FROM profiles WHERE user_id = ?';
    const result = await this.queryDate(query, [userId]);

    if (result.affectedRows === 0) {
      throw new Error('Profil non trouvé.');
    }
    return true;

  }
}

module.exports = Dating;
