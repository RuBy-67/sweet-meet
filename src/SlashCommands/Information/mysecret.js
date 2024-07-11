const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const config = require("../../jsons/config.json");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const param = require(`../../jsons/param.json`);
const Cooldown = require("../../class/cooldown");
const cooldown = new Cooldown();

module.exports = {
  name: "mysecret",
  description: "codeSecret pour les territoires",
  options: null,
  run: async (client, interaction, args) => {
    const cooldown = new Cooldown();
    const commandName = "codeSecret";
    const cooldownDuration = param.cooldownSecret;
    const cooldownInfo = await cooldown.handleCooldown(
      interaction,
      commandName,
      cooldownDuration
    );
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
    if (cooldownInfo) return;
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const userId = interaction.user.id;
    const colors = await dbManager.getColor(userId);
    const timestamp = Math.floor((Date.now() + 20 * 60 * 1000) / 1000);
    $code = await dbManager.generateSecretCode(userId);
    const embed = new EmbedBuilder()
      .setTitle("Social Queen Link")
      .setColor(colors)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        "Le code permet de vous connecter au site Web, Expire <t:" +
          timestamp +
          ":R>,\n\n Code: ``" +
          $code +
          "``\n\nLien généré: [SweetMeet](https://google.com/" +
          $code +
          ")"
      )
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
