const param = require("../jsons/param.json");
const DatabaseManager = require("./dbManager");
const { connection } = require("../db");
const { stat } = require("fs");
const { stringify } = require("querystring");

class Player extends DatabaseManager {
  constructor() {
    super();
    this.userId = null;
    this.stats = null;
    this.materiaux = null;
    this.connection = connection;
  }

  async getStatsById(userId) {
    const result = await this.connection
      .promise()
      .query("SELECT power FROM user WHERE discordId = ?", [userId]);
    const powerUser = result[0][0].power;
    const statsADS = await this.calculateStats(powerUser, userId);

    this.stats = {
      power: powerUser,
      sante: statsADS.sante,
      defense: statsADS.defense,
      attaque: statsADS.attaque,
    };
    return this.stats;
  }
  async calculateFightScore(id) {
    const playerStats = await id.getStats();
    const facteurSante = param.facteurSante;
    const facteurDefense = param.facteurDefense;
    const facteurAttaque = param.facteurAttaque;
    const facteurPower = param.facteurPower;

    const score =
      facteurPower * playerStats.power * facteurPower +
      facteurAttaque * playerStats.attaque * facteurAttaque +
      facteurDefense * playerStats.defense * facteurDefense +
      facteurSante * playerStats.sante * facteurSante;

    return score;
  }
  async calculateWinChance(score1, score2) {
    const winChance = score1 / (score1 + score2);

    return winChance;
  }

  async calculateFight(chance) {}

  async getMateriaux(userId) {
    if (this.materiaux) {
      return this.materiaux;
    }

    const result = await connection
      .promise()
      .query("SELECT * FROM materiau_user WHERE idUser = ?", [userId]);

    if (result.length === 0) {
      this.materiaux = [];
    } else {
      this.materiaux = result.map((row) => row.materiauId);
    }

    return this.materiaux;
  }

  async calculateStats(power, userId) {
    // Fight stats calculation
    let sante =
      param.santeBase *
      Math.pow(power / param.powerBase, param.facteurSante / 5);
    let defense =
      param.defenseBase *
      Math.pow(power / param.powerBase, param.facteurDefense / 6);
    let attaque =
      param.attaqueBase *
      Math.pow(power / param.powerBase, param.facteurAttaque / 6);

    // Get user's materiaux
    const [materiauxResult] = await connection
      .promise()
      .query(
        "SELECT m.*, mu.lvl AS materiauLevel FROM materiau m JOIN materiau_user mu ON m.id = mu.IdMateriau WHERE mu.idUser = ?",
        [userId]
      );
    if (materiauxResult.length === 0) {
      sante = Math.round(sante);
      defense = Math.round(defense);
      attaque = Math.round(attaque);
      return { sante, defense, attaque, power };
    } else {
      //add materiaux bonus
      materiauxResult.forEach((materiaux) => {
        const level = materiaux.materiauLevel;
        const levelBonus = parseInt(param.level[level]);
        sante *= (materiaux.santeBoost / 100) * (1 + levelBonus / 100) + 1;
        defense *= (materiaux.defenseBoost / 100) * (1 + levelBonus / 100) + 1;
        attaque *= (materiaux.attaqueBoost / 100) * (1 + levelBonus / 100) + 1;
      });

      sante = Math.round(sante);
      defense = Math.round(defense);
      attaque = Math.round(attaque);
      return { sante, defense, attaque, power };
    }
  }
}
module.exports = Player;
