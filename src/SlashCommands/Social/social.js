const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const config = require("../../jsons/config.json");

module.exports = {
  name: "social",
  description: "Social link of my queen (devs)",
  options: null,
  run: async (client, interaction, args) => {
    if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        )
        .setColor(color.error);
      return interaction.reply({ embeds: [embed] });
    }
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const embed = new EmbedBuilder()
      .setTitle("Social Queen Link")
      .setColor(color.pink)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `➼ ** | [${emoji(
          emo.git
        )} RuBy67](https://github.com/RuBy-67)**\n➼ ** | [${emoji(
          emo.x
        )} @Ru3y_67](https://x.com/Ru3y_67)**\n➼ ** | [${emoji(
          emo.insta
        )} @ru3y_67](https://www.instagram.com/ru3y_67?igsh=MXZ0aDFjZHZncTlzdw==)**\n➼ ** |** ${emoji(
          emo.discord
        )} <@375590278880428034>\n\n *Besoin d'une Update, un beug ? DM moi 😉*`
      )
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });
    return interaction.reply({ embeds: [embed] });
  },
};
