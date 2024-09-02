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
        `Nous sommes tristes de te voir partir, **${member.username}** !`
      )
      .setFooter({
        text: `Nombre de membres : ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      });

    if (welcomeChannel) {
      welcomeChannel.send({ embeds: [embed] });
    }
    await dbManager.deleteUserData(member.id);
  },
};
