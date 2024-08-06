const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const param = require("../../jsons/param.json");
const Player = require("../../class/player");
const player = new Player();
const Cooldown = require("../../class/cooldown");
const cooldown = new Cooldown();
const config = require("../../jsons/config.json");

module.exports = {
  name: "freedaylibox",
  description: "Réclamez votre free daily box",
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
    const commandName = "freedaylibox";
    const cooldownDuration = param.cooldownBox;
    const cooldownMessage = `Vous avez déjà réclamé votre free daily box. Veuillez réessayer dans quelques heures.`;
    const cooldownInfo = await cooldown.handleCooldown(
      interaction,
      commandName,
      cooldownDuration,
      cooldownMessage
    );
    if (cooldownInfo) return;

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const userId = interaction.user.id;
    const colors = await dbManager.getColor(userId);
    const { material, power } = await player.freeDayliBox(userId);

    const embed = new EmbedBuilder()
      .setTitle("Votre Free Daily Box")
      .setColor(colors)
      .setDescription(`Voici ce que vous avez reçu dans votre free daily box:`);
    if (material) {
      embed.addFields({
        name: "Matériau",
        value: `${emoji(emo[material.nom])} ${material.nom}`,
        inline: true,
      });
      await player.addMaterialToUser(userId, material.id);
    } else {
      embed.addFields({
        name: "Matériau",
        value: "Aucun matériau reçu",
        inline: true,
      });
    }

    embed
      .addFields({
        name: "Fragment de protection",
        value: `${power} ${emoji(emo.power)}`,
        inline: true,
      })
      .setTimestamp()
      .setFooter({
        text: "Le royaume de Valoria vous remercie !",
        iconURL: client.user.avatarURL(),
      });
    await player.updatePower(userId, power);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
