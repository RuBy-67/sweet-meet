const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const { pool } = require("../../db");

module.exports = {
  name: "create-accounts",
  description: "Créer un compte pour tous les membres du serveur.",
  options: null,
  run: async (client, interaction, args) => {
    // Check if user have the permission to use this command
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({
        content: "Vous n'avez pas la permission d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: "Création des comptes en cours...",
      ephemeral: true,
    });

    let i = 0;
    // Get all members of the server
    const members = await interaction.guild.members.fetch();

    // Loop through all members and create an account for them if they are not bots
    for (const member of members.values()) {
      if (!member.user.bot) {
        const [result] = await pool.execute(
          "SELECT * FROM user WHERE discordId = ?",
          [member.id]
        );

        if (result.length === 0) {
          // User does not exist in the database, create an account for them
          await pool.execute(
            "INSERT INTO user (discordId, power, winCounter, loseCounter) VALUES (?, 5000, 0, 0)",
            [member.id]
          );

          console.log(`Account created for user ${member.user.tag}`);
          i++;
        } else {
          console.log(`User ${member.user.tag} already has an account`);
        }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("Accounts Created")
      .setColor(color.pink)
      .setDescription(
        `Les comptes ont été créés pour ${i} membres. avec 5000 Fragments. `
      )
      .setFooter({
        text: `Demandé par :  ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    // Edit the loading message with the embed
    await interaction.editReply({ embeds: [embed] });
  },
};
