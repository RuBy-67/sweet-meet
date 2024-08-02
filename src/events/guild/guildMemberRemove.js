const { EmbedBuilder } = require("discord.js");
const { welcome } = require("../../jsons/config.json");
const color = require("../../jsons/color.json");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();

module.exports = {
  name: "guildMemberRemove",
  execute: async (member) => {
    const welcomeChannel = member.guild.channels.cache.get(welcome);

    const embed = new EmbedBuilder()
      .setTitle("Au revoir !")
      .setColor(color.pink)
      .setDescription(
        `Nous sommes tristes de te voir partir, <@${member.id}> !`
      )
      .setFooter({
        text: `Nombre de membres : ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      });

    try {
      const result = await dbManager.getUserData(member.id);

      if (result.length === 0) {
        console.log(
          `Le compte pour l'utilisateur ${member.id} n'existe pas dans la base de données principale.`
        );
        if (welcomeChannel) {
          welcomeChannel.send({ embeds: [embed] });
        } else {
          console.log(`Le salon de bienvenue spécifié n'existe pas.`);
        }
        return;
      }

      const userData = result[0];

      await dbManager.insertBackupUserData(userData);

      const materiauData = await dbManager.getMateriauData(userData.discordId);
      for (const materiau of materiauData) {
        await dbManager.insertBackupMateriauData(materiau);
      }

      const badgeData = await dbManager.getBadgeData(userData.discordId);
      for (const badge of badgeData) {
        await dbManager.insertBackupBadgeData(badge);
      }

      await dbManager.deleteUserData(userData.discordId);

      console.log(`Profil supprimé pour l'utilisateur ${member.id}`);

      if (welcomeChannel) {
        welcomeChannel.send({ embeds: [embed] });
      } else {
        console.log(`Le salon de bienvenue spécifié n'existe pas.`);
      }
    } catch (err) {
      console.error(err);
    }
  },
};
