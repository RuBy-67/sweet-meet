const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
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

    /*if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        );
      return interaction.reply({ embeds: [embed] });
    }*/

    // Check si l'user fait partie d'une guild
    const guild = await dbManager.getGuildByOwnerId(userId);

    if (guild.length < 0) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Aucune Guilde Trouvée ⚠️")
        .setColor(color.error)
        .setDescription(`> Vous ne possédez aucune guilde à supprimer.`)
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Sinon suprimmer la guilde (et associé)
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_delete")
        .setLabel("✅ Confirmer")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_delete")
        .setLabel("❌ Annuler")
        .setStyle(ButtonStyle.Secondary)
    );

    // Envoyer le message de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle("Confirmation de Suppression")
      .setColor(colors)
      .setDescription(
        "Êtes-vous sûr de vouloir supprimer votre guilde ? Cette action est irréversible, et vos fragments investis perdu."
      )
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.reply({
      embeds: [confirmEmbed],
      components: [confirmRow],
      ephemeral: true,
      fetchReply: true,
    });

    // Créer un collecteur pour les boutons
    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000, // 1 minute
    });

    collector.on("collect", async (i) => {
      if (i.customId === "confirm_delete") {
        // Supprimer la guilde si l'utilisateur confirme
        await dbManager.deleteGuildByOwnerId(userId);

        const successEmbed = new EmbedBuilder()
          .setTitle("Guilde supprimée")
          .setColor(colors)
          .setDescription(
            "Votre guilde a été supprimée avec succès ! (Vos sujets pleurent cette perte)"
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        await i.update({
          embeds: [successEmbed],
          components: [],
        });
      } else if (i.customId === "cancel_delete") {
        // Informer l'utilisateur que la suppression a été annulée
        const cancelEmbed = new EmbedBuilder()
          .setTitle("Suppression Annulée")
          .setColor(colors)
          .setDescription("La suppression de la guilde a été annulée.")
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        await i.update({
          embeds: [cancelEmbed],
          components: [],
        });
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        // Informer l'utilisateur que la demande a expiré
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("Temps Écoulé")
          .setColor(color.error)
          .setDescription("La demande de suppression de la guilde a expiré.")
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        await interaction.editReply({
          embeds: [timeoutEmbed],
          components: [],
        });
      }
    });
  },
};
