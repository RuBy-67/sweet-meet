const param = require("../jsons/param.json");
const DatabaseManager = require("./dbManager");
const sqlQueries = require("./sqlQueriesPlayer");
const { pool } = require("../db");
const duelMessages = require(`../jsons/gif.json`);
const emo = require(`../jsons/emoji.json`);

class Player extends DatabaseManager {
  constructor() {
    super(pool);
    this.userId = null;
    this.stats = null;
    this.materiaux = null;
  }

  async getStatsById(userId) {
    const result = await this.getStats(userId);
    console.log(result);

    const powerUser = result.power;
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
    let opponentScore = await this.calculateFightScore(opponentId);
    let playerScore = await this.calculateFightScore(userId);

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
    await (async () => {
      if (winner === null) {
        await this.queryMain(sqlQueries.updateDuelDetailsDraw, [duelId]);
      } else {
        await this.queryMain(sqlQueries.updateDuelDetailsWin, [
          1,
          winner,
          duelId,
        ]);
        await this.queryMain(sqlQueries.updateUserWinCounter, [winner]);
        await this.queryMain(sqlQueries.updateUserLoseCounter, [
          winner === userId ? opponentId : userId,
        ]);
      }
    })();
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

      const potionBonus = await this.getPotionByEtat(userId);

      if (potionBonus) {
        potionBonus.forEach((potion) => {
          sante += potion.santeBoost;
          defense += potion.defenseBoost;
          attaque += potion.attaqueBoost;
        });
      }

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
    const updateMessage = async (content) => {
      await message.edit({ content });
    };
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    for (let i = 0; i < progressMessages.length; i++) {
      const content = `- __${userName} :__ *${await this.getRandomMessage(
        progressMessages[i]
      )}*\n- __${membre.username} :__ *${await this.getRandomMessage(
        progressMessages[i]
      )}*`;
      await updateMessage(content);
      await delay(6500);
    }
    let finalMessage;
    if (winner !== null) {
      const winnerMessage = `- <@${winner}> :*${await this.getRandomMessage(
        "finV"
      )}*`;
      const loserMessage = `- <@${
        winner === userId ? membre.id : userId
      }> : *${await this.getRandomMessage("finL")}*`;
      finalMessage = `${winnerMessage}\n${loserMessage}`;
    } else {
      finalMessage = `- <@${membre.id}> :*${await this.getRandomMessage(
        "finDJ1"
      )}*\n- <@${userId}> : *${await this.getRandomMessage("finDJ2")}*`;
    }

    await delay(6500);
    await updateMessage(finalMessage);
    await delay(6500);
    const resultMessage = winner
      ? `Vous avez gagné <@${winner}> bravo ! ID du duel: ${duelId} Gain : ${parisWin}`
      : `Le duel s'est terminé par une égalité, ça arrive ! Récompense : ${parisDraw}`;

    await updateMessage(resultMessage);
  }

  async randomBox() {
    const materials = await this.getMateriau();
    const randomValue = Math.random();
    const numberOfMaterials = randomValue < 0.6 ? 1 : randomValue < 0.9 ? 2 : 3;

    const selectedMaterials = Array.from(
      { length: numberOfMaterials },
      () => materials[Math.floor(Math.random() * materials.length)]
    );

    return selectedMaterials;
  }

  async dayliBox() {
    const materials = await this.getMateriau();
    const selectedMaterial = await this.selectRandomMaterial(
      materials,
      "dayli"
    );
    const dayPower = Math.floor((await this.generateRandomPower()) / 3);
    return { dayMaterial: selectedMaterial, dayPower };
  }
  async freeDayliBox(userId) {
    const materials = await this.getMateriau();
    const selectedMaterial = await this.selectRandomMaterial(
      materials,
      "freeDayli"
    );
    const power = Math.floor((await this.generateRandomPower()) / 6);
    return { userId, material: selectedMaterial, power };
  }

  async selectRandomMaterial(materials, boxType) {
    const probabilities = {
      freeDayli: 0.5,
      random: 0,
      dayli: 0.2,
    };

    if (Math.random() < probabilities[boxType]) {
      return null;
    }

    const rarityWeights = {
      randomBox: {
        Legendaire: 10,
        Épique: 15,
        "Très Rare": 17,
        Rare: 23,
        Commun: 35,
      },
      dayliBox: {
        Legendaire: 10,
        Épique: 15,
        "Très Rare": 17,
        Rare: 20,
        Commun: 38,
      },
      freeDayli: {
        Legendaire: 10,
        Épique: 13,
        "Très Rare": 20,
        Rare: 25,
        Commun: 40,
      },
    }[boxType] || {
      Legendaire: 5,
      Épique: 10,
      "Très Rare": 15,
      Rare: 30,
      Commun: 40,
    };

    const weightedMaterials = materials.flatMap((material) =>
      Array(rarityWeights[material.rarete] || 0).fill(material)
    );

    return (
      weightedMaterials[Math.floor(Math.random() * weightedMaterials.length)] ||
      null
    );
  }
  async getPotionByEtat(userId) {
    const [result] = await pool.query(sqlQueries.getPotionByEtat, [userId, 1]);
    return result;
  }
}

module.exports = Player;
