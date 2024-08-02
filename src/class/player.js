const param = require("../jsons/param.json");
const DatabaseManager = require("./dbManager");
const sqlQueries = require("./sqlQueriesPlayer");
const { pool, poolBo, poolCampagne } = require("../db");
const { pool, poolBo, poolCampagne } = require("../db");
const duelMessages = require(`../jsons/gif.json`);
const emo = require(`../jsons/emoji.json`);

class Player extends DatabaseManager {
  constructor() {
    super(pool, poolBo);
    super(pool, poolBo);
    this.userId = null;
    this.stats = null;
    this.materiaux = null;
  }

  async userExists(userId) {
    const [result] = await pool.query(sqlQueries.userExists, [userId]);

    return result;
  }

  async getStatsById(userId) {
    const [result] = await pool.query(sqlQueries.getUserPower, [userId]);
    if (!result[0]) {
      throw new Error(`User with discordId ${userId} not found`);
    }
    const powerUser = result[0].power;
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
    const playerStats = await this.getStatsById(id);

    const score =
      param.facteurPower * playerStats.power * param.facteurPower +
      param.facteurAttaque * playerStats.attaque * param.facteurAttaque +
      param.facteurDefense * playerStats.defense * param.facteurDefense +
      param.facteurSante * playerStats.sante * param.facteurSante;

    return score;
  }

  async calculateFightScoreBattle(userId, opponentId, duelId) {
    const playerStats = await this.getStatsById(userId);
    const opponentStats = await this.getStatsById(opponentId);

    let playerScore =
      param.facteurPower * playerStats.power * param.facteurPower +
      param.facteurAttaque * playerStats.attaque * param.facteurAttaque +
      param.facteurDefense * playerStats.defense * param.facteurDefense +
      param.facteurSante * playerStats.sante * param.facteurSante;

    let opponentScore =
      param.facteurPower * opponentStats.power * param.facteurPower +
      param.facteurAttaque * opponentStats.attaque * param.facteurAttaque +
      param.facteurDefense * opponentStats.defense * param.facteurDefense +
      param.facteurSante * opponentStats.sante * param.facteurSante;

    const playerMaterials = await this.getMaterialsById(userId, duelId);
    const opponentMaterials = await this.getMaterialsById(opponentId, duelId);

    const playerTypes = playerMaterials.map((m) => m.type);
    const opponentTypes = opponentMaterials.map((m) => m.type);
    playerTypes.forEach((playerType) => {
      opponentTypes.forEach((opponentType) => {
        const playerBonus = param.types[playerType]?.bonus[opponentType] || 1;
        const playerMalus = param.types[playerType]?.malus[opponentType] || 1;
        const opponentBonus = param.types[opponentType]?.bonus[playerType] || 1;
        const opponentMalus = param.types[opponentType]?.malus[playerType] || 1;

        playerScore *= playerBonus * playerMalus;
        opponentScore *= opponentBonus * opponentMalus;
      });
    });
    return { playerScore, opponentScore };
  }

  async calculateWinChance(userId, opponentId) {
    const { playerScore, opponentScore } = await this.calculateFightScoreBattle(
      userId,
      opponentId
    );

    const totalScore = playerScore + opponentScore;
    const playerWinChance = playerScore / totalScore;
    const opponentWinChance = opponentScore / totalScore;
    return { playerWinChance, opponentWinChance };
  }

  async getWinner(playerWinChance, opponentWinChance, userId, opponentId) {
    const playerRandom = Math.random();
    const opponentRandom = Math.random();
    const playerAdjustedWinChance =
      playerWinChance + playerRandom * param.randomFactor;
    const opponentAdjustedWinChance =
      opponentWinChance + opponentRandom * param.randomFactor;
    const diff = Math.abs(playerAdjustedWinChance - opponentAdjustedWinChance);

    if (diff < 0.04) {
      return null;
    } else {
      return playerAdjustedWinChance > opponentAdjustedWinChance
        ? userId
        : opponentId;
    }
  }

  async fightBattle(userId, opponentId) {
    await pool.query(sqlQueries.insertDuel);
    const [rows] = await pool.query(sqlQueries.getLastInsertId);
    const duelId = rows[0].duel_id;

    await pool.query(sqlQueries.insertDuelDetails, [duelId, userId]);
    await pool.query(sqlQueries.insertDuelDetails, [duelId, opponentId]);
    await pool.query(sqlQueries.insertDuelDetails, [duelId, userId]);
    await pool.query(sqlQueries.insertDuelDetails, [duelId, opponentId]);

    const { playerScore, opponentScore } = await this.calculateFightScoreBattle(
      userId,
      opponentId,
      duelId
    );

    const totalScore = playerScore + opponentScore;
    const playerWinChance = playerScore / totalScore;
    const opponentWinChance = opponentScore / totalScore;

    const winner = await this.getWinner(
      playerWinChance,
      opponentWinChance,
      userId,
      opponentId
    );
    if (winner === null) {
      await pool.query(sqlQueries.updateDuelDetailsDraw, [duelId]);
      await pool.query(sqlQueries.updateDuelDetailsDraw, [duelId]);
    } else if (winner === userId) {
      await pool.query(sqlQueries.updateDuelDetailsWin, [1, userId, duelId]);
      await pool.query(sqlQueries.updateUserWinCounter, [userId]);
      await pool.query(sqlQueries.updateUserLoseCounter, [opponentId]);
      await pool.query(sqlQueries.updateDuelDetailsWin, [1, userId, duelId]);
      await pool.query(sqlQueries.updateUserWinCounter, [userId]);
      await pool.query(sqlQueries.updateUserLoseCounter, [opponentId]);
    } else if (winner === opponentId) {
      await pool.query(sqlQueries.updateDuelDetailsWin, [
        1,
        opponentId,
        duelId,
      ]);
      await pool.query(sqlQueries.updateUserWinCounter, [opponentId]);
      await pool.query(sqlQueries.updateUserLoseCounter, [userId]);
      await pool.query(sqlQueries.updateDuelDetailsWin, [
        1,
        opponentId,
        duelId,
      ]);
      await pool.query(sqlQueries.updateUserWinCounter, [opponentId]);
      await pool.query(sqlQueries.updateUserLoseCounter, [userId]);
    }
    return [winner, duelId];
  }

  async getMateriaux(userId) {
    const [result] = await pool.query(sqlQueries.getMateriaux, [userId]);
    if (result.length === 0) {
      this.materiaux = [];
    } else {
      this.materiaux = result.map((row) => row.materiauId);
    }
    return this.materiaux;
  }

  async calculateStats(power, userId) {
    let sante =
      param.santeBase *
      Math.pow(power / param.powerBase, param.facteurSante / 5);
    let defense =
      param.defenseBase *
      Math.pow(power / param.powerBase, param.facteurDefense / 6);
    let attaque =
      param.attaqueBase *
      Math.pow(power / param.powerBase, param.facteurAttaque / 6);

    const materiauxResult = await this.getMaterialsById(userId, null);
    if (materiauxResult.length === 0) {
      sante = Math.round(sante);
      defense = Math.round(defense);
      attaque = Math.round(attaque);
      return { sante, defense, attaque, power };
    } else {
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

  async getMaterialsById(userId, duelId) {
    const [result] = await pool.query(sqlQueries.getMaterialsById, [userId]);

    if (duelId !== null) {
      const materialIds = result.map((material) => material.id);
      await this.insertMaterialsIntoDuelDetail(duelId, userId, materialIds);
    }
    return result;
  }

  async getMaterialsStringSelect(userId, etat, withId = false) {
    const materials =
      etat === 1
        ? await this.getMaterialsById(userId)
        : await this.getMaterialsByIdEtat0(userId);
    const materialStrings = materials.map(
      (material) =>
        `${emo[material.nom]}_${material.nom}_${material.materiauLevel}_${
          material.idMateriau
        }`
    );
    return materialStrings.join("\n");
  }

  async getMaterialsStringMessage(userId) {
    const materiaux = await this.getMaterialsById(userId);

    if (materiaux.length === 0) {
      return [];
    }

    const materiauxArray = materiaux.map((materiau) => {
      let bonusSante = materiau.santeBoost;
      let bonusAttaque = materiau.attaqueBoost;
      let bonusDefense = materiau.defenseBoost;

      const levelBonus = param.level[materiau.materiauLevel] / 10;
      if (bonusSante > 0) {
        bonusSante += levelBonus;
      } else if (bonusAttaque > 0) {
        bonusAttaque += levelBonus;
      } else if (bonusDefense > 0) {
        bonusDefense += levelBonus;
      }

      return {
        emoji: emo[materiau.nom],
        nom: materiau.nom,
        lvl: materiau.materiauLevel,
        rarete: materiau.rarete,
        type: materiau.type,
        bonusSante,
        bonusAttaque,
        bonusDefense,
      };
    });
    return materiauxArray;
  }

  async getMaterialsByIdEtat0(userId) {
    const [result] = await pool.query(sqlQueries.getMaterialsByIdEtat0, [
      userId,
    ]);
    return result || [];
  }
  async getMaterialsByIdEtat1(userId) {
    const [result] = await pool.query(sqlQueries.getMaterialsByIdEtat1, [
      userId,
    ]);
    return result || [];
  }

  async insertMaterialsIntoDuelDetail(duelId, userId, materialIds) {
    const [materialId1, materialId2, materialId3, materialId4] = materialIds;
    await pool.query(sqlQueries.insertMaterialsIntoDuelDetail, [
      materialId1,
      materialId2,
      materialId3,
      materialId4,
      duelId,
      userId,
    ]);
    await pool.query(sqlQueries.insertMaterialsIntoDuelDetail, [
      materialId1,
      materialId2,
      materialId3,
      materialId4,
      duelId,
      userId,
    ]);
  }
  async getRandomMessage(stage) {
    const messages = duelMessages.duelMessages[stage];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  async duelProgress(
    message,
    userName,
    membre,
    winner,
    duelId,
    userId,
    parisWin,
    parisDraw
  ) {
    const progressMessages = ["combat", "progression", "progression"];

    for (let i = 0; i < progressMessages.length; i++) {
      setTimeout(async () => {
        await message.edit({
          content: `- __${userName} :__ *${await this.getRandomMessage(
            progressMessages[i]
          )}*\n- __${membre.username} :__ *${await this.getRandomMessage(
            progressMessages[i]
          )}*`,
        });
        if (i === progressMessages.length - 1) {
          setTimeout(async () => {
            if (winner !== null) {
              if (winner === userId) {
                await message.edit({
                  content: `- <@${winner}> :*${await this.getRandomMessage(
                    "finV"
                  )}*\n- <@${membre.id}> : *${await this.getRandomMessage(
                    "finL"
                  )}*`,
                });
              } else if (winner === membre.id) {
                await message.edit({
                  content: `- <@${winner}> :*${await this.getRandomMessage(
                    "finV"
                  )}*\n- <@${userId}> : *${await this.getRandomMessage(
                    "finL"
                  )}*`,
                });
              }
            } else {
              await message.edit({
                content: `- <@${membre.id}> :*${await this.getRandomMessage(
                  "finDJ1"
                )}*\n- <@${userId}> : *${await this.getRandomMessage(
                  "finDJ2"
                )}*`,
              });
            }
            setTimeout(async () => {
              if (winner) {
                await message.edit(
                  `Vous avez gagné <@${winner}> bravo ! ID du duel: ${duelId} Gain : ${parisWin}`
                );
                /// Ajouter les détails des requêtes ici
              } else {
                await message.edit(
                  `Le duel s'est terminé par une égalité, ça arrive ! Récompense : ${parisDraw}`
                );
              }
            }, 6500);
          }, 6500);
        }
      }, i * 6500);
    }
  }

  async rarete(rarete) {
    if (rarete === "Commun") {
      return "⚪";
    } else if (rarete === "Rare") {
      return "🔵";
    } else if (rarete === "Très Rare") {
      return "🟠";
    } else if (rarete === "Épique") {
      return "🟣";
    } else if (rarete === "Legendaire") {
      return "🟡";
    }
  }

  async randomBox() {
    const material = await this.getMateriau();
    let numberOfMaterials;
    const randomValue = Math.random();
    if (randomValue < 0.6) {
      numberOfMaterials = 1; // 60% de chance
    } else if (randomValue < 0.9) {
      numberOfMaterials = 2; // 30% de chance
    } else {
      numberOfMaterials = 3; // 10% de chance
    }
    const selectedMaterials = [];
    for (let i = 0; i < numberOfMaterials; i++) {
      const randomIndex = Math.floor(Math.random() * material.length);
      selectedMaterials.push(material[randomIndex]);
    }

    return selectedMaterials;
  }
  async dayliBox() {
    const material = await this.getMateriau();
    const selectedMaterial = await this.selectRandomMaterial(material, "dayli");
    let dayPower = await this.generateRandomPower();
    Math.floor((dayPower = dayPower / 3));
    return { dayMaterial: selectedMaterial, dayPower };
  }
  async freeDayliBox(userId) {
    const material = await this.getMateriau();
    const selectedMaterial = await this.selectRandomMaterial(
      material,
      "freeDayli"
    );
    let power = await this.generateRandomPower();
    power = Math.floor(power / 5);
    return { userId, material: selectedMaterial, power };
  }

  async selectRandomMaterial(materials, boxType) {
    let rarityWeights;

    const probabilities = {
      freeDayli: 0.85, // 85% de chances de ne pas obtenir de matériau
      freeDayli: 0.85, // 85% de chances de ne pas obtenir de matériau
      random: 0, // 0% de chances de ne pas obtenir de matériau
      dayli: 0.4, // 40% de chances de ne pas obtenir de matériau
      dayli: 0.4, // 40% de chances de ne pas obtenir de matériau
    };

    const randomValue = Math.random();
    if (randomValue < probabilities[boxType]) {
      return null;
    }

    switch (boxType) {
      case "randomBox":
        rarityWeights = {
          Legendaire: 5,
          Épique: 10,
          "Très Rare": 15,
          Rare: 30,
          Commun: 40,
        };
        break;
      case "dayliBox":
        rarityWeights = {
          Legendaire: 3,
          Épique: 7,
          "Très Rare": 15,
          Rare: 25,
          Commun: 50,
        };
        break;
      case "freeDayli":
        rarityWeights = {
          Legendaire: 1,
          Épique: 5,
          "Très Rare": 10,
          Rare: 20,
          Commun: 64,
        };
        break;
      default:
        rarityWeights = {
          Legendaire: 5,
          Épique: 10,
          "Très Rare": 15,
          Rare: 30,
          Commun: 40,
        };
    }

    const weightedMaterials = materials.flatMap((material) =>
      Array(rarityWeights[material.rarete]).fill(material)
    );

    const randomIndex = Math.floor(Math.random() * weightedMaterials.length);
    return weightedMaterials[randomIndex];
  }
}

module.exports = Player;
