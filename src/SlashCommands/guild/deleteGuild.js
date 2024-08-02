const { EmbedBuilder } = require("discord.js");
const color = require(`../../jsons/color.json`);
const config = require("../../jsons/config.json");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();

module.exports = {
  name: "deleteguild",
  description: "Suprimmer votre guilde",
  options: null,
  run: async (client, interaction, args) => {
    const userId = interaction.user.id;
    const colors = await dbManager.getColor(userId);

    if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        );
      return interaction.reply({ embeds: [embed] });
    }

    // Check si l'user fait partie d'une guild
    const guild = await dbManager.getGuildByOwnerId(userId);

    if (!guild) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Aucune Guilde Trouvée ⚠️")
        .setColor(color.error)
        .setDescription(`> Vous ne possédez aucune guilde à supprimer.`)
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
      return interaction.reply({ embeds: [embed] });
    }

    // Sinon suprimmer la guilde (et associé)
    await dbManager.deleteGuildByOwnerId(userId);

    const embed = new EmbedBuilder()
      .setTitle("Guilde supprimée")
      .setColor(colors)
      .setDescription(`Votre guilde a été supprimée avec succès ! (triste)`)
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    return interaction.reply({ embeds: [embed] });
  },
};
