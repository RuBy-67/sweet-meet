const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);

module.exports = {
  name: "give",
  description: "[admin] donner power / materiel / badge à un joueur",
  options: null,
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const embed = new EmbedBuilder()
      .setTitle("Give - Commande Admin")
      .setColor(color.pink)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription()
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });
    return interaction.reply({ embeds: [embed] });
  },
};
