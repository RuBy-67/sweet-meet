/// Take all users from the server and create an account for them in the database + bonus power-up + "first-arrival" profile badge
const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const { connection } = require("../../db");

module.exports = {
  name: "create-accounts",
  description:
    "Créer un compte et donne le rôle first Arrival à tous les membres du serveur.",
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
        const result = await connection
          .promise()
          .query("SELECT * FROM user WHERE discordId = ?", [member.id]);

        if (result[0].length === 0) {
          // User does not exist in the database, create an account for them
          await connection
            .promise()
            .query(
              "INSERT INTO user (discordId, power, winCounter, loseCounter) VALUES (?, 20000, 0, 0)",
              [member.id]
            );

          // Insert the 'first-arrival' badge into the user's badge collection
          await connection
            .promise()
            .query("INSERT INTO badge_user (idUser, idBadge) VALUES (?, 1)", [
              member.id,
            ]);

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
        `Les comptes ont été créés et les badges donnés à ${i} membres. 20 000 Fragments ont été crédités à chaque membre.`
      )
      .setFooter({
        text: `Demandé par :  ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    // Edit the loading message with the embed
    await interaction.editReply({ embeds: [embed] });
  },
};
