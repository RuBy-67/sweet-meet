const { EmbedBuilder } = require("discord.js");
const { welcome } = require("../../jsons/config.json");
const { connection, connectionBo } = require("../../db");
const color = require(`../../jsons/color.json`);
const Player = require("../../class/player");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const player = new Player();

module.exports = {
  name: "guildMemberAdd",
  execute: async (member) => {
    const welcomeChannel = member.guild.channels.cache.get(welcome);

    // Create welcome message embed
    const embed = new EmbedBuilder()
      .setTitle("Bienvenue sur notre serveur !")
      .setColor(color.pink)
      .setDescription(`Nous sommes ravis de t'accueillir, <@${member.id}> !`)
      .setFooter({
        text: `Nombre de membres : ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      });

    try {
      // Check if the user exists in the main database
      const [userExists] = await player.getUserData(member.id);

      if (!userExists) {
        // User doesn't exist in the main database, check backup database
        const [backupUserData] = await dbManager.getUserDataBo(member.id);

        if (backupUserData) {
          // Insert user data into the main database
          await dbManager.insertUserData(backupUserData);

          // Import materiau data
          const materiauData = await dbManager.getMateriauData(
            backupUserData.discordId
          );
          for (const materiau of materiauData) {
            await dbManager.insertMateriauData(
              backupUserData.discordId,
              materiau.idMateriau,
              materiau.lvl
            );
            console.log(`Matière réimportée pour l'utilisateur ${member.id}`);
          }

          // Import badge data
          const badgeData = await dbManager.getBadgeData(
            backupUserData.discordId
          );
          for (const badge of badgeData) {
            await dbManager.insertBadgeData(
              backupUserData.discordId,
              badge.idBadge
            );
            console.log(`Badge réimporté pour l'utilisateur ${member.id}`);
          }

          // Delete backup data
          await dbManager.deleteBackupData(backupUserData.discordId);
        } else {
          // User doesn't exist in backup database either, insert into main database
          await dbManager.insertUserData({ discordId: member.id });
        }
      }

      // Send welcome message
      if (welcomeChannel) {
        welcomeChannel.send({ embeds: [embed] });
      } else {
        console.log(`No Welcome Room Find`);
      }
    } catch (error) {
      console.error("Error during guildMemberAdd execution:", error);
    }
  },
};
