const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);

module.exports = {
  name: "setmateriaux",
  description: "setActiveMateriaux",
  options: null,
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const embed = new EmbedBuilder()
      .setTitle("set -  ")
      .setColor(color.pink)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        "4 materiaux maximum peuvent être actif en même temps activer les avec précaution`"
      )
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });
    return interaction.reply({ embeds: [embed] });
  },
};
