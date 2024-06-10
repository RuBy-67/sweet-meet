const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const config = require("../../config.json");

module.exports = {
  name: "classement",
  description: "Affiche le classement des utilisateurs_ A revoire",
  run: async (client, interaction, args) => {
    if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        )
        .setColor(color.error);
      return interaction.reply({ embeds: [embed] });
    }
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    const embed = new EmbedBuilder()
      .setTitle(`Classement des utilisateurs`)
      .setColor(color.pink);

    const top = 5;

    // Ranking by power
    const powerResult = await dbManager.getTopUsers("power", top);
    let powerDescription = "";
    for (let i = 0; i < powerResult.length; i++) {
      const user = `${powerResult[i].discordId}`;
      if (user === undefined) {
        powerDescription += `${i + 1}. Utilisateur inconnu : ${
          powerResult[i].power
        }\n`;
      } else {
        powerDescription += `${i + 1}. <@${user}> : ${
          powerResult[i].power
        } ${emoji(emo.power)}\n`;
      }
    }
    embed.addFields({
      name: "🏆 Top - Fragments de Protection",
      value: powerDescription,
      inline: true,
    });

    // Ranking by victories
    const winResult = await dbManager.getTopUsers("winCounter", top);
    let winDescription = "";
    for (let i = 0; i < winResult.length; i++) {
      const user = `${winResult[i].discordId}`;
      if (user === undefined) {
        winDescription += `${i + 1}. Utilisateur inconnu : ${
          winResult[i].winCounter
        }\n`;
      } else {
        winDescription += `${i + 1}. <@${user}> : ${winResult[i].winCounter}\n`;
      }
    }
    embed.addFields({ name: " ", value: " ", inline: true });
    embed.addFields({
      name: "👑 Top - Victoires",
      value: winDescription,
      inline: true,
    });

    // Ranking by defeats
    const loseResult = await dbManager.getTopUsers("loseCounter", top);
    let loseDescription = "";
    for (let i = 0; i < loseResult.length; i++) {
      const user = `${loseResult[i].discordId}`;
      if (user === undefined) {
        loseDescription += `${i + 1}. Utilisateur inconnu : ${
          loseResult[i].loseCounter
        }\n`;
      } else {
        loseDescription += `${i + 1}. <@${user}> : ${
          loseResult[i].loseCounter
        }\n`;
      }
    }
    embed.addFields({
      name: "👎 Top - Looser",
      value: loseDescription,
      inline: true,
    });

    // Ranking by win rate
    const rateResult = await dbManager.getTopUsersByRate(top);
    let rateDescription = "";
    for (let i = 0; i < rateResult.length; i++) {
      const user = await `${rateResult[i].discordId}`;
      if (user === undefined) {
        rateDescription += `${i + 1}. Utilisateur inconnu : ${(
          rateResult[i].rate * 100
        ).toFixed(2)}%\n`;
      } else {
        rateDescription += `${i + 1}. <@${user}> : ${(
          rateResult[i].rate * 100
        ).toFixed(2)}%\n`;
      }
    }
    embed.addFields({ name: " ", value: " ", inline: true });
    embed.addFields({
      name: "👑 Top - Taux de victoire",
      value: rateDescription,
      inline: true,
    });

    return interaction.reply({ embeds: [embed] });
  },
};
