const { pool, poolCampagne, poolDate } = require("../db");
const SQL_QUERIES = require("./sqlQueriesDb");
const params = require("../jsons/param.json");
const emo = require(`../jsons/emoji.json`);

class DatabaseManager {
  constructor() {
    this.pool = pool;
    this.poolCampagne = poolCampagne;
    this.poolDate = poolDate;
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

  async queryCampagne(sql, params) {
    return this.query(this.poolCampagne, sql, params);
  }
  /************ */
  async queryDate(sql, params) {
    return this.query(this.poolDate, sql, params);
  }
  async getColor(userId) {
    const userStats = await this.getStats(userId);
    if (userStats.guildId === null) {
      return "#e08dac";
    }
    const [result] = await this.queryMain(SQL_QUERIES.GET_COLOR, [userId]);
    return result?.bannière ?? "#e08dac";
  }

  async getBossInfo(id) {
    return this.queryCampagne(SQL_QUERIES.GET_BOSS_INFO, [id]);
  }

  async createGuild(guildColor, guildName, guildDescription, tag, userId) {
    this.queryMain(SQL_QUERIES.CREATE_GUILD, [
      guildName,
      guildDescription,
      tag,
      guildColor,
      userId,
    ]);
  }
  async upgradeBoss(userId, bossId) {
    this.queryMain(SQL_QUERIES.UPGRADE_BOSS, [userId, bossId]);
  }
  async getBossByUserByBossId(userId, bossId) {
    return this.queryMain(SQL_QUERIES.GET_BOSS_BY_USER_BY_BOSS_ID, [
      userId,
      bossId,
    ]);
  }
  async upgradePoussiere(userId, amount, type) {
    const columnMap = {
      1: "poussiereCommune",
      2: "poussiereRare",
      3: "poussiereEpique",
      4: "poussiereLegendaire",
    };
    const columnName = columnMap[type];
    await this.queryMain("UPDATE user SET ?? = ?? + ? WHERE discordId = ?", [
      columnName,
      columnName,
      amount,
      userId,
    ]);
  }
  async upgradeCard(userId, bossId, amount) {
    this.queryMain(SQL_QUERIES.ADD_CARD_TO_BOSS, [amount, userId, bossId]);
  }

  async getGuild() {
    return this.queryMain(SQL_QUERIES.GET_GUILD);
  }
  async addBossId(userId, bossId, lvl) {
    const possede = await this.getBossByUserByBossId(userId, bossId);
    if (possede.length > 0) {
      return this.queryMain(SQL_QUERIES.ADD_CARD_TO_BOSS, [
        lvl,
        userId,
        bossId,
      ]);
    } else {
      this.queryMain(SQL_QUERIES.ADD_BOSS_ID, [userId, bossId, lvl]);
    }
  }

  async createAccount(userId, civilisation, type) {
    this.queryMain(SQL_QUERIES.ADD_USER, [userId, civilisation]);
    this.queryMain(SQL_QUERIES.ADD_USER_HOSPITAL, [userId]);
    this.queryMain(SQL_QUERIES.ADD_USER_CASERNE, [userId]);
    this.queryMain(SQL_QUERIES.ADD_USER_FORGE, [userId]);
    let troops;
    switch (type) {
      case 1: // Infanterie
        troops = [{ type: "infanterieLvl1", amount: 10000 }];
        break;
      case 2: // Archer
        troops = [{ type: "archerLvl1", amount: 10000 }];
        break;
      case 3: // Cavalier
        troops = [{ type: "chevalierLvl1", amount: 10000 }];
        break;
      case 4: // Machine
        troops = [{ type: "machineLvl1", amount: 10000 }];
        break;
      default:
        throw new Error("Type de troupe inconnu.");
    }

    // Construire dynamiquement la partie de la requête SQL
    const columns = troops.map((t) => t.type).join(", ");
    const values = troops.map((t) => `(${userId}, ${t.amount})`).join(", ");

    const query = `
        INSERT INTO troops (discordId, ${columns})
        VALUES ${values}
        ON DUPLICATE KEY UPDATE
            ${troops.map((t) => `${t.type} = VALUES(${t.type})`).join(", ")}
    `;

    // Exécuter la requête SQL
    await this.queryMain(query);
  }
  async getAllCivilisation() {
    return this.queryMain(SQL_QUERIES.GET_ALL_CIVILISATION);
  }
  async getCivilisationByName(name) {
    return this.queryMain(SQL_QUERIES.GET_CIVILISATION_BY_NAME, [name]);
  }
  async getBossByUser(userId) {
    return this.queryMain(SQL_QUERIES.GET_BOSS_BY_USER, [userId]);
  }

  async getGuildByTag(tag) {
    return this.queryMain(SQL_QUERIES.GET_GUILD_BY_TAG, [tag]);
  }
  async getGuildById(guildId) {
    return this.queryMain(SQL_QUERIES.GET_GUILD_BY_ID, [guildId]);
  }

  async getMateriauData(userId) {
    return this.queryMain(SQL_QUERIES.SELECT_MATERIAU_USER, [userId]);
  }

  async getGuildInvitations(guildId) {
    return this.queryMain(SQL_QUERIES.GET_GUILD_INVITATION, [guildId]);
  }
  async getUserInvitation(userId) {
    return this.queryMain(SQL_QUERIES.CHECK_INVITATIONS, [userId]);
  }
  async getUserInvitationByGuild(userId, guildId, type) {
    return this.queryMain(SQL_QUERIES.CHECK_INVITATIONS_BY_GUILD, [
      userId,
      guildId,
      type,
    ]);
  }
  async getMIDMateriauxByIdLVL5(idMateriau, userId) {
    return this.queryMain(SQL_QUERIES.GET_MID_MATERIAUX_BY_ID_LVL5, [
      idMateriau,
      userId,
    ]);
  }
  async createInvitation(userId, guildId, type) {
    await this.queryMain(SQL_QUERIES.DELETE_INVITATION, [
      guildId,
      userId,
      type,
    ]);
    await this.queryMain(SQL_QUERIES.INSERT_INVITATION, [
      guildId,
      userId,
      type,
    ]);
  }
  async deleteInvitation(userId) {
    return this.queryMain(SQL_QUERIES.REMOVE_INVITATION, [userId]);
  }

  async deleteInvitationByUserAndGuildId(userId, guildId, type) {
    return this.queryMain(SQL_QUERIES.DELETE_INVITATION, [userId, guildId]);
  }

  async getGuildByName(guildName) {
    const result = await this.queryMain(SQL_QUERIES.GET_GUILD_BY_NAME, [
      guildName,
      guildName,
    ]);
    return result[0];
  }
  async getClassName(idClass) {
    return this.queryMain(SQL_QUERIES.GET_CLASS_NAME, [idClass]);
  }

  async getGuildInfo(guildId) {
    const result = await this.queryMain(SQL_QUERIES.GET_GUILD_INFO, [guildId]);
    return result[0];
  }
  async addGuildMemberPower(guildId, amount) {
    const guildMembers = await this.queryMain(SQL_QUERIES.GET_GUILD_MEMBERS, [
      guildId,
    ]);
    // Parcourir tous les membres et ajouter fragment de puissance
    for (const member of guildMembers) {
      await this.queryMain(SQL_QUERIES.ADD_MEMBER_FRAGMENT, [
        amount,
        member.discordId,
      ]);
    }
  }
  async updateGuildLevel(guildId, level) {
    await this.queryMain(SQL_QUERIES.UPDATE_GUILD_LEVEL, [level, guildId]);
  }
  async resolveChoices(option) {
    if (option.choices instanceof Promise) {
      option.choices = await option.choices;
    }
    return option;
  }

  async joinGuild(userId, guildId) {
    await this.queryMain(SQL_QUERIES.UPDATE_USER_GUILD, [guildId, userId]);
    await this.queryMain(SQL_QUERIES.ADD_CLASS_TO_USER, [userId, guildId, 5]);
    await this.queryMain(SQL_QUERIES.REMOVE_INVITATION, [userId]);
  }
  async updateUserGuild(guildId, userId) {
    await this.queryMain(SQL_QUERIES.UPDATE_USER_GUILD, [guildId, userId]);
  }
  async addGuildBank(guildId, amount) {
    await this.queryMain(SQL_QUERIES.ADD_GUILD_BANK, [amount, guildId]);
  }
  async updateGuildName(guildId, name, tag) {
    await this.queryMain(SQL_QUERIES.UPDATE_GUILD_NAME_AND_TAG, [
      name,
      guildId,
      tag,
    ]);
  }
  async getAllGuilds() {
    return this.queryMain(SQL_QUERIES.GET_GUILD);
  }

  async calculateGuildRiches() {
    const allGuilds = await this.getAllGuilds();
    const guildRiches = [];
    for (const guild of allGuilds) {
      const guildId = guild.id;
      const guildMembers = await this.getGuildMembers(guildId);
      let totalRiches = guild.banque;
      for (const member of guildMembers) {
        const memberStats = await this.getStats(member.discordId);
        totalRiches += memberStats.power;
      }
      guildRiches.push({
        guildTag: guild.tag,
        totalRiches: totalRiches,
      });
    }
    guildRiches.sort((a, b) => b.totalRiches - a.totalRiches);
    const topGuilds = guildRiches.slice(0, 5);
    return topGuilds.map((guild) => ({
      tag: guild.guildTag,
      richesse: guild.totalRiches.toLocaleString(),
    }));
  }
  async updateGuildDescription(guildId, description) {
    await this.queryMain(SQL_QUERIES.UPDATE_GUILD_DESCRIPTION, [
      description,
      guildId,
    ]);
  }
  async updateGuildBanner(guildId, banner) {
    await this.queryMain(SQL_QUERIES.UPDATE_GUILD_BANNER, [banner, guildId]);
  }
  async updateMarchand(userId, guildId) {
    await this.queryMain(SQL_QUERIES.UPDATE_GUILD_MARCHAND, [userId, guildId]);
  }
  async updateGuildInvitationStatus(guildId, statut) {
    await this.queryMain(SQL_QUERIES.UPDATE_GUILD_INVITATION_STATUS, [
      statut,
      guildId,
    ]);
  }
  // Fonction pour quitter une guilde
  async leaveGuild(userId) {
    const userGuildResult = await this.queryMain(SQL_QUERIES.GET_USER_GUILD, [
      userId,
    ]);

    const userIsOwner = await this.getGuildByOwnerId(userId);
    if (userIsOwner.length > 0) {
      return "Un Empereur ne peut pas quitter sa guilde";
    }
    const guildInfo = await this.queryMain(SQL_QUERIES.GET_GUILD_INFO, [
      userGuildResult,
    ]);
    if (guildInfo.marchand == userId) {
      await this.updateMarchand(NULL, guildInfo.id);
    }
    await this.queryMain(SQL_QUERIES.LEAVE_GUILD, [userId]);
    await this.queryMain(SQL_QUERIES.DELETE_CLASS_USER, [userId]);
    return "Vous avez quitté la guilde avec succès";
  }

  async acceptInvitation(userId, guildId) {
    // Vérifiez si l'utilisateur est un administrateur de la guilde
    const isAdmin = await this.isGuildAdmin(userId, guildId);
    const userGuildResult = await this.queryMain(SQL_QUERIES.GET_USER_GUILD, [
      userId,
    ]);

    if (isAdmin) {
      // Si l'utilisateur est un administrateur, obtenir les invitations des personnes qui ont postulé
      const applications = await this.queryMain(
        SQL_QUERIES.GET_GUILD_INVITATION,
        [guildId]
      );
      if (!applications.length) {
        throw new Error("No applications found for this guild");
      }
      return applications;
    } else if (userGuildResult.length > 0) {
      // si l'utilisateur fait déjà partie d'une guilde
      throw new Error("User is already in a guild");
    } else {
      // Si l'utilisateur est un joueur, obtenir les invitations qui lui ont été envoyées
      const invitations = await this.queryMain(SQL_QUERIES.CHECK_INVITATIONS, [
        userId,
      ]);
      if (!invitations.length) {
        throw new Error("No invitations found for this user");
      }
      return invitations;
    }
  }
  /// a revoire

  async promoteDemoteMember(userId, guildId, newClassId) {
    ///supirmmer l'ancienne classe de l'user
    await this.queryMain(SQL_QUERIES.DELETE_CLASS_USER, [userId]);
    await this.queryMain(SQL_QUERIES.ADD_CLASS_TO_USER, [
      userId,
      guildId,
      newClassId,
    ]);
  }

  async isGuildAdmin(userId, guildId) {
    const [guild] = await this.getGuildById(guildId);
    if (guild.empreur === userId) {
      return true;
    }
    const userRoles = await this.getUserClass(userId, guildId);
    if (userRoles.includes(1) || userRoles.includes(2)) {
      return true;
    }
    return false;
  }
  async getUserClass(userId, guildId) {
    return this.queryMain(SQL_QUERIES.GET_USER_CLASS, [userId, guildId]);
  }

  async generateSecret() {
    const length = Math.floor(Math.random() * (30 - 20 + 1)) + 20;
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

  async deleteUserData(discordId) {
    await this.queryMain(SQL_QUERIES.DELETE_USER, [discordId]);
    const guild = await this.getGuildByOwnerId(discordId);
    if (guild) {
      const guildMembers = await this.getGuildMembers(guild.id);

      if (guildMembers.length > 0) {
        const newEmperor =
          guildMembers[Math.floor(Math.random() * guildMembers.length)];
        await this.addRoleToUser(newEmperor.id, 1246944929675087914);
      } else {
        await this.deleteGuildByOwnerId(discordId);
      }
    }
  }

  async removeMaterialFromUser(idUnique) {
    await this.queryMain(SQL_QUERIES.DELETE_MATERIAU_USER, [idUnique]);
  }

  async getMateriauByUserId(userId) {
    return this.queryMain(SQL_QUERIES.GET_MATERIAL_BY_ID, [userId]);
  }
  async materiauById(id) {
    return this.queryMain(SQL_QUERIES.GET_MATERIAU_BY_ID, [id]);
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
  async getIdMateriauByIdUnique(id) {
    return this.queryMain(SQL_QUERIES.GET_ID_MATERIAL_BY_ID_UNIQUE, [id]);
  }
  async getRoleByUserIdRoleId(userId, roleId) {
    return this.queryMain(SQL_QUERIES.GET_ROLE_BY_USER_ID_ROLE_ID, [
      roleId,
      userId,
    ]);
  }
  async getTroopType(troopType) {
    const [result] = await this.queryMain(SQL_QUERIES.GET_TROOP_TYPE, [
      troopType,
    ]);

    const formattedResult = {
      sante: result.bonus1,
      defense: result.bonus2,
      attaque: result.bonus3,
    };
    return formattedResult;
  }
  async getBonus(type) {
    const [result] = await this.queryMain(SQL_QUERIES.GET_TROOP_TYPE, [type]);
    return result;
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
  async getGuildUserByRole(guildId, roleId) {
    return this.queryMain(SQL_QUERIES.GET_GUILD_USER_BY_ROLE, [
      guildId,
      roleId,
    ]);
  }
  async addClassToUser(userId, guildId, classId) {
    return this.queryMain(SQL_QUERIES.ADD_CLASS_TO_USER, [
      userId,
      guildId,
      classId,
    ]);
  }
  async updateGuildXp(guildId, amount) {
    return this.queryMain(SQL_QUERIES.UPDATE_GUILD_XP, [amount, guildId]);
  }
  async updateClassToUser(userId, guildId, classId) {
    return this.queryMain(SQL_QUERIES.UPDATE_CLASS_TO_USER, [
      userId,
      guildId,
      classId,
    ]);
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
    if (!result.length) {
      return null;
    }
    const powerResult = await this.getPower(userId);
    return { ...result[0], power: powerResult };
  }

  async getPower(userId) {
    const troupeInTraining = await this.getCaserneInfo(userId);
    if (troupeInTraining[0].troopAmount > 0) {
      if (troupeInTraining[0].troopEndTime < Math.round(Date.now() / 1000)) {
        await this.queryMain(SQL_QUERIES.UPDATE_TROOP_AMOUNT, [userId]);
        const troopType = troupeInTraining[0].troopType;
        const troopLevel = troupeInTraining[0].troopLevel;
        const troopAmount = troupeInTraining[0].troopAmount;
        const columnName = `${troopType}Lvl${troopLevel}`;
        const sqlUpdateTroops = `UPDATE troops SET ${columnName} = ${columnName} + ? WHERE discordId = ?`;
        await this.queryMain(sqlUpdateTroops, [troopAmount, userId]);
      }
    }
    const troupeInHealing = await this.getHealing(userId);
    if (troupeInHealing.length > 0) {
      const currentTime = Math.round(Date.now() / 1000);
      if (troupeInHealing[0].troopEndTime < currentTime) {
        const troopTypes = ["archer", "chevalier", "infanterie", "machine"];
        const updateColumns = [];
        const updateParams = [];
        troopTypes.forEach((type) => {
          for (let lvl = 1; lvl <= 5; lvl++) {
            const columnName = `${type}Lvl${lvl}`;
            updateColumns.push(`${columnName} = ${columnName} + ?`);
            updateParams.push(troupeInHealing[0][columnName] || 0);
          }
        });

        updateParams.push(troupeInHealing[0].discordId);

        const updateQuery = `
                UPDATE troops
                SET ${updateColumns.join(", ")}
                WHERE discordId = ?;
            `;

        await this.queryMain(updateQuery, updateParams);
        console.log(
          `Mise à jour effectuée pour la troupe : ${troupeInHealing[0].discordId}`
        );

        const deleteQuery = `
                DELETE FROM hospital_soins
                WHERE discordId = ?;
            `;
        await this.queryMain(deleteQuery, [troupeInHealing[0].discordId]);
      }
    }

    const [detailBatimentLvl] = await this.queryMain(
      SQL_QUERIES.GET_DETAILS_BATIMENT,
      [userId]
    );
    const [detailTroops] = await this.queryMain(
      SQL_QUERIES.GET_DETAILS_TROOPS,
      [userId]
    );

    const allArmyDetails = await this.queryMain(
      SQL_QUERIES.GET_DETAILS_ARMY_TROOPS,
      [userId]
    );

    const [detailBossLvl] = await this.queryMain(SQL_QUERIES.GET_DETAILS_BOSS, [
      userId,
    ]);
    const [detailBoss] = await this.getBossInfo(detailBossLvl.bossId);
    let totalPower = 0;
    totalPower +=
      params.batiment.basePower.caserne * detailBatimentLvl.caserneLevel || 0;
    totalPower +=
      params.batiment.basePower.hopital * detailBatimentLvl.hospitalLevel || 0;
    totalPower +=
      params.batiment.basePower.forge * detailBatimentLvl.forgeLevel || 0;
    const troopWeights = {
      archer: [1, 2, 3, 4, 5],
      chevalier: [1, 2, 3, 4, 5],
      infanterie: [1, 2, 3, 4, 5],
      machine: [1, 2, 3, 4, 5],
    };
    // Helper function to calculate power for a given troop type
    const calculateTroopPower = (troopDetail, troopType) => {
      return troopWeights[troopType].reduce((total, weight, index) => {
        const levelKey = `${troopType}Lvl${index + 1}`;
        const troopCount = troopDetail[levelKey] || 0;
        return total + weight * troopCount;
      }, 0);
    };

    totalPower += calculateTroopPower(detailTroops, "archer");
    totalPower += calculateTroopPower(detailTroops, "chevalier");
    totalPower += calculateTroopPower(detailTroops, "infanterie");
    totalPower += calculateTroopPower(detailTroops, "machine");
    const troopTypes = ["archer", "chevalier", "infanterie", "machine"];
    allArmyDetails.forEach((detailArmyTroops) => {
      troopTypes.forEach((troopType) => {
        totalPower += calculateTroopPower(detailArmyTroops, troopType);
      });
    });

    // Calcul de la puissance des boss
    const typeMultipliers = {
      1: 1, // Commun
      2: 2, // Rare
      3: 3, // Épique
      4: 4, // Légendaire
    };

    const bossMultiplier = typeMultipliers[detailBoss.type] || 1;
    totalPower += detailBossLvl.level * bossMultiplier * 800 || 0;

    return totalPower;
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
    const guildId = await this.getGuildByOwnerId(userId);
    await this.queryMain(SQL_QUERIES.DELETE_GUILD_BY_OWNER_ID, [userId]);
    await this.queryMain(SQL_QUERIES.REMOVE_GUILD_ID_FROM_USER, [
      guildId[0].id,
    ]);
    await this.queryMain(SQL_QUERIES.DELETE_CLASS_BY_GUILD_ID, [guildId[0].id]);
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
  async calculatePowerForAllUsers() {
    const userIdsArray = await this.getAllUserIds();
    const userIds = userIdsArray.map((user) => user.discordId);
    const results = [];
    for (const userId of userIds) {
      try {
        const power = await this.getPower(userId);
        results.push({ userId, power });
      } catch (error) {
        console.error(
          `Erreur lors du calcul de la puissance pour l'utilisateur ${userId}:`,
          error
        );
      }
    }

    const totalPower = results.reduce((sum, result) => sum + result.power, 0);
    results.sort((a, b) => b.power - a.power);
    return {
      totalPower,
      sortedResults: results,
    };
  }

  async getAllUserIds() {
    const users = await this.queryMain(SQL_QUERIES.GET_ALL_USER_IDS);
    return users;
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
    return this.queryMain(SQL_QUERIES.UPDATE_FRAGMENT, [amount, userId]);
  }
  async getAllPower() {
    return this.queryMain(SQL_QUERIES.GET_ALL_POWER);
  }

  async updateBadge(userId, nomBadge) {
    const badgeResult = await this.queryMain(SQL_QUERIES.GET_BADGE_ID_BY_NAME, [
      nomBadge,
    ]);

    const badgeId = badgeResult[0].id;
    await this.queryMain(SQL_QUERIES.INSERT_BADGE_USER, [userId, badgeId]);
  }
  async updateBadgeById(userId, badgeId) {
    await this.queryMain(SQL_QUERIES.INSERT_BADGE_USER, [userId, badgeId]);
  }
  async removeBadgeById(badgeId) {
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

  async generateRandomPower() {
    const random = Math.random() * 100;
    let min, range;

    if (random < 10) {
      min = 5000;
      range = 10000;
    } else if (random < 35) {
      min = 15001;
      range = 15000;
    } else if (random < 60) {
      min = 30001;
      range = 30000;
    } else if (random < 80) {
      min = 60001;
      range = 30000;
    } else if (random < 95) {
      min = 90001;
      range = 30000;
    } else {
      min = 120001;
      range = 30000;
    }
    return Math.floor(Math.random() * range) + min;
  }

  async getMateriauxByRarity(rarity) {
    return this.queryMain(SQL_QUERIES.SELECT_MATERIAUX_BY_RARITY, [rarity]);
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

  async updateMaterialState(userId, materialId, state, bossId, lvl) {
    //! vérifier que boss Id à bien pas 2 matos (pour le state = 1)
    // Vérifier l'état actuel des colonnes muId1 et muId2
    const currentState = await this.queryMain(SQL_QUERIES.GET_CURRENT_STATE, [
      userId,
      bossId,
    ]);
    const muId1 = currentState[0].muId1;
    const muId2 = currentState[0].muId2;

    if (state == 1) {
      // Ajouter le matériau
      if (muId1 == 0) {
        await this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE_ON_BOSS, [
          materialId,
          muId2,
          userId,
          bossId,
        ]);
        await this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE, [
          state,
          materialId,
          userId,
        ]);
      } else if (muId2 == 0) {
        await this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE_ON_BOSS, [
          muId1,
          materialId,
          userId,
          bossId,
        ]);
        await this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE, [
          state,
          materialId,
          userId,
        ]);
      }
    } //!retrait
    else if (state == 0) {
      if (muId1 == materialId && muId2 == materialId) {
      } else if (muId1 == materialId) {
        await this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE_ON_BOSS, [
          0,
          muId2,
          userId,
          bossId,
        ]);

        await this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE, [
          state,
          materialId,
          userId,
        ]);
      } else if (muId2 == materialId) {
        await this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE_ON_BOSS, [
          muId1,
          0,
          userId,
          bossId,
        ]);
        await this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_STATE, [
          state,
          materialId,
          userId,
        ]);
      }
    } else {
      console.log("state bugged !!!!");
    }
  }
  async updateMaterialLevel(userId, idUnique) {
    return this.queryMain(SQL_QUERIES.UPDATE_MATERIAL_LEVEL, [
      idUnique,
      userId,
    ]);
  }
  //---------- Potion
  async insertPotionData(
    userId,
    potionName,
    attaqueBoost,
    defenseBoost,
    santeBoost,
    type,
    powerBoost,
    duration
  ) {
    return this.queryMain(SQL_QUERIES.INSERT_POTION_DATA, [
      userId,
      potionName,
      attaqueBoost,
      defenseBoost,
      santeBoost,
      type,
      powerBoost,
      duration,
    ]);
  }
  async getAllPotionDataForUser(userId) {
    return this.queryMain(SQL_QUERIES.GET_POTION_DATA, [userId]);
  }
  async getAllPotionDataForUserByEtat0(userId) {
    return this.queryMain(SQL_QUERIES.GET_POTION_DATA_BY_ETAT, [userId]);
  }

  async getPotionDataById(id) {
    return this.queryMain(SQL_QUERIES.GET_POTION_DATA_BY_ID, [id]);
  }
  async updatePotionEtat(idPotion, userId, etat) {
    return this.queryMain(SQL_QUERIES.UPDATE_POTION_ETAT, [
      idPotion,
      etat,
      userId,
    ]);
  }
  async deletePotion(userId, idPotion) {
    return this.queryMain(SQL_QUERIES.DELETE_POTION, [userId, idPotion]);
  }
  async updatePotionOwner(newOwner, idPotion) {
    return this.queryMain(SQL_QUERIES.UPDATE_POTION_OWNER, [
      newOwner,
      idPotion,
    ]);
  }
  async updateMateriauxOwner(newOwner, idUnique) {
    return this.queryMain(SQL_QUERIES.UPDATE_MATERIAUX_OWNER, [
      newOwner,
      idUnique,
    ]);
  }
  async updatePotionState(idPotion, etat) {
    return this.queryMain(SQL_QUERIES.UPDATE_POTION_ETAT, [etat, idPotion]);
  }
  async deletePotionById(idPotion) {
    return this.queryMain(SQL_QUERIES.DELETE_POTION, [idPotion]);
  }
  async calculateUpgradePrice(materialId, materiauIdData, userId) {
    const ownedMaterials = await this.getMateriauById(userId);
    const rarityMap = {
      Commun: params.updatePrice.commun,
      Rare: params.updatePrice.rare,
      "Très Rare": params.updatePrice.tresRare,
      Épique: params.updatePrice.epic,
      Legendaire: params.updatePrice.legendaire,
    };

    const typeMultiplierMap = {
      feu: params.updatePrice.feu,
      eau: params.updatePrice.eau,
      terre: params.updatePrice.terre,
      vent: params.updatePrice.vent,
    };

    const typeMultiplier = typeMultiplierMap[materialId.type] || 1;
    const baseRarity = rarityMap[materialId.rarete] || 1;
    const rarity = baseRarity * typeMultiplier;

    const calculLevelPrice = Math.round(
      params.updatePrice.levels *
        (materiauIdData.level + 1) * // Le niveau suivant
        (ownedMaterials.length * 0.57) *
        rarity *
        params.updatePrice.multiplicateur
    );

    return calculLevelPrice;
  }
  async getForgeLvl(userId) {
    return this.queryMain(SQL_QUERIES.GET_FORGE_LVL, [userId]);
  }
  async getCaserneInfo(userId) {
    const result = await this.queryMain(SQL_QUERIES.GET_CASERNE_LVL, [userId]);
    return result;
  }
  async updateForge(userId) {
    return this.queryMain(SQL_QUERIES.UPDATE_FORGE_LVL, [userId]);
  }
  async updateCaserne(userId) {
    return this.queryMain(SQL_QUERIES.UPDATE_CASERNE_LVL, [userId]);
  }
  async updateHospital(userId) {
    return this.queryMain(SQL_QUERIES.UPDATE_HOSPITAL_LVL, [userId]);
  }
  async getHospitalLvl(userId) {
    return this.queryMain(SQL_QUERIES.GET_HOSPITAL_LVL, [userId]);
  }
  async addTraining(userId, troopType, troopLevel, troopAmount, endTime) {
    console.log("addTraining");
    return this.queryMain(SQL_QUERIES.ADD_TRAINING, [
      troopType,
      troopLevel,
      troopAmount,
      endTime,
      userId,
    ]);
  }
  async getTroops(userId, client) {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    const troopsData = await this.queryMain(SQL_QUERIES.GET_TROOPS, [userId]);
    if (troopsData.length === 0) {
      return "Aucune troupe possédée.";
    }

    const troops = troopsData[0];

    const troopNames = {
      archer: "Archer",
      chevalier: "Cavalier",
      machine: "Machine",
      infanterie: "Infanterie",
    };

    // Object to store troops grouped by type
    const groupedTroops = {
      archer: [],
      chevalier: [],
      machine: [],
      infanterie: [],
    };

    // Group troops by type and level
    for (const [key, value] of Object.entries(troops)) {
      if (key !== "discordId" && parseInt(value, 10) > 0) {
        const match = key.match(
          /(archer|chevalier|machine|infanterie)Lvl(\d+)/
        );
        if (match) {
          const troopType = match[1]; // e.g. "archer", "chevalier", etc.
          const troopLevel = match[2]; // e.g. "1", "2", etc.

          // Dynamically get the emoji for the troop type and level
          const troopEmoji = emoji(emo[`${troopType}${troopLevel}`]) || "❓";

          // Add formatted troop information to the grouped troops
          groupedTroops[troopType].push(
            `${troopEmoji} **${value}** Level: **${troopLevel}**`
          );
        }
      }
    }

    // Construct the final message
    const ownedTroops = [];
    for (const [troopType, troopsList] of Object.entries(groupedTroops)) {
      if (troopsList.length > 0) {
        const troopName = troopNames[troopType];
        ownedTroops.push(`**${troopName}** :`);
        ownedTroops.push(...troopsList); // Add each troop level and amount
      }
    }

    // Return the formatted list of troops
    return ownedTroops.length > 0
      ? ownedTroops.join("\n")
      : "Aucune troupe possédée.";
  }
  async getBossInfoArray(selectedBossIds) {
    const bossInfo = await this.queryCampagne(SQL_QUERIES.GET_BOSS_INFO_ARRAY, [
      selectedBossIds,
    ]);
    return bossInfo;
  }
  async getTroopsArray(userId) {
    const result = await this.queryMain(SQL_QUERIES.GET_ALL_TROOPS, [userId]);

    if (result.length === 0) {
      return [];
    }

    const row = result[0];
    const troopArray = [];

    const troopTypes = ["archer", "chevalier", "infanterie", "machine"];
    const maxLevels = 5;

    troopTypes.forEach((type) => {
      for (let level = 1; level <= maxLevels; level++) {
        const key = `${type}Lvl${level}`;
        if (row[key] > 0) {
          troopArray.push({
            name: `${type} Lvl ${level}`,
            quantity: row[key],
          });
        }
      }
    });

    return troopArray;
  }
  async deleteArmy(userId, armyName) {
    return this.queryMain(SQL_QUERIES.DELETE_ARMY, [userId, armyName]);
  }
  async getArmyByName(userId, armyName) {
    return this.queryMain(SQL_QUERIES.GET_ARMY, [userId, armyName]);
  }
  async insertArmyInConstruction(userId, armyName, selectedBossIds) {
    const bossId1 = selectedBossIds[0] || null;
    const bossId2 = selectedBossIds[1] || null;
    return this.queryMain(SQL_QUERIES.INSERT_ARMY_IN_CONSTRUCTION, [
      userId,
      armyName,
      bossId1,
      bossId2,
    ]);
  }
  async calculateMaxCapacity(userId, boss1, boss2) {
    let bonusCapacity = 1;
    let capacityBoss1 = "";
    let capacityBoss2 = "";
    //nésséssite la capa boss de base et le level,
    const [bossInfo1] = await this.getBossInfoByIdUnique(boss1);
    const [bossInfo2] = await this.getBossInfoByIdUnique(boss2);

    if (boss1) {
      const [boss1Info] = await this.getBossInfo(bossInfo1.bossId);

      capacityBoss1 =
        boss1Info.capacity * (bossInfo1.level * 0.6) * bonusCapacity;
    }
    if (boss2) {
      const [boss2Info] = await this.getBossInfo(bossInfo2.bossId);

      capacityBoss2 =
        boss2Info.capacity * (bossInfo2.level * 0.6) * bonusCapacity;
    }
    if (capacityBoss1 > capacityBoss2) {
      return capacityBoss1;
    } else {
      return capacityBoss2;
    }
  }
  async getBossInfoByIdUnique(idUnique) {
    return this.queryMain(SQL_QUERIES.GET_BOSS_INFO_BY_ID_UNIQUE, [idUnique]);
  }
  async getTroopsForArmy(userId, armyName) {
    return this.queryMain(SQL_QUERIES.GET_ARMY, [userId, armyName]);
  }
  async updateArmyWithTroops(userId, armyName, troops) {
    // Commencez par récupérer l'armée en fonction de l'utilisateur et du nom de l'armée
    const army = await this.queryMain(
      "SELECT id FROM user_army WHERE discordId = ? AND nom = ?",
      [userId, armyName]
    );

    if (!army.length) {
      throw new Error(`L'armée ${armyName} n'existe pas.`);
    }

    const armyId = army[0].id;

    // Créer un objet pour stocker les colonnes et valeurs à mettre à jour
    const columnsToUpdate = [];
    const valuesToUpdate = [];

    // Parcourir chaque troupe à mettre à jour
    for (const troop of troops) {
      const { type, quantity } = troop;

      // Créez le nom de colonne en fonction du type et du niveau (ex: "archerLvl1")
      const column = `${type}`;
      columnsToUpdate.push(`${column} = ?`);
      valuesToUpdate.push(quantity);
    }

    // Ajoutez l'ID de l'armée pour la clause WHERE
    valuesToUpdate.push(armyId);

    // Créer la requête SQL pour mettre à jour les colonnes de troupe
    const query = `
      UPDATE user_army
      SET ${columnsToUpdate.join(", ")}
      WHERE id = ?
    `;

    // Exécuter la requête de mise à jour
    await this.queryMain(query, valuesToUpdate);
  }
  async getUserInventory(userId) {
    // Supposons que cette méthode interroge la base de données pour obtenir l'inventaire des troupes du joueur
    const inventory = await this.queryMain(
      `
    SELECT archerLvl1, archerLvl2, archerLvl3, archerLvl4, archerLvl5,
           chevalierLvl1, chevalierLvl2, chevalierLvl3, chevalierLvl4, chevalierLvl5,
           infanterieLvl1, infanterieLvl2, infanterieLvl3, infanterieLvl4, infanterieLvl5,
           machineLvl1, machineLvl2, machineLvl3, machineLvl4, machineLvl5
    FROM troops
    WHERE discordId = ?
  `,
      [userId]
    );

    // Retourner le résultat comme un objet utilisable
    return inventory[0];
  }

  async updateUserTroops(userId, troopType, troopLevel, troopAmount) {
    // Mettre à jour la quantité de troupes pour un utilisateur
    return this.queryMain(
      `
    UPDATE troops
    SET ${troopType}Lvl${troopLevel} = ${troopType}Lvl${troopLevel} + ?
    WHERE discordId = ?
  `,
      [troopAmount, userId]
    );
  }
  async updateUserArmy(userId, armyName, troopType, level, quantityValue) {
    // Mettre à jour la quantité de troupes pour un utilisateur
    const column = `${troopType}Lvl${level}`;
    return this.queryMain(
      `
    UPDATE user_army
    SET ${column} = ${column} +?
    WHERE discordId = ? AND nom = ?
  `,
      [quantityValue, userId, armyName]
    );
  }
  async getTroopToHeal(userId) {
    return this.queryMain(SQL_QUERIES.GET_TROOP_TO_HEAL, [userId]);
  }
  async getTroopHealing(userId) {
    return this.queryMain(SQL_QUERIES.GET_TROOP_HEALING, [userId]);
  }
  async startTroopHealing(userId, totalHealingTime, typeTroupe = null) {
    const currentTime = Math.floor(Date.now() / 1000); // Timestamp actuel en secondes
    const endTime = currentTime + totalHealingTime; // Timestamp de fin de soin

    // Requête pour récupérer les troupes dans l'hôpital
    let query;
    let queryParams = [userId];

    // Si `typeTroupe` est null, on soigne toutes les troupes
    if (typeTroupe === null) {
      query = `
            SELECT *
            FROM hospital
            WHERE discordId = ?;
        `;
    } else {
      // Sinon, on soigne seulement le type de troupe spécifié
      query = `
            SELECT *
            FROM hospital
            WHERE discordId = ?
            AND (${typeTroupe}Lvl1 > 0 OR ${typeTroupe}Lvl2 > 0 OR ${typeTroupe}Lvl3 > 0 OR ${typeTroupe}Lvl4 > 0 OR ${typeTroupe}Lvl5 > 0);
        `;
    }

    // Exécuter la requête pour obtenir les troupes présentes dans l'hôpital
    const troopsInHospital = await this.queryMain(query, queryParams);

    if (!troopsInHospital.length) {
      return "Aucune troupe à soigner.";
    }

    // Préparer les données pour l'insertion dans `hospital_soins`
    const healingEntries = {};

    for (const row of troopsInHospital) {
      const troopTypes = ["archer", "chevalier", "infanterie", "machine"];

      troopTypes.forEach((troopType) => {
        for (let lvl = 1; lvl <= 5; lvl++) {
          const columnName = `${troopType}Lvl${lvl}`;
          const troopCount = row[columnName];

          if (
            troopCount > 0 &&
            (typeTroupe === null || troopType === typeTroupe)
          ) {
            // Si la clé n'existe pas encore, on l'initialise
            if (!healingEntries[columnName]) {
              healingEntries[columnName] = 0;
            }
            // Ajouter le nombre de troupes à soigner pour cette colonne
            healingEntries[columnName] += troopCount;
          }
        }
      });
    }

    if (Object.keys(healingEntries).length > 0) {
      const typesToInsert =
        typeTroupe === null
          ? ["archer", "chevalier", "infanterie", "machine"]
          : [typeTroupe];

      // Ajustez la requête pour l'insertion
      const insertColumns = typesToInsert
        .map((t) => `${t}Lvl1, ${t}Lvl2, ${t}Lvl3, ${t}Lvl4, ${t}Lvl5`)
        .join(", ");
      const insertValues = typesToInsert
        .map((t) => {
          return [
            healingEntries[`${t}Lvl1`] || 0,
            healingEntries[`${t}Lvl2`] || 0,
            healingEntries[`${t}Lvl3`] || 0,
            healingEntries[`${t}Lvl4`] || 0,
            healingEntries[`${t}Lvl5`] || 0,
          ];
        })
        .flat();

      // Remplacez `?` par le bon nombre de valeurs
      const insertQuery = `
        INSERT INTO hospital_soins (discordId, troopEndTime ${insertColumns})
        VALUES (?,? ${insertValues.map(() => "?").join(", ")})
        ON DUPLICATE KEY UPDATE
        ${typesToInsert
          .map(
            (t) =>
              `${t}Lvl1 = ${t}Lvl1 + VALUES(${t}Lvl1), 
                ${t}Lvl2 = ${t}Lvl2 + VALUES(${t}Lvl2), 
                ${t}Lvl3 = ${t}Lvl3 + VALUES(${t}Lvl3), 
                ${t}Lvl4 = ${t}Lvl4 + VALUES(${t}Lvl4), 
                ${t}Lvl5 = ${t}Lvl5 + VALUES(${t}Lvl5)`
          )
          .join(", ")}
    `;

      // Ajoutez discordId aux paramètres d'insertion
      const insertParams = [userId, endTime, ...insertValues];

      await this.queryMain(insertQuery, insertParams);

      // Mettre à jour les colonnes correspondantes dans la table hospital pour mettre à 0 les troupes soignées
      const updateColumns = typesToInsert
        .map(
          (t) => `
                ${t}Lvl1 = ${t}Lvl1 - ${healingEntries[`${t}Lvl1`] || 0}, 
                ${t}Lvl2 = ${t}Lvl2 - ${healingEntries[`${t}Lvl2`] || 0}, 
                ${t}Lvl3 = ${t}Lvl3 - ${healingEntries[`${t}Lvl3`] || 0}, 
                ${t}Lvl4 = ${t}Lvl4 - ${healingEntries[`${t}Lvl4`] || 0}, 
                ${t}Lvl5 = ${t}Lvl5 - ${healingEntries[`${t}Lvl5`] || 0}`
        )
        .join(", ");

      const updateQuery = `
            UPDATE hospital
            SET ${updateColumns}
            WHERE discordId = ?;
        `;

      // Ajoute discordId aux paramètres de mise à jour
      const updateParams = [userId];

      await this.queryMain(updateQuery, updateParams);
    } else {
      console.log("Aucune troupe à soigner.");
      return;
    }
  }
  async getHealing(userId) {
    return this.queryMain(SQL_QUERIES.GET_HEALING, [userId]);
  }
}

module.exports = DatabaseManager;
