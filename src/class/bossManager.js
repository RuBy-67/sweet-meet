const param = require("../jsons/param.json");
const { EmbedBuilder } = require("discord.js");
const DatabaseManager = require("./dbManager");
const sqlQueriesBoss = require("./sqlQueriesBoss");
const { pool, poolCampagne } = require("../db");
const duelMessages = require(`../jsons/gif.json`);
const emo = require(`../jsons/emoji.json`);
const dialog = require(`../jsons/dialogueBoss.json`);
const player = require(`./player`);
const playerManager = new player();
const dialogJoueur = require(`../jsons/gif.json`);
const dbManager = new DatabaseManager();

class Boss extends DatabaseManager {
  constructor() {
    super(pool, poolCampagne);
    this.userId = null;
    this.stats = null;
    this.materiaux = null;
  }
  async getInfoBossById(id) {
    const result = await this.queryCampagne(sqlQueriesBoss.getInfoBossById, [
      id,
    ]);
    return result[0];
  }

  async getBosses() {
    const result = await this.queryCampagne(sqlQueriesBoss.getBosses);
    return result;
  }
  async startDuel(
    userId,
    bossInfo,
    difficulty,
    i,
    recompenseD,
    recompenseV,
    Embedcolors,
    client,
    factor
  ) {
    const playerStats = await playerManager.getStatsById(userId); //playerStats.power playerStats.defense playerStats.attaque playerStats.sante
    let attaque = bossInfo.attaque * factor;
    let defense = bossInfo.defense * factor;
    let sante = bossInfo.sante * factor;
    const multiplicateur = Math.random() * (15 - 1.5) + 1.5;
    let power = Math.round((attaque + defense + sante) * multiplicateur); // inconue du joueurs
    const playerScore = await this.getFightScore(
      playerStats.attaque,
      playerStats.defense,
      playerStats.sante,
      playerStats.power
    );
    let bossScore = await this.getFightScore(attaque, defense, sante, power);
    //bossScore = bossScore * 0.22;
    const winner = await this.calculateWinner(playerScore, bossScore);
    await this.bossDialogue(
      userId,
      i,
      winner,
      Embedcolors,
      bossInfo,
      client,
      recompenseV,
      recompenseD,
      bossScore,
      playerScore
    );

    return;
  }
  async getFightScore(attaque, defense, sante, power) {
    const fightScore =
      param.facteurPower * power * param.facteurPower +
      param.facteurAttaque * attaque * param.facteurAttaque +
      param.facteurDefense * defense * param.facteurDefense +
      param.facteurSante * sante * param.facteurSante;

    return fightScore;
  }
  async calculateWinner(playerScore, bossScore) {
    const totalScore = playerScore + bossScore;
    const playerWinChance = playerScore / totalScore;
    const bossWinChance = bossScore / totalScore;
    const playerRnd = Math.random();
    const bossRnd = Math.random();
    const playerAdjustedWinChance =
      playerWinChance + playerRnd * param.randomFactor;
    const bossAdjustedWinChance = bossWinChance + bossRnd * param.randomFactor;
    const diff = Math.abs(playerAdjustedWinChance - bossAdjustedWinChance);

    if (diff < 0.02) {
      return "equal";
    } else if (playerAdjustedWinChance > bossAdjustedWinChance) {
      return true;
    } else {
      return false;
    }
  }
  async bossDialogue(
    userId,
    i,
    winner,
    Embedcolors,
    bossInfo,
    client,
    recompenseV,
    recompenseD,
    bossScore,
    playerScore
  ) {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const phases = ["start", "battle", "end"];
    const bossId = bossInfo.id;
    const bossName = bossInfo.nom;
    const bossName2 = bossInfo.nom.split(",")[0];
    const userName = i.user.username;
    let currentPhaseIndex = 0;
    let dialogueHistory = "";

    function getRndPhrase(bossId, phase, winner) {
      let phrases;

      if (phase === "end") {
        console.log(winner);
        if (winner === "equal") {
          phrases = dialog.bosses[bossId][phase]["tie"];
        } else if (winner) {
          phrases = dialog.bosses[bossId][phase]["lose"];
        } else if (!winner) {
          phrases = dialog.bosses[bossId][phase]["win"];
        }
      } else {
        phrases = dialog.bosses[bossId][phase];
      }
      if (!phrases) {
        return "Dialogue not found!";
      }

      const keys = Object.keys(phrases);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      return phrases[randomKey];
    }

    function getRandomAbility(bossId) {
      const abilityList = dialog.habilite[bossId];
      const keys = Object.keys(abilityList);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      return abilityList[randomKey];
    }

    async function updateEmbed(newMessage, endTimesStampString) {
      dialogueHistory += `\n- ${newMessage}`;
      const embed = new EmbedBuilder()
        .setColor(Embedcolors)
        .setDescription(
          `**${userName}** ${emoji(emo.versus)} **${bossName}**\n${emoji(
            emo.horloge
          )} **Fin Estimé du Duel :** ${endTimesStampString}\n\n${dialogueHistory}\n${emoji(
            emo.dot
          )}`
        )
        .setTitle(`⚔️  Duel contre ${bossName}`)
        .setImage(bossInfo.image)
        .addFields({
          name: "Récompense:",
          value: `__Victoire:__ ${recompenseV}${emoji(
            emo.power
          )}\n__Défaite:__ -${recompenseD}${emoji(emo.power)}`,
        });

      i.editReply({ embeds: [embed], components: [] });
    }

    async function simulateDuel() {
      // Durée totale du duel entre 30s et 5 minutes
      const minDuration = 30000; // 30 secondes
      const maxDuration = 300000; // 5 minutes
      const totalDuration =
        Math.floor(Math.random() * (maxDuration - minDuration + 1)) +
        minDuration;
      const endTimestamp = Math.floor((Date.now() + totalDuration) / 1000);
      const endTimesStampString = `<t:${endTimestamp}:R>`;
      const interval = totalDuration / (phases.length + 2);

      // Start phase
      let message = getRndPhrase(bossId, phases[0], winner);
      updateEmbed(`**${bossName2}**: *${message}*`, endTimesStampString);
      await new Promise((resolve) => setTimeout(resolve, interval));

      // Battle phases
      for (let j = 0; j < 3; j++) {
        if (j % 2 === 0) {
          message = getRndPhrase(bossId, phases[1], winner);
          updateEmbed(`**${bossName2}**: *${message}*`, endTimesStampString);
        } else {
          const abilityMessage = getRandomAbility(bossId);
          updateEmbed(
            `**${bossName2}**: *${abilityMessage}*`,
            endTimesStampString
          );
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      // End phase
      message = getRndPhrase(bossId, phases[2], winner);
      updateEmbed(`**${bossName2}**: *${message}*`, endTimesStampString);
      await new Promise((resolve) => setTimeout(resolve, 60000));
      let stringDesc = "";
      if (winner === "equal") {
        stringDesc = `\n\nVous avez fait match nul contre **${bossName}** Rien n'a été distribué`;
      } else if (!winner) {
        await dbManager.updatePower(userId, -recompenseD);
        const rest = Math.round(
          (bossScore / (playerScore + bossScore) -
            playerScore / (playerScore + bossScore)) *
            100
        );
        const restStat = Math.max(rest, 1);
        stringDesc = `\n\nVous avez perdu contre **${bossName}** et avez perdu **${recompenseD}**  ${emoji(
          emo.power
        )} stat restante boss : **${restStat}%**`;
      } else {
        await dbManager.updatePower(userId, recompenseV);
        const rest = Math.round(
          (playerScore / (playerScore + bossScore) -
            bossScore / (playerScore + bossScore)) *
            100
        );
        const restStat = Math.max(rest, 1);
        stringDesc = `\n\nVous avez gagné contre **${bossName}** et avez reçu **${recompenseV}**  ${emoji(
          emo.power
        )}\nstat restante : **${restStat}%**`;
      }

      const endEmbed = new EmbedBuilder()
        .setTitle("⚔️ Duel terminé")
        .setDescription(
          `Le duel contre **${bossName}** est terminé !` + stringDesc
        )
        .setColor(Embedcolors);

      await i.editReply({
        embeds: [endEmbed],
        components: [],
      });
    }
    simulateDuel();
  }
  async calculateBossBoosts(boss, dbManager, targetUser, bossInfo) {
    // Fonction utilitaire pour obtenir les données du matériau
    const getMateriauData = async (muId) => {
      if (muId === 0)
        return { level: 1, santeBoost: 0, attaqueBoost: 0, defenseBoost: 0 };

      const [materiauIdData] = (await dbManager.getIdMateriauByIdUnique(
        muId
      )) || [{}];
      const [materiauData] = (await dbManager.getDataMateriauById(
        materiauIdData.id
      )) || [{}];
      return {
        level: materiauIdData.level || 1,
        santeBoost: materiauData.santeBoost || 0,
        attaqueBoost: materiauData.attaqueBoost || 0,
        defenseBoost: materiauData.defenseBoost || 0,
      };
    };

    // Obtenir les données des matériaux
    const [materiau1Data, materiau2Data] = await Promise.all([
      getMateriauData(boss.muId1),
      getMateriauData(boss.muId2),
    ]);

    // Fonction utilitaire pour calculer les boosts totaux
    const calculateBoosts = (materiauData) => {
      const { santeBoost, attaqueBoost, defenseBoost, level } = materiauData;
      const factor = 1 + level * 0.2;

      return {
        santeBoost: santeBoost * factor,
        attaqueBoost: attaqueBoost * factor,
        defenseBoost: defenseBoost * factor,
      };
    };

    // Calcul des boosts pour chaque matériau
    const boostMat1 = calculateBoosts(materiau1Data);
    const boostMat2 = calculateBoosts(materiau2Data);
    const calculateMultiplier = (level) => {
      let multiplier = 1 + (level / 10) * 0.2;

      const bonusPer10Levels = Math.floor(level / 10) * 0.1;

      multiplier += bonusPer10Levels;

      return multiplier;
    };

    // Calcul du multiplicateur du boss basé sur son niveau
    const multiplier = calculateMultiplier(boss.level);
    const multiplier1 = calculateMultiplier(boss.level + 1);

    // Calcul des boosts totaux pour le boss avec le multiplicateur
    const boostedSanteBoss = Math.round(
      bossInfo.santeBoost * multiplier +
        boostMat1.santeBoost +
        boostMat2.santeBoost
    );
    const boostedAttaqueBoss = Math.round(
      bossInfo.attaqueBoost * (multiplier + 0.1) +
        boostMat1.attaqueBoost +
        boostMat2.attaqueBoost
    );
    const boostedDefenseBoss = Math.round(
      bossInfo.defenseBoost * multiplier +
        boostMat1.defenseBoost +
        boostMat2.defenseBoost
    );
    const boostedSanteBoss1 = Math.round(
      bossInfo.santeBoost * multiplier1 +
        boostMat1.santeBoost +
        boostMat2.santeBoost
    );
    const boostedAttaqueBoss1 = Math.round(
      bossInfo.attaqueBoost * (multiplier + 0.1) +
        boostMat1.attaqueBoost +
        boostMat2.attaqueBoost
    );
    const boostedDefenseBoss1 = Math.round(
      bossInfo.defenseBoost * multiplier1 +
        boostMat1.defenseBoost +
        boostMat2.defenseBoost
    );

    return {
      santeBoss: boostedSanteBoss,
      attaqueBoss: boostedAttaqueBoss,
      defenseBoss: boostedDefenseBoss,
      ///santeBoost + 1 lvl;
      santeBoost1: boostedSanteBoss1,
      attaqueBoost1: boostedAttaqueBoss1,
      defenseBoost1: boostedDefenseBoss1,
    };
  }
}
module.exports = Boss;
