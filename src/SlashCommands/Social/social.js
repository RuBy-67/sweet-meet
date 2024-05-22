const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);

module.exports = {
  name: "social",
  description: "Social link of my devs",
  options: null,
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const embed = new EmbedBuilder()
      .setTitle("Social Owner Link")
      .setColor("#000000")
      .setDescription(
        `➼ ** | [${emoji(
          emo.git
        )} RuBy67](https://github.com/RuBy-67)**\n➼ ** | [${emoji(
          emo.x
        )} @Ru3y_67](https://x.com/Ru3y_67)**\n➼ ** | [${emoji(
          emo.insta
        )} @ru3y_67](https://www.instagram.com/ru3y_67?igsh=MXZ0aDFjZHZncTlzdw==)**\n➼ ** |** ${emoji(
          emo.discord
        )} <@375590278880428034>\n\n *Write me if you need any update in bot*`
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    return interaction.reply({ embeds: [embed] });
  },
};
