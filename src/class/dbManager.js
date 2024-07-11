const { pool, poolBo /*poolCampagne*/ } = require("../db");
const SQL_QUERIES = require("./sqlQueriesDb");

class DatabaseManager {
  constructor() {
    this.pool = pool;
    this.poolBo = poolBo;
    //this.poolCampagne = poolCampagne;
  }

  async query(pool, sql, params) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  async queryMain(sql, params) {
    return this.query(this.pool, sql, params);
  }

  async queryBo(sql, params) {
    return this.query(this.poolBo, sql, params);
  }

  /*async queryCampagne(sql, params) {
    return this.query(this.poolCampagne, sql, params);
  }*/

  async insertBackupUserData(userData) {
    const { discordId, power, winCounter, loseCounter } = userData;
    return this.queryBo(SQL_QUERIES.INSERT_BACKUP_USER, [
      discordId,
      power,
      winCounter,
      loseCounter,
    ]);
  }
  async getColor(userId) {
    const userStats = await this.getStats(userId);

    if (userStats.guildId !== null) {
      const result = await this.queryMain(SQL_QUERIES.GET_COLOR, [userId]);
      if (result && result[0] && result[0].bannière) {
        return result[0].bannière;
      } else {
        return "#e08dac";
      }
    } else {
      return "#e08dac";
    }
  }
  async createGuild(guildColor, guildName, guildDescription, userId) {
    this.queryMain(SQL_QUERIES.CREATE_GUILD, [
      guildName,
      guildDescription,
      guildColor,
      userId,
    ]);
  }
  async getGuild() {
    return this.queryMain(SQL_QUERIES.GET_GUILD);
  }
  async getGuildById(guildId) {
    return this.queryMain(SQL_QUERIES.GET_GUILD_BY_ID, [guildId]);
  }

  async getMateriauData(userId) {
    return this.queryMain(SQL_QUERIES.SELECT_MATERIAU_USER, [userId]);
  }

  async insertBackupMateriauData(materiau) {
    const { idUser, idMateriau, lvl } = materiau;
    return this.queryBo(SQL_QUERIES.INSERT_BACKUP_MATERIAU_USER, [
      idUser,
      idMateriau,
      lvl,
    ]);
  }
  async generateSecret() {
    const length = 20; // Longueur du code secret
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secretCode = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      secretCode += characters.charAt(randomIndex);
    }

    return secretCode;
  }
  async generateSecretCode(userId) {
    try {
      const secretCode = await this.generateSecret(); // Générer le code secret aléatoire
      const now = new Date();
      const expirationTime = new Date(now.getTime() + 20 * 60 * 1000);
      console.log("expirationTime", expirationTime);
      console.log(secretCode);
      // Insérer le code secret dans la base de données avec l'heure d'expiration
      await this.queryMain(SQL_QUERIES.INSERT_CODE_SECRET, [
        userId,
        secretCode,
        expirationTime,
      ]);

      // Planifier la suppression du code secret après expiration
      const delay = expirationTime.getTime() - now.getTime();
      setTimeout(async () => {
        try {
          // Supprimer le code secret de la base de données
          await this.queryMain(SQL_QUERIES.DELETE_CODE_SECRET, [userId]);
          console.log(
            `Code secret expiré pour l'utilisateur ${userId} : ${secretCode}`
          );
        } catch (error) {
          console.error(
            "Erreur lors de la suppression du code secret expiré :",
            error
          );
        }
      }, delay);

      return secretCode; // Retourner le code secret généré
    } catch (error) {
      console.error("Erreur lors de la génération du code secret :", error);
      throw error;
    }
  }

  async getBadgeData(userId) {
    return this.queryMain(SQL_QUERIES.SELECT_BADGE_USER, [userId]);
  }

  async insertBackupBadgeData(badge) {
    const { idUser, idBadge } = badge;
    return this.queryBo(SQL_QUERIES.INSERT_BACKUP_BADGE_USER, [
      idUser,
      idBadge,
    ]);
  }

  async deleteUserData(discordId) {
    await this.queryMain(SQL_QUERIES.DELETE_USER, [discordId]);

    const guild = await this.getGuildByOwnerId(discordId);
    if (guild) {
      // Récupération des membres de la guilde
      const guildMembers = await this.getGuildMembers(guild.id);

      if (guildMembers.length > 0) {
        // Sélection aléatoire d'un membre
        const randomIndex = Math.floor(Math.random() * guildMembers.length);
        const newEmperor = guildMembers[randomIndex];

        // Attribution du rôle d'Empereur au membre sélectionné
        await this.addRoleToUser(newEmperor.id, 1246944929675087914);
      } else {
        // Suppression de la guilde si elle ne contient plus de membres
        await this.deleteGuildByOwnerId(discordId);
      }
    }
  }
  async removeMaterialFromUser(idUnique) {
    await this.queryMain(SQL_QUERIES.DELETE_MATERIAU_USER, [idUnique]);
  }

  async getMateriauByUserId(userId) {
    return this.queryMain(SQL_QUERIES.GET_MATERIAU_BY_USER_ID, [userId]);
  }

  async getUserDataBo(userId) {
    return this.queryBo(SQL_QUERIES.GET_USER_DATA_BO, [userId]);
  }
  async getUserData(userId) {
    return this.queryMain(SQL_QUERIES.GET_USER_DATA, [userId]);
  }

  async insertUserData(userData) {
    return this.queryMain(SQL_QUERIES.INSERT_USER_DATA, [
      userData.discordId,
      userData.power,
      userData.winCounter,
      userData.loseCounter,
    ]);
  }

  async getMateriauData(userId) {
    return this.queryBo(SQL_QUERIES.GET_MATERIAU_DATA, [userId]);
  }
  async insertMateriauData(userId, materiauId, level = 1) {
    return this.queryMain(SQL_QUERIES.INSERT_MATERIAU_DATA, [
      userId,
      materiauId,
      level,
    ]);
  }
  async getBadgeData(userId) {
    return this.queryBo(SQL_QUERIES.GET_BADGE_DATA, [userId]);
  }
  async insertBadgeData(userId, badgeId) {
    return this.queryMain(SQL_QUERIES.INSERT_BADGE_DATA, [userId, badgeId]);
  }
  async deleteBackupData(userId) {
    await this.queryBo(SQL_QUERIES.DELETE_BACKUP_USER, [userId]);
    await this.queryBo(SQL_QUERIES.DELETE_BACKUP_MAT, [userId]);
    await this.queryBo(SQL_QUERIES.DELETE_BACKUP_BADGE, [userId]);
    return true;
  }

  async getDuelDetails(duelId, userId) {
    return this.queryMain(SQL_QUERIES.GET_DUEL_DETAILS, [duelId, userId]);
  }

  async getRandomMaterial() {
    return this.queryMain(SQL_QUERIES.GET_RANDOM_MATERIAL);
  }

  async getMateriau() {
    return this.queryMain(SQL_QUERIES.GET_MATERIAU);
  }
  async getMateriauById(id) {
    return this.queryMain(SQL_QUERIES.GET_MATERIAL_BY_ID, [id]);
  }
  async getDataMateriauById(id) {
    return this.queryMain(SQL_QUERIES.GET_DATA_MATERIAL_BY_ID, [id]);
  }
  async getRoleById(id) {
    return this.queryMain(SQL_QUERIES.GET_ROLE_BY_ID, [id]);
  }
  async addRoleToUser(userId, roleId) {
    return this.queryMain(SQL_QUERIES.ADD_ROLE_TO_USER, [userId, roleId]);
  }
  async getRoleByUserIdRoleId(userId, roleId) {
    return this.queryMain(SQL_QUERIES.GET_ROLE_BY_USER_ID_ROLE_ID, [
      roleId,
      userId,
    ]);
  }
  async getRoleByUserId(userId) {
    return this.queryMain(SQL_QUERIES.GET_ROLE_BY_USER_ID, [userId]);
  }

  async getGuildByOwnerId(userId) {
    return this.queryMain(SQL_QUERIES.GET_GUILD_BY_OWNER_ID, [userId]);
  }
  async getGuildMembers(guildId) {
    return this.queryMain(SQL_QUERIES.GET_GUILD_MEMBERS, [guildId]);
  }

  async getBadge(userId) {
    return this.queryMain(SQL_QUERIES.GET_BADGE, [userId]);
  }
  async getAllBadge() {
    return this.queryMain(SQL_QUERIES.GET_ALL_BADGE);
  }
  async getBadgeById(id) {
    return this.queryMain(SQL_QUERIES.GET_BADGE_BY_ID, [id]);
  }
  async getBadgeNoL() {
    return this.queryMain(SQL_QUERIES.GET_BADGE_NO_L);
  }

  async getMarriage(userId) {
    return this.queryMain(SQL_QUERIES.GET_MARRIAGE, [userId, userId]);
  }
  async deleteMarriage(userId, userId2) {
    return this.queryMain(SQL_QUERIES.DELETE_MARIAGE, [userId, userId]);
  }

  async getStats(userId) {
    const result = await this.queryMain(SQL_QUERIES.GET_STATS, [userId]);
    return result[0];
  }
  async countDuel() {
    const result = await this.queryMain(SQL_QUERIES.COUNT_DUEL);
    return result[0];
  }
  async getTotalMateriauByRarete() {
    const result = await this.queryMain(
      SQL_QUERIES.GET_TOTAL_MATERIAU_BY_RARITY
    );
    return result[0];
  }
  async deleteGuildByOwnerId(userId) {
    guildId = await this.getGuildByOwnerId(userId);
    await this.queryMain(SQL_QUERIES.DELETE_GUILD_BY_OWNER_ID, [userId]);
    await this.queryMain(SQL_QUERIES.REMOVE_GUILD_ID_FROM_USER, [guildId]);
  }
  async getRolesFromDB() {
    return this.queryMain(SQL_QUERIES.GET_ROLES);
  }
  async getAveragePower() {
    const result = await this.queryMain(SQL_QUERIES.GET_AVERAGE_POWER);
    return result[0];
  }
  async getAllUser() {
    return this.queryMain(SQL_QUERIES.GET_ALL_PLAYER);
  }

  async getTopUsers(field, limit) {
    return this.queryMain(SQL_QUERIES.GET_TOP_USERS, [field, limit]);
  }

  async getTopUsersByRate(limit) {
    return this.queryMain(SQL_QUERIES.GET_TOP_USERS_BY_RATE, [limit]);
  }

  async setMarriage(userId1, userId2) {
    return this.queryMain(SQL_QUERIES.SET_MARRIAGE, [userId1, userId2]);
  }

  async updatePower(userId, amount) {
    return this.queryMain(SQL_QUERIES.UPDATE_POWER, [amount, userId]);
  }
  async getAllPower() {
    return this.queryMain(SQL_QUERIES.GET_ALL_POWER);
  }

  async updateBadge(userId, nomBadge) {
    const badgeResult = await this.queryMain(SQL_QUERIES.GET_BADGE_ID_BY_NAME, [
      nomBadge,
    ]);

    if (badgeResult.length === 0) {
      throw new Error(
        `Le badge "${nomBadge}" n'existe pas dans la base de données.`
      );
    }

    const badgeId = badgeResult[0].id;
    await this.queryMain(SQL_QUERIES.INSERT_BADGE_USER, [userId, badgeId]);
  }
  async updateBadgeById(userId, badgeId) {
    await this.queryMain(SQL_QUERIES.INSERT_BADGE_USER, [userId, badgeId]);
  }
  async removeBadgeById(badgeId) {
    console.log("selected", badgeId);
    await this.queryMain(SQL_QUERIES.DELETE_BADGE_USER, [badgeId]);
  }

  async updatePowerByBadgeId(badgeId, amount) {
    const users = await this.queryMain(SQL_QUERIES.GET_USERS_BY_BADGE_ID, [
      badgeId,
    ]);

    for (const user of users) {
      await this.updatePower(user.idUser, amount);
    }
  }

  async setPowerById(userId, newPower) {
    const user = await this.queryMain(SQL_QUERIES.GET_STATS, [userId]);

    if (user.length === 0) {
      console.error("User not found.");
      return;
    }

    const currentPower = user[0].power;
    const updatedPower = currentPower + newPower;
    await this.queryMain(SQL_QUERIES.UPDATE_USER_POWER, [updatedPower, userId]);
  }

  async generateRandomPower() {
    const random = Math.random() * 100;
    let power;
    if (random < 10) {
      power = Math.floor(Math.random() * 10000) + 5000;
    } else if (random < 35) {
      power = Math.floor(Math.random() * 15000) + 15001;
    } else if (random < 60) {
      power = Math.floor(Math.random() * 30000) + 30001;
    } else if (random < 80) {
      power = Math.floor(Math.random() * 30000) + 60001;
    } else if (random < 95) {
      power = Math.floor(Math.random() * 30000) + 90001;
    } else {
      power = Math.floor(Math.random() * 30000) + 120001;
    }
    return power;
  }

  async getMateriauxByRarity(rarity) {
    return this.queryMain(SQL_QUERIES.GENERATE_RANDOM_POWER, [rarity]);
  }

  async addMaterialToUser(userId, materialId, level) {
    if (
      level <= 1 ||
      level === null ||
      level === undefined ||
      typeof level !== "number" ||
      isNaN(level)
    ) {
      level = 1;
    }
    return this.queryMain(SQL_QUERIES.ADD_MATERIAL_TO_USER, [
      userId,
      materialId,
      level,
    ]);
  }

  async updateMaterialState(userId, materialId, state) {
    return this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE, [
      state,
      materialId,
      userId,
    ]);
  }

  async updateMaterialLevel(userId, materialId, newLevel) {
    return this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_LEVEL, [
      newLevel,
      materialId,
      userId,
    ]);
  }
}

module.exports = DatabaseManager;
