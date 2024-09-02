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
      .setDescription(
        `Nous sommes ravis de t'accueillir, **${member.username}** !`
      )
      .setFooter({
        text: `Nombre de membres : ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      });
  },
};
