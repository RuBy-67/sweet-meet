const param = require("../jsons/param.json");
const { EmbedBuilder } = require("discord.js");
const DatabaseManager = require("./dbManager");
const sqlQueriesBoss = require("./sqlQueriesBoss");
const { pool, poolBo, poolCampagne } = require("../db");
const duelMessages = require(`../jsons/gif.json`);
const emo = require(`../jsons/emoji.json`);
const dialog = require(`../jsons/dialogueBoss.json`);
const player = require(`./player`);
const playerManager = new player();
const dialogJoueur = require(`../jsons/gif.json`);
const dbManager = new DatabaseManager();

class Boss extends DatabaseManager {
  constructor() {
    super(pool, poolBo, poolCampagne);
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
  async startDuel(
    userId,
    bossInfo,
    difficulty,
    i,
    recompenseD,
    recompenseV,
    Embedcolors,
    client
  ) {
    const playerStats = await playerManager.getStatsById(userId); //playerStats.power playerStats.defense playerStats.attaque playerStats.sante
    let attaque = bossInfo.attaque;
    let defense = bossInfo.defense;
    let sante = bossInfo.sante;
    const multiplicateur = Math.random() * (15 - 1.5) + 1.5;

    if (difficulty === "1") {
      attaque = attaque * 0.3;
      defense = defense * 0.3;
      sante = sante * 0.3;
    } else if (difficulty === "2") {
      attaque = attaque * 0.75;
      defense = defense * 0.75;
      sante = sante * 0.75;
    } else if (difficulty === "3") {
      attaque = attaque * 1.88;
      defense = defense * 1.88;
      sante = sante * 1.88;
    } else if (difficulty === "4") {
      attaque = attaque * 2.88;
      defense = defense * 2.88;
      sante = sante * 2.97;
    } else if (difficulty === "0") {
      attaque = Math.round(attaque * 0.1);
      defense = Math.round(defense * 0.12);
      sante = Math.round(sante * 0.16);
    }
    let power = Math.round((attaque + defense + sante) * multiplicateur); // inconue du joueurs
    const playerScore = await this.getFightScore(
      playerStats.attaque,
      playerStats.defense,
      playerStats.sante,
      playerStats.power
    );
    let bossScore = await this.getFightScore(attaque, defense, sante, power);
    bossScore = bossScore * 0.22;
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

    if (diff < 0.04) {
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
        .setImage(bossInfo.image);

      i.editReply({ embeds: [embed] });
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
        const restStat = Math.round(
          (bossScore / (playerScore + bossScore) -
            playerScore / (playerScore + bossScore)) *
            100
        );
        stringDesc = `\n\nVous avez perdu contre **${bossName}** et avez perdu **${recompenseD}**  ${emoji(
          emo.power
        )} stat restante boss : **${restStat}%**`;
      } else {
        await dbManager.updatePower(userId, recompenseV);
        const restStat = Math.round(
          (playerScore / (playerScore + bossScore) -
            bossScore / (playerScore + bossScore)) *
            100
        );
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
}
module.exports = Boss;
