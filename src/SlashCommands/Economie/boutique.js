const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);

module.exports = {
  name: "boutique",
  description: "[economie] Acheter ou vendre un objet dans la boutique",
  options: [
    {
      name: "type",
      description: "Type de donnée",
      type: 3,
      required: true,
      choices: [
        {
          name: "buy",
          value: "buy",
        },
        {
          name: "sell",
          value: "sell",
        },
      ],
    },
  ],
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    const embed = new EmbedBuilder()
      .setTitle("buy -  ")
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
