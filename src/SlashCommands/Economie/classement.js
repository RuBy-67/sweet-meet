const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();

module.exports = {
  name: "classement",
  description: "Affiche le classement des utilisateurs",
  run: async (client, interaction, args) => {
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
      const user = await interaction.guild.members.fetch(
        powerResult[i].discordId
      );
      powerDescription += `${i + 1}. <@${user.user.id}> : ${
        powerResult[i].power
      }\n`;
    }
    embed.addFields({
      name: "🏆 Top - Puissance",
      value: powerDescription,
      inline: true,
    });

    // Ranking by victories
    const winResult = await dbManager.getTopUsers("winCounter", top);
    let winDescription = "";
    for (let i = 0; i < winResult.length; i++) {
      const user = await interaction.guild.members.fetch(
        winResult[i].discordId
      );
      winDescription += `${i + 1}. <@${user.user.id}> : ${
        winResult[i].winCounter
      }\n`;
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
      const user = await interaction.guild.members.fetch(
        loseResult[i].discordId
      );
      loseDescription += `${i + 1}. <@${user.user.id}> : ${
        loseResult[i].loseCounter
      }\n`;
    }
    embed.addFields({
      name: "👎 Top - Looser__A REVOIRE",
      value: loseDescription,
      inline: true,
    });

    // Ranking by win rate
    const rateResult = await dbManager.getTopUsersByRate(top);
    let rateDescription = "";
    for (let i = 0; i < rateResult.length; i++) {
      const user = await interaction.guild.members.fetch(
        rateResult[i].discordId
      );
      rateDescription += `${i + 1}. <@${user.user.id}> : ${(
        rateResult[i].rate * 100
      ).toFixed(2)}%\n`;
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
