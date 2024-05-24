const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const { connection } = require("../../db");

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

    // Classement par puissance
    const powerResult = await connection
      .promise()
      .query("SELECT * FROM user ORDER BY power DESC LIMIT ?", [top]);
    let powerDescription = "";
    for (let i = 0; i < powerResult[0].length; i++) {
      const user = await interaction.guild.members.fetch(
        powerResult[0][i].discordId
      );
      powerDescription += `${i + 1}. <@${user.user.id}> : ${
        powerResult[0][i].power
      }\n`;
    }
    embed.addFields({
      name: "🏆 Top - Puissance",
      value: powerDescription,
      inline: true,
    });

    // Classement par victoires
    const winResult = await connection
      .promise()
      .query("SELECT * FROM user ORDER BY winCounter DESC LIMIT ?", [top]);
    let winDescription = "";
    for (let i = 0; i < winResult[0].length; i++) {
      const user = await interaction.guild.members.fetch(
        winResult[0][i].discordId
      );
      winDescription += `${i + 1}. <@${user.user.id}> : ${
        winResult[0][i].winCounter
      }\n`;
    }
    embed.addFields({ name: " ", value: " ", inline: true });
    embed.addFields({
      name: "👑 Top - Victoires",
      value: winDescription,
      inline: true,
    });

    // Classement par défaites
    const loseResult = await connection
      .promise()
      .query("SELECT * FROM user ORDER BY loseCounter DESC LIMIT ?", [top]);
    let loseDescription = "";
    for (let i = 0; i < loseResult[0].length; i++) {
      const user = await interaction.guild.members.fetch(
        loseResult[0][i].discordId
      );
      loseDescription += `${i + 1}. <@${user.user.id}> : ${
        loseResult[0][i].loseCounter
      }\n`;
    }
    embed.addFields({
      name: "👎 Top - Looser__A REVOIRE",
      value: loseDescription,
      inline: true,
    });

    // Classement par taux de victoire
    const rateResult = await connection
      .promise()
      .query(
        "SELECT * FROM user WHERE winCounter + loseCounter > 0 ORDER BY winCounter / (winCounter + loseCounter) DESC LIMIT ?",
        [top]
      );
    let rateDescription = "";
    for (let i = 0; i < rateResult[0].length; i++) {
      const user = await interaction.guild.members.fetch(
        rateResult[0][i].discordId
      );
      rateDescription += `${i + 1}. <@${user.user.id}> : ${(
        (rateResult[0][i].winCounter /
          (rateResult[0][i].winCounter + rateResult[0][i].loseCounter)) *
        100
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
