const param = require("../jsons/param.json");
const DatabaseManager = require("./dbManager");
const sqlQueries = require("./sqlQueriesPlayer");
const { connection } = require("../db");
const duelMessages = require(`../jsons/gif.json`);

class Player extends DatabaseManager {
  constructor() {
    super();
    this.userId = null;
    this.stats = null;
    this.materiaux = null;
    this.connection = connection;
  }

  async getStatsById(userId) {
    const [result] = await this.connection
      .promise()
      .query(sqlQueries.getUserPower, [userId]);
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

    if (diff < 0.05) {
      return null;
    } else {
      return playerAdjustedWinChance > opponentAdjustedWinChance
        ? userId
        : opponentId;
    }
  }

  async fightBattle(userId, opponentId) {
    await this.connection.promise().query(sqlQueries.insertDuel);
    const [rows] = await this.connection
      .promise()
      .query(sqlQueries.getLastInsertId);
    const duelId = rows[0].duel_id;

    await this.connection
      .promise()
      .query(sqlQueries.insertDuelDetails, [duelId, userId]);
    await this.connection
      .promise()
      .query(sqlQueries.insertDuelDetails, [duelId, opponentId]);

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
      await this.connection
        .promise()
        .query(sqlQueries.updateDuelDetailsDraw, [duelId]);
    } else if (winner === userId) {
      await this.connection
        .promise()
        .query(sqlQueries.updateDuelDetailsWin, [1, userId, duelId]);
      await this.connection
        .promise()
        .query(sqlQueries.updateUserWinCounter, [userId]);
      await this.connection
        .promise()
        .query(sqlQueries.updateUserLoseCounter, [opponentId]);
    } else if (winner === opponentId) {
      await this.connection
        .promise()
        .query(sqlQueries.updateDuelDetailsWin, [1, opponentId, duelId]);
      await this.connection
        .promise()
        .query(sqlQueries.updateUserWinCounter, [opponentId]);
      await this.connection
        .promise()
        .query(sqlQueries.updateUserLoseCounter, [userId]);
    }
    return [winner, duelId];
  }

  async getMateriaux(userId) {
    const [result] = await this.connection
      .promise()
      .query(sqlQueries.getMateriaux, [userId]);
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
    const [result] = await this.connection
      .promise()
      .query(sqlQueries.getMaterialsById, [userId]);

    if (duelId !== null) {
      const materialIds = result.map((material) => material.id);
      await this.insertMaterialsIntoDuelDetail(duelId, userId, materialIds);
    }
    return result;
  }

  async insertMaterialsIntoDuelDetail(duelId, userId, materialIds) {
    const [materialId1, materialId2, materialId3, materialId4] = materialIds;
    await this.connection
      .promise()
      .query(sqlQueries.insertMaterialsIntoDuelDetail, [
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
}

module.exports = Player;
